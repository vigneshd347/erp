import re

with open('inventory.html', 'r') as f:
    inv = f.read()

with open('tree-making.html', 'r') as f:
    tree = f.read()

# Extract everything up to <main class="main-content"
match = re.search(r'(.*?)<main class="main-content"', inv, re.DOTALL)
if match:
    correct_header = match.group(1)
    
    # replace the <title>
    correct_header = re.sub(r'<title>.*?</title>', '<title>Manti ERP - Tree Making</title>', correct_header)
    
    # ensure it has the Tree Making in sidebar
    if 'href="tree-making.html"' not in correct_header:
        target_sidebar_str = """                    <div class="nav-group-content">
                        <a href="inventory.html" class="nav-item nested ">Inventory</a>
                        <a href="jobwork.html" class="nav-item nested ">Job Work</a>
                        <a href="design-book.html" class="nav-item nested ">Design Book</a>
                        <a href="tree-making.html" class="nav-item nested ">Tree Making</a>
                    </div>"""
        correct_header = re.sub(r'<div class="nav-group-content">\s*<a href="inventory\.html" class="nav-item nested[^>]*>Inventory</a>\s*<a href="jobwork\.html" class="nav-item nested[^>]*>Job Work</a>\s*<a href="design-book\.html"[^>]*>Design Book</a>\s*</div', target_sidebar_str + "\n</div", correct_header)
        

    # Extract everything from <main class="main-content" in tree-making.html
    tree_match = re.search(r'(<main class="main-content".*)', tree, re.DOTALL)
    if tree_match:
        tree_main = tree_match.group(1)
        
        with open('tree-making.html', 'w') as f:
            f.write(correct_header + tree_main)
        print("Fixed tree-making.html successfully.")
    else:
        print("Could not find <main class=main-content> in tree-making.html")
else:
    print("Could not find <main class=main-content> in inventory.html")
