import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://stcomjtuuuchdafhssgv.supabase.co/rest/v1"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json"
}

tables = [
    "designs",
    "orders",
    "job_works",
    "invoices",
    "vendor_kyc",
    "supplier_kyc",
    "staff_records",
    "assets",
    "delivery_challans",
    "payments_made",
    "expenses",
    "journal_entries",
    "bank_accounts",
    "stock_history",
    "settings",
    "app_settings",
    "trees"
]

print("--- SUPABASE TABLE INSPECTION ---")
for t in tables:
    url = f"{SUPABASE_URL}/{t}?select=count"
    req = urllib.request.Request(url, headers={"Range-Unit": "items", "Prefer": "count=exact", **headers})
    try:
        with urllib.request.urlopen(req) as resp:
            content_range = resp.headers.get("Content-Range", "")
            print(f"Table '{t}': {content_range}")
    except urllib.error.HTTPError as e:
        print(f"Table '{t}': HTTP {e.code} - {e.reason}")
    except Exception as e:
        print(f"Table '{t}': {e}")

print("\n--- APP_SETTINGS / SETTINGS KEYS ---")
try:
    url = f"{SUPABASE_URL}/settings?select=setting_key"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("settings keys:", [d.get('setting_key') for d in data])
except Exception as e:
    print("settings error:", e)

try:
    url = f"{SUPABASE_URL}/app_settings?select=setting_key"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("app_settings keys:", [d.get('setting_key') for d in data])
except Exception as e:
    print("app_settings error:", e)

