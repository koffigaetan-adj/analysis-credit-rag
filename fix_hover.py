import glob
import re

files = glob.glob('frontend/src/**/*.tsx', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()

    # ensure Header has the right background
    if 'Header.tsx' in f.replace('\\\\', '/'):
        content = content.replace('dark:bg-[#0a0d14]/80', 'dark:bg-slate-950/80 backdrop-blur-xl')
        content = content.replace('dark:bg-slate-950/80 backdrop-blur-xl backdrop-blur-xl', 'dark:bg-slate-950/80 backdrop-blur-xl')
        content = content.replace('dark:bg-[#0a0d14]', 'dark:bg-slate-950')
    
    # ensure buttons have hover shadow
    lines = content.split('\n')
    modified = False
    for i, line in enumerate(lines):
        if 'className=' in line and ('<button' in line or '<Link' in line or 'className=\"' in line):
            if 'bg-blue-600' in line and 'hover:shadow' not in line:
                old_line = lines[i]
                lines[i] = re.sub(r'transition-all(?![a-zA-Z-])', 'hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300', line)
                if lines[i] == old_line:
                    lines[i] = re.sub(r'\"( *|)$', ' hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300\"', line)
                modified = True
            elif 'bg-rose-600' in line and 'hover:shadow' not in line:
                 lines[i] = re.sub(r'transition-all', 'hover:shadow-lg hover:shadow-rose-500/20 transition-all duration-300', line)
                 modified = True

    new_content = '\n'.join(lines)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Updated {f}')
