import os
import glob
import re

files = glob.glob('*.html')
count = 0

pattern = re.compile(r'(\s*)<a href="create-invoice\.html"[^>]*>Invoices</a>')

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    match = pattern.search(content)
    if match:
        indent = match.group(1)
        full_match = match.group(0)
        # Check if already injected
        if 'customer-order.html' in content:
            print(f"Skipped {f} (already injected)")
            continue
        
        # Inject customer-order.html after invoices
        replacement = f"{full_match}\n{indent}<a href=\"customer-order.html\" class=\"nav-item nested \">Customer Orders</a>"
        new_content = content.replace(full_match, replacement)
        with open(f, 'w') as file:
            file.write(new_content)
        count += 1
        print(f"Updated {f}")
    else:
        print(f"Skipped {f} (pattern not found)")

print(f"\nTotal files updated: {count}")
