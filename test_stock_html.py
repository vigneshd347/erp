with open('/Users/vignesh/Desktop/erp/stock-adjustment.html', 'r') as f:
    html = f.read()
import re
# check for anything using .details in stock history rendering
for line in html.split('\n'):
    if 'history' in line and '.details' in line:
        print(line.strip())
