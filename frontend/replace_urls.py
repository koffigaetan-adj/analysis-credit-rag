import os
import re

directory = 'src'
pattern = re.compile(r"(['\"`])(http://localhost:8000|http://127.0.0.1:8000)(.*?)\1")

def replace_match(match):
    suffix = match.group(3)
    # Return a template literal in all cases.
    return f"`${{import.meta.env.VITE_API_URL}}{suffix}`"

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub(replace_match, content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
print("Done.")
