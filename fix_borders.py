import glob
import re

files = glob.glob('frontend/src/**/*.tsx', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # softer dark mode borders
    new_content = re.sub(r'dark:border-slate-800(?=[\\s\\"\\\'/a-zA-Z-])', 'dark:border-white/5', content)
    new_content = re.sub(r'dark:border-white/10(?=[\\s\\"\\\'/a-zA-Z-])', 'dark:border-white/5', new_content)
    
    # Also soften some divides if any
    new_content = re.sub(r'dark:divide-slate-800(?=[\\s\\"\\\'/a-zA-Z-])', 'dark:divide-white/5', new_content)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Updated {f}')
