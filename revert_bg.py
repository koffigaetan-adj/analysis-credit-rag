import glob
import re

files = glob.glob('frontend/src/**/*.tsx', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Revert backgrounds
    new_content = re.sub(r'dark:bg-\\[#0a0d14\\](?=[\\s\\"\\\'/a-zA-Z-])', 'dark:bg-slate-950', content)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Updated {f}')
