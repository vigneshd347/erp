import os
import glob
import re

files = glob.glob('*.html')
count = 0

# Pattern to find Dashboard link
dash_pattern = re.compile(
    r'(\s*)<a href="index\.html" class="nav-item[^"]*">\s*<div class="icon"><i data-lucide="layout-dashboard"></i></div>\s*<span class="label">Dashboard</span>\s*</a>',
    re.IGNORECASE
)

# Pattern to find nested Quotations link (with potential whitespace and tags)
nested_pattern = re.compile(
    r'\s*<a href="quotation\.html" class="nav-item nested[^"]*">\s*(?:<div class="icon"><i[^>]*></i></div>\s*|<i[^>]*></i>\s*)?<span class="label">Quotations?</span>\s*</a>\s*',
    re.IGNORECASE
)

# Alternative nested pattern (simple)
nested_pattern_simple = re.compile(
    r'\s*<a href="quotation\.html" class="nav-item nested[^"]*">Quotations?</a>\s*',
    re.IGNORECASE
)

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    # 1. Check/Inject top level
    match = dash_pattern.search(content)
    if match:
        indent = match.group(1)
        full_match = match.group(0)
        
        # If top level link not in file, inject it
        if 'href="quotation.html" class="nav-item"' not in content and 'href="quotation.html" class="nav-item active"' not in content:
            # Determine if active based on filename
            is_active = " active" if f == 'quotation.html' else ""
            replacement = f"{full_match}\n{indent}<a href=\"quotation.html\" class=\"nav-item{is_active}\">\n{indent}    <div class=\"icon\"><i data-lucide=\"file-text\"></i></div>\n{indent}    <span class=\"label\">Quotations</span>\n{indent}</a>"
            content = content.replace(full_match, replacement)
            print(f"Injected top-level Quotations in {f}")
        
        # 2. Remove nested duplicate
        original_len = len(content)
        content = nested_pattern.sub('\n', content)
        content = nested_pattern_simple.sub('\n', content)
        if len(content) < original_len:
            print(f"Removed nested Quotations duplicate in {f}")
            
        with open(f, 'w') as file:
            file.write(content)
        count += 1
    else:
        # Check if it has the standard layout anyway
        pass

print(f"\nTotal files processed: {count}")
