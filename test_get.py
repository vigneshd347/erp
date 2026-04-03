import urllib.request
import json

SUPABASE_URL = 'https://stcomjtuuuchdafhssgv.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0'

headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json'
}

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/', method='GET', headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        swagger = json.loads(response.read().decode())
        if 'definitions' in swagger and 'bank_accounts' in swagger['definitions']:
            print("Columns in bank_accounts:")
            print(list(swagger['definitions']['bank_accounts']['properties'].keys()))
        else:
            print("Table bank_accounts not found in Swagger")
except urllib.error.HTTPError as e:
    err_msg = e.read().decode()
    print("Error:", e.code, err_msg)
