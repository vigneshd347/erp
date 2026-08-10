import re

with open('tmp_old_sales.html', 'r') as f:
    html = f.read()

with open('current_sidebar.html', 'r') as f:
    sidebar = f.read()

# Replace the old sidebar with the new one
new_html = re.sub(r'<aside class="sidebar">.*?</aside>', sidebar, html, flags=re.DOTALL)

with open('sales-orders.html', 'w') as f:
    f.write(new_html)

print("Restored sales-orders.html with updated sidebar.")
