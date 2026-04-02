import json
with open('db_backup.json') as f:
    data = json.load(f)

po_sum = sum(float(x.get('total_amount') or x.get('amount') or 0) for x in data.get('orders', []) if x.get('type') == 'Purchase Order')
expense_sum = sum(float(x.get('total') or x.get('amount') or 0) for x in data.get('expenses', []))
pmt_sum = sum(float(x.get('amount') or 0) for x in data.get('payments_made', []))
asset_sum = sum(float(x.get('value') or 0) for x in data.get('assets', []))
print(f"PO Sum: {po_sum}")
print(f"Expense Sum: {expense_sum}")
print(f"Asset Sum: {asset_sum}")
print(f"Pmt Sum: {pmt_sum}")
print(f"PO + Expense: {po_sum + expense_sum}")
print(f"Asset + Expense: {asset_sum + expense_sum}")
print(f"PO + Asset + Expense: {po_sum + asset_sum + expense_sum}")
