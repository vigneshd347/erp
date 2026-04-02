import requests
import json

URL = 'https://stcomjtuuuchdafhssgv.supabase.co/rest/v1'
HEADERS = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0'
}

tables = ['manti_order_records', 'manti_expenses', 'manti_assets']
for t in tables:
    resp = requests.get(f"{URL}/{t}?select=*", headers=HEADERS)
    print(f"\n--- {t} ---")
    data = resp.json()
    for row in data:
        print({k: v for k, v in row.items() if k in ['amount', 'total_amount', 'value', 'type', 'notes', 'status']})

