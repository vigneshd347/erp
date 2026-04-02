import urllib.request
import json
import ssl
import re

URL = "https://stcomjtuuuchdafhssgv.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0"
HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json"
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

with open('db_backup.json', 'r') as f:
    db = json.load(f)

print("Starting conversion mapping...")

id_map = {}
counters = {}

def get_new_id(old_id):
    if not old_id or '-' not in str(old_id): return old_id
    prefix = old_id.split('-')[0] + '-'
    if prefix not in counters: counters[prefix] = 1
    new_id = f"{prefix}{counters[prefix]:04d}"
    counters[prefix] += 1
    id_map[old_id] = new_id
    return new_id

# 1. Map and update primary tables
for r in db['supplier_kyc']:
    r['id'] = get_new_id(r['id'])

for r in db['vendor_kyc']:
    r['id'] = get_new_id(r['id'])

for r in db['assets']:
    old = r['id']
    new = get_new_id(old)
    r['id'] = new
    # update local data payload
    if 'data' in r and 'id' in r['data']:
        r['data']['id'] = new

for r in db['orders']:
    old = r['order_number']
    new = get_new_id(old)
    r['order_number'] = new
    if 'vendor_id' in r and r['vendor_id'] in id_map:
        r['vendor_id'] = id_map[r['vendor_id']]
    # order remark json contains extendedData with items
    if 'remark' in r and r['remark'].startswith('{'):
        try:
            rmk = json.loads(r['remark'])
            r['remark'] = json.dumps(rmk)
        except: pass

for r in db['expenses']:
    r['id'] = get_new_id(r['id'])
    if 'vendor' in r and r['vendor'] in id_map:
        r['vendor'] = id_map[r['vendor']]

for r in db['stock_history']:
    # update details or note
    old = r.get('details', '')
    for ok, nk in id_map.items():
        if ok and ok in old: old = old.replace(ok, nk)
    r['details'] = old
    
print("ID Map:", json.dumps(id_map, indent=2))

def request_all(method, table, payload=None, params=""):
    req_url = f"{URL}/{table}{params}"
    data = json.dumps(payload).encode() if payload else None
    req = urllib.request.Request(req_url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            pass # print(response.getcode())
    except Exception as e:
        print("Op Err:", e)

print("Wiping and Upserting...")
for t in ['supplier_kyc', 'vendor_kyc', 'assets', 'orders', 'expenses', 'stock_history']:
    if t in db and len(db[t]) > 0:
        # Wipe
        param = "?id=not.is.null" if t in ['supplier_kyc', 'vendor_kyc', 'assets', 'expenses'] else ("?order_number=not.is.null" if t == 'orders' else "?date=not.is.null")
        request_all("DELETE", t, params=param)
        print(f"Deleted {t}")
        # Insert
        request_all("POST", t, payload=db[t])
        print(f"Inserted {len(db[t])} into {t}")

print("Success.")
