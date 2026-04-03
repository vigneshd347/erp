import urllib.request
import json

SUPABASE_URL = 'https://stcomjtuuuchdafhssgv.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0'

headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json'
}

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/bank_accounts?account_name=ilike.*icic*', headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Found accounts:", data)
        for acc in data:
            print("Deleting:", acc['id'])
            del_req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/bank_accounts?id=eq.{acc["id"]}', headers=headers, method='DELETE')
            with urllib.request.urlopen(del_req) as del_resp:
                print("Deleted status:", del_resp.status)
except Exception as e:
    print(e)
