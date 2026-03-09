import os
import json
import re
import uuid

directories = ['frontend/src/pages', 'frontend/src/components']
files_to_process = []
for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') and file not in ['Icons.tsx', 'index.tsx', 'main.tsx', 'App.tsx']:
                files_to_process.append(os.path.join(root, file))

fr_json_path = 'frontend/src/locales/fr/translation.json'
with open(fr_json_path, 'r', encoding='utf-8') as f:
    fr_data = json.load(f)

def sanitize_key(text):
    text = text.strip()
    # keep only alpha chars for key
    text = re.sub(r'[^a-zA-Z0-9]+', '_', text).strip('_').lower()
    return text[:20] if text else "text"

def generate_unique_key(component_data, base_key, original_text):
    key = base_key
    counter = 1
    while key in component_data and component_data[key] != original_text:
        key = f"{base_key}_{counter}"
        counter += 1
    return key

# TEXT_REGEX: Finds >Text< ignoring inner tags if possible, but safely.
# A simpler approach: find > [Text] < where [Text] has at least one letter.
TEXT_REGEX = re.compile(r'>\s*([^{}<>]+[a-zA-ZÀ-ÿ][^{}<>]*?)\s*<')
PLACEHOLDER_REGEX = re.compile(r'placeholder="([^"]*[a-zA-ZÀ-ÿ][^"]*)"')
TITLE_REGEX = re.compile(r'title="([^"]*[a-zA-ZÀ-ÿ][^"]*)"')

for file_path in files_to_process:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    component_name = os.path.basename(file_path).replace('.tsx', '').lower()
    if component_name not in fr_data:
        fr_data[component_name] = {}
        
    original_content = content
    replacements = [] # list of (start, end, replacement)

    # 1. Text Nodes
    for match in TEXT_REGEX.finditer(content):
        text = match.group(1).strip()
        if not text or len(text) < 2: continue
        
        # Skip if it looks like code or variable 
        if '{' in text or '}' in text or '=>' in text or 'className=' in text: continue

        key = sanitize_key(text)
        key = generate_unique_key(fr_data[component_name], key, text)
        fr_data[component_name][key] = text
        
        replacement = f">{{t('{component_name}.{key}')}}<"
        
        # match.group(0) is > text <, match.group(1) is text. 
        # We replace the whole group 0 preserving the > and < but removing spaces
        replacements.append((match.start(), match.end(), replacement))

    # Apply text replacements from end to start
    replacements.sort(key=lambda x: x[0], reverse=True)
    for start, end, rep in replacements:
        content = content[:start] + rep + content[end:]
        
    replacements = []

    # 2. Placeholders
    for match in PLACEHOLDER_REGEX.finditer(content):
        text = match.group(1).strip()
        if not text or '{' in text: continue
        
        key = sanitize_key(text)
        key = generate_unique_key(fr_data[component_name], key, text)
        fr_data[component_name][key] = text
        
        replacement = f"placeholder={{t('{component_name}.{key}')}}"
        replacements.append((match.start(), match.end(), replacement))

    # Apply placeholders
    replacements.sort(key=lambda x: x[0], reverse=True)
    for start, end, rep in replacements:
        content = content[:start] + rep + content[end:]

    replacements = []

    # 3. Titles
    for match in TITLE_REGEX.finditer(content):
        text = match.group(1).strip()
        if not text or '{' in text: continue
        
        key = sanitize_key(text)
        key = generate_unique_key(fr_data[component_name], key, text)
        fr_data[component_name][key] = text
        
        replacement = f"title={{t('{component_name}.{key}')}}"
        replacements.append((match.start(), match.end(), replacement))
        
    # Apply Titles
    replacements.sort(key=lambda x: x[0], reverse=True)
    for start, end, rep in replacements:
        content = content[:start] + rep + content[end:]

    # If the file was modified, we must inject `import { useTranslation }` and `const { t } = useTranslation();`
    if content != original_content:
        if 'useTranslation' not in content:
            # Add import after the last import
            imports = re.findall(r'^import [^\n]+', content, re.MULTILINE)
            if imports:
                last_import = imports[-1]
                content = content.replace(last_import, last_import + "\nimport { useTranslation } from 'react-i18next';")
            else:
                content = "import { useTranslation } from 'react-i18next';\n" + content
                
        if 'const { t } = useTranslation();' not in content:
            # Find the main functional component
            match = re.search(r'export default function\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*{', content)
            if match:
                injection_point = match.end()
                content = content[:injection_point] + "\n  const { t } = useTranslation();" + content[injection_point:]
            else:
                 # fallback for const Component = () => {
                 match = re.search(r'const\s+[a-zA-Z0-9_]+\s*=\s*(?:React\.FC[^=]*)?=\s*\([^)]*\)\s*=>\s*{', content)
                 if match:
                     injection_point = match.end()
                     content = content[:injection_point] + "\n  const { t } = useTranslation();" + content[injection_point:]

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Extraction finished.")
with open(fr_json_path, 'w', encoding='utf-8') as f:
    json.dump(fr_data, f, indent=4, ensure_ascii=False)
