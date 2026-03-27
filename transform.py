import os
import re

files = [
    "admin.html", "assets.html", "banking.html", "inventory.html", 
    "jobwork.html", "purchases.html", "reports.html", "staff.html", 
    "stock-adjustment.html", "supplier-kyc.html", "vendor-kyc.html"
]

for file in files:
    if not os.path.exists(file):
        continue
        
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Strip the entire sidebar block
    content = re.sub(r'<aside class="price-panel">.*?</aside>', '', content, flags=re.DOTALL)
    
    # 2. Relocate the logo into the header
    def repl(m):
        h1 = m.group(1).strip()
        p = m.group(2).strip()
        return f'''<div class="header-content" style="display: flex; align-items: center; gap: 20px;">
                    <a href="index.html">
                        <img src="Asset 23.png" alt="Manti Logo" style="height: 50px; width: auto;">
                    </a>
                    <div>
                        {h1}
                        {p}
                    </div>
                </div>'''
    
    # Target <div class="header-content"> that contains h1 and p but doesn't already have the logo
    if 'src="Asset 23.png"' not in content.split('<main')[1].split('</header>')[0]: # Very rough check to ensure we don't double inject
        content = re.sub(r'<div class="header-content">\s*(<h[12][^>]*>.*?</h[12]>)\s*(<p[^>]*>.*?</p>)\s*</div>', repl, content, flags=re.DOTALL)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Transformation complete.")
