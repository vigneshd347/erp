import re
import glob

# For all files, check if the full group exists. I will just replace the whole group.
target_sidebar_str = """                    <div class="nav-group-content">
                        <a href="inventory.html" class="nav-item nested ">Inventory</a>
                        <a href="jobwork.html" class="nav-item nested ">Job Work</a>
                    </div>"""

replacement_sidebar_str = """                    <div class="nav-group-content">
                        <a href="inventory.html" class="nav-item nested ">Inventory</a>
                        <a href="jobwork.html" class="nav-item nested ">Job Work</a>
                        <a href="design-book.html" class="nav-item nested ">Design Book</a>
                        <a href="tree-making.html" class="nav-item nested ">Tree Making</a>
                    </div>"""

for f in ['design-book.html', 'tree-making.html']:
    with open(f, 'r') as file:
        content = file.read()
    
    # regex to find the items navigation block
    content = re.sub(r'<div class="nav-group-content">\s*<a href="inventory\.html" class="nav-item nested[^>]*>Inventory</a>\s*<a href="jobwork\.html" class="nav-item nested[^>]*>Job Work</a>\s*(<a href="design-book\.html"[^>]*>Design Book</a>)?\s*</div>', replacement_sidebar_str, content)
    
    with open(f, 'w') as file:
        file.write(content)
    print(f"Fixed sidebar in {f}")
