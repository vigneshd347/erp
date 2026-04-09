import re
import glob

# Pattern to find the design-book.html link block
pattern = re.compile(r'(<a href="design-book\.html" class="[^"]*">\s*Design Book\s*</a>\s*)')
replace_with = r'\1                        <a href="tree-making.html" class="nav-item nested ">Tree Making</a>\n'

count = 0
for f in glob.glob('*.html'):
    with open(f, 'r') as file:
        content = file.read()
    
    if 'href="tree-making.html"' in content:
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
