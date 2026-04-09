import os
import re
import glob

# Pattern to find the jobwork.html link block
pattern = re.compile(r'(<a href="jobwork\.html" class="[^"]*">\s*Job Work\s*</a>\s*)')
replace_with = r'\1                        <a href="design-book.html" class="nav-item nested ">Design Book</a>\n'

count = 0
for f in glob.glob('*.html'):
    if f == 'design-book.html':
        continue
    with open(f, 'r') as file:
        content = file.read()
    
    # Simple check if already injected
    if 'href="design-book.html"' in content:
        print(f"Skipped {f} (Already injected)")
        continue
        
    if pattern.search(content):
        new_content = pattern.sub(replace_with, content)
        with open(f, 'w') as file:
            file.write(new_content)
        count += 1
        print(f"Updated {f}")
    else:
        print(f"Skipped {f} (pattern not found)")

print(f"\nTotal fixed files updated: {count}")
