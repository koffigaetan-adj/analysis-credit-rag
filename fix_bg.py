import glob
import re

files = glob.glob('frontend/src/**/*.tsx', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace background classes
    new_content = re.sub(r'dark:bg-slate-9([05])0(?=[\s\"\'/a-zA-Z-])', 'dark:bg-[#0a0d14]', content)
    
    # Replace border colors if user also wants a darker look, but let's just stick to backgrounds
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Updated {f}')
