import os
import json
import re

directories = ['frontend/src/pages', 'frontend/src/components']
files_to_process = []
for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') and file != 'Icons.tsx':
                files_to_process.append(os.path.join(root, file))

fr_json_path = 'frontend/src/locales/fr/translation.json'
with open(fr_json_path, 'r', encoding='utf-8') as f:
    fr_data = json.load(f)

# Very basic extraction logic for demonstration.
# In a real scenario, this requires parsing AST, but we'll use regex to target text within tags.
# Example: <h1>Paramètres</h1> -> <h1>{t('componentName.paramtres')}</h1>

def sanitize_key(text):
    text = text.strip()
    text = re.sub(r'[^a-zA-Z0-9]+', '_', text).strip('_').lower()
    return text[:20] if text else "empty_key"

total_added = 0

for file_path in files_to_process:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    component_name = os.path.basename(file_path).replace('.tsx', '').lower()
    if component_name not in fr_data:
        fr_data[component_name] = {}
        
    original_content = content

    # Find text inside tags, e.g. >Texte<
    # We must be extremely careful to avoid breaking TSX syntax (like {'{'})
    matches = re.finditer(r'>([A-ZÀ-ÿ][^<{}]+)</', content)
    
    replacements = []
    
    for match in matches:
        full_match = match.group(0) # >Texte</
        text_content = match.group(1).strip()
        
        # Skip purely numeric or very short
        if not text_content or len(text_content) < 2 or text_content.isnumeric():
            continue
            
        key = sanitize_key(text_content)
        
        # Avoid duplicate keys overwriting different text
        original_key = key
        counter = 1
        while key in fr_data[component_name] and fr_data[component_name][key] != text_content:
            key = f"{original_key}_{counter}"
            counter += 1
            
        fr_data[component_name][key] = text_content
        
        # Prepare replacement: `>{t('component_name.key')}</`
        replacement = f">{{t('{component_name}.{key}')}}</"
        # We index the replacement manually because doing it string-wide might replace wrong things
        replacements.append((match.start() + 1, match.end(), replacement))

    # Apply replacements from end to start to not mess up indices
    for start, end, replacement in reversed(replacements):
        content = content[:start] + replacement + content[end:]
        total_added += 1

    # Inject useTranslation import if we modified the file
    if content != original_content:
         if 'useTranslation' not in content:
             content = "import { useTranslation } from 'react-i18next';\n" + content
         
         # Inject hook inside component (this requires knowing the component signature)
         # simplified for demonstration, we look for `export default function Component()`
         import_block = "const { t } = useTranslation();\n"
         content = re.sub(r'(export default function[^{]+{)', r'\1\n  ' + import_block, content, count=1)
         
         with open(file_path, 'w', encoding='utf-8') as f:
             f.write(content)
             
print(f"Total entries added: {total_added}")
with open(fr_json_path, 'w', encoding='utf-8') as f:
    json.dump(fr_data, f, indent=4, ensure_ascii=False)
