import glob
import re

count = 0
for file in glob.glob('*.html'):
    if file == 'expenses.html':
        continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'expenses.html' in content:
        continue
        
    pattern = r'(<a href="payment-made\.html"[^>]*>.*?</a>)'
    replacement = r'\1\n                        <a href="expenses.html" class="nav-item nested ">Expenses</a>'
    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
        print(f"Patched {file}")

print(f"Total files patched: {count}")
