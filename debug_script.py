import json

with open("db_backup.json") as f:
    data = json.load(f)

po_amt = sum(float(x.get('amount') or 0) for x in data.get('orders', []) if x.get('type') == 'Purchase Order')
exp_amt = sum(float(x.get('amount') or 0) for x in data.get('expenses', []))

print(f"Total POs: {po_amt}")
print(f"Total Expenses: {exp_amt}")
print(f"Combined Spend: {po_amt + exp_amt}")

