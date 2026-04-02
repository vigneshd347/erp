import json
with open("db_backup.json") as f:
    data = json.load(f)
pos = [x for x in data.get('orders', []) if x.get('type') == 'Purchase Order']
s = sum(float(x.get('total_amount') or x.get('amount') or 0) for x in pos)
print("POs:", len(pos))
for p in pos:
    print(p.get('id'), p.get('total_amount'), p.get('amount'), p.get('order_number'))
print("Total POs sum:", s)
