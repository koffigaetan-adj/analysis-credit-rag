import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = [
        # Regular (no hover/focus prefix)
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)bg-\[\#0a0d14\](?!\/)', r'bg-slate-50 dark:bg-[#0a0d14]'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)bg-\[\#0a0d14\]\/80', r'bg-white/80 dark:bg-[#0a0d14]/80'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)bg-white\/5', r'bg-white dark:bg-white/5'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)bg-white\/10', r'bg-slate-100 dark:bg-white/10'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)border-white\/10', r'border-slate-200 dark:border-white/10'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)border-white\/5', r'border-slate-100 dark:border-white/5'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)text-white', r'text-slate-900 dark:text-white'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)text-slate-100', r'text-slate-800 dark:text-slate-100'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)text-slate-200', r'text-slate-800 dark:text-slate-200'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)text-slate-300', r'text-slate-700 dark:text-slate-300'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)text-slate-400', r'text-slate-500 dark:text-slate-400'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)shadow-2xl', r'shadow-sm dark:shadow-2xl'),
        (r'(?<!dark:)(?<!hover:)(?<!focus:)(?<!group-focus-within:)divide-white\/5', r'divide-slate-200 dark:divide-white/5'),
        
        # Hover
        (r'(?<!dark:)hover:bg-\[\#0a0d14\]', r'hover:bg-slate-100 dark:hover:bg-[#0a0d14]'),
        (r'(?<!dark:)hover:bg-white\/5', r'hover:bg-slate-50 dark:hover:bg-white/5'),
        (r'(?<!dark:)hover:bg-white\/10', r'hover:bg-slate-200 dark:hover:bg-white/10'),
        (r'(?<!dark:)hover:border-white\/10', r'hover:border-slate-300 dark:hover:border-white/10'),
        (r'(?<!dark:)hover:text-white', r'hover:text-slate-900 dark:hover:text-white'),
        (r'(?<!dark:)hover:text-slate-400', r'hover:text-slate-600 dark:hover:text-slate-400'),
        (r'(?<!dark:)hover:shadow-2xl', r'hover:shadow-md dark:hover:shadow-2xl'),

        # Focus
        (r'(?<!dark:)focus:bg-\[\#0a0d14\]', r'focus:bg-white dark:focus:bg-[#0a0d14]'),
        (r'(?<!dark:)focus:border-white\/10', r'focus:border-blue-500/50 dark:focus:border-white/10'),
        (r'(?<!dark:)focus:ring-white\/20', r'focus:ring-blue-500/20 dark:focus:ring-white/20'),
    ]

    new_content = content
    for pattern, repl in replacements:
        new_content = re.sub(pattern, repl, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

pages_to_fix = [
    'Dashboard.tsx', 'List.tsx', 'Team.tsx', 'Settings.tsx', 
    'Chat.tsx', 'Prediction.tsx', 'NewAnalysis.tsx'
]
base_dir = r"c:\Users\gerau\Documents\analysis-credit-rag\frontend\src"
for page in pages_to_fix:
    path = os.path.join(base_dir, 'pages', page)
    if os.path.exists(path): process_file(path)
process_file(os.path.join(base_dir, 'components', 'UpdatePasswordModal.tsx'))
