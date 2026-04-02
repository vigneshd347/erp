import urllib.request
import json
import ssl

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

def get_t(table):
    req = urllib.request.Request(f"{URL}/{table}", headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            return json.loads(response.read().decode())
    except urllib.error.URLError as e:
        print(f"Error fetching {table}: {e}")
        return []

tables = ['orders', 'vendor_kyc', 'supplier_kyc', 'assets', 'delivery_challans', 'staff_records', 'invoices', 'job_works', 'stock_history', 'payments_made', 'expenses']
backup = {}

if __name__ == '__main__':
    for t in tables:
        backup[t] = get_t(t)
        print(f"{t}: {len(backup[t])} rows")
    with open('db_backup.json', 'w') as f:
        json.dump(backup, f, indent=2)
    print("Backup saved to db_backup.json")
