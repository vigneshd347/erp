import urllib.request
import json
import uuid

SUPABASE_URL = 'https://stcomjtuuuchdafhssgv.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0'

headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

dummy_data = {
    "id": "ACC-" + str(uuid.uuid4()),
    "account_name": "Test Post",
    "type": "Bank",
    "bank_name": "Test Bank",
    "number": "123",
    "loan_number": "456",
    "emi_amount": 0,
    "opening_balance": 0,
    "opening_date": None
}

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/bank_accounts', data=json.dumps([dummy_data]).encode('utf-8'), headers=headers, method='POST')
try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode())
        
        # Delete it right after
        del_req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/bank_accounts?id=eq.{dummy_data["id"]}', headers=headers, method='DELETE')
        urllib.request.urlopen(del_req)
except urllib.error.HTTPError as e:
    err_msg = e.read().decode()
    print("Error:", e.code, err_msg)
except Exception as e:
    print("Other Error:", str(e))
