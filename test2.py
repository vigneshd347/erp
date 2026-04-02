import json

with open("db_backup.json") as f:
    data = json.load(f)

po_amt = 0
for x in data.get('orders', []):
    if x.get('type') == 'Purchase Order':
        v = x.get('total_amount') or x.get('amount')
        po_amt += float(v) if v else 0

exp_amt = 0
for x in data.get('expenses', []):
    v = x.get('total') or x.get('amount')
    exp_amt += float(v) if v else 0
    
ast_amt = 0
for x in data.get('assets', []):
    v = x.get('value')
    ast_amt += float(v) if v else 0

pmt_amt = 0
for x in data.get('payments_made', []):
    v = x.get('amount')
    pmt_amt += float(v) if v else 0

print(f"PO: {po_amt}")
print(f"Exp: {exp_amt}")
print(f"Ast: {ast_amt}")
print(f"Pmt: {pmt_amt}")
