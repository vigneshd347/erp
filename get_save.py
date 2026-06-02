with open('/Users/vignesh/Desktop/erp/stock-adjustment.html', 'r') as f:
    html = f.read()
import re
for line in html.split('\n'):
    if 'history.push' in line or 'setItem' in line:
        print(line.strip())
