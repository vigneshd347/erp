import os
import glob
import re

html_files = glob.glob('*.html')

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'seed_data.js' not in content and 'supabase.js' in content:
        new_content = re.sub(
            r'(<script\s+src=["\']supabase\.js[^"\']*["\']><\/script>)',
            r'<script src="seed_data.js"></script>\n    \1',
            content,
            count=1
        )
        if new_content != content:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Injected seed_data.js into {fpath}")

