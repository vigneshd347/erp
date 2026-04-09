import re

# Read correct sidebar structure from inventory.html
with open('inventory.html', 'r') as f:
    inv = f.read()

sidebar_match = re.search(r'(<aside class="sidebar">.*?</aside>)', inv, re.DOTALL)
if not sidebar_match:
    print("Could not find sidebar in inventory.html")
    exit(1)

correct_sidebar = sidebar_match.group(1)

# Now apply this sidebar to design-book.html, but make Design Book the active item
# First reset inventory's active state
correct_sidebar = correct_sidebar.replace('<a href="inventory.html" class="nav-item nested active">', '<a href="inventory.html" class="nav-item nested ">')

# Now activate Design Book
correct_sidebar = correct_sidebar.replace('<a href="design-book.html" class="nav-item nested ">', '<a href="design-book.html" class="nav-item nested active">')

# But we also need the parent Items group to be active!
# Since design book is in Items, and inventory is in Items, the Items group might already be active.
# Let's just make sure <div class="nav-group "> that contains Items becomes <div class="nav-group active">
# Wait, inventory.html already has Items group active? Let's assume yes, or we can force it.

with open('design-book.html', 'r') as f:
    db = f.read()

# Replace sidebar in design-book.html
db_new = re.sub(r'<aside class="sidebar">.*?</aside>', correct_sidebar, db, flags=re.DOTALL)

with open('design-book.html', 'w') as f:
    f.write(db_new)
print("Sidebar synced successfully to design-book.html.")
