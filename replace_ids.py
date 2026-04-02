import os
import re

def update_file(filename, pattern, replacement):
    with open(filename, 'r') as f:
        content = f.read()
    if re.search(pattern, content, re.DOTALL):
        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        with open(filename, 'w') as f:
            f.write(new_content)
        print(f"Updated {filename}")

# purchases.html
update_file('purchases.html',
    r"let maxId = 1000;(.*?)(maxId \+ 1)",
    r"let maxId = 0;\1(maxId + 1).toString().padStart(4, '0')"
)

# sales-orders.html
update_file('sales-orders.html',
    r"let maxId = 1000;(.*?)(maxId \+ 1)",
    r"let maxId = 0;\1(maxId + 1).toString().padStart(4, '0')"
)

# supplier-kyc.html
update_file('supplier-kyc.html',
    r"let maxId = 1000;(.*?)(maxId \+ 1)",
    r"let maxId = 0;\1(maxId + 1).toString().padStart(4, '0')"
)

# vendor-kyc.html
update_file('vendor-kyc.html',
    r"let maxId = 1000;(.*?)(maxId \+ 1)",
    r"let maxId = 0;\1(maxId + 1).toString().padStart(4, '0')"
)

# staff.html (was maxId = 0)
update_file('staff.html',
    r"let maxId = 0;(.*?)return prefix \+ \(maxId \+ 1\);",
    r"let maxId = 0;\1return prefix + (maxId + 1).toString().padStart(4, '0');"
)

# assets.html: from Date.now() to prefix
assets_new = """            function generateId() {
                const assets = JSON.parse(localStorage.getItem('manti_assets')) || [];
                let maxId = 0;
                assets.forEach(a => {
                    if(a.id && a.id.startsWith('AST-')) {
                        let num = parseInt(a.id.replace('AST-', ''));
                        if(num > maxId) maxId = num;
                    }
                });
                return 'AST-' + (maxId + 1).toString().padStart(4, '0');
            }"""
update_file('assets.html', r"            function generateId\(\) {\n\s+return 'AST-' \+ Date\.now\(\)\.toString\(\)\.slice\(-6\);\n\s+}", assets_new)

# delivery-challans.html
dc_new = """            const records = JSON.parse(localStorage.getItem('manti_delivery_challan_records') || '[]');
            let nextId = 1;
            records.forEach(r => {
                if(r.id && r.id.startsWith('DC-')) {
                    let n = parseInt(r.id.replace('DC-', ''));
                    if(n >= nextId) nextId = n + 1;
                }
            });
            document.getElementById('challan-number').value = 'DC-' + nextId.toString().padStart(4, '0');"""
update_file('delivery-challans.html', r"document\.getElementById\('challan-number'\)\.value = 'DC-' \+ \(Date\.now\(\) % 1000000\);", dc_new)

