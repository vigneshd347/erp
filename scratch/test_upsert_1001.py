import urllib.request
import json
url = "https://stcomjtuuuchdafhssgv.supabase.co/rest/v1/stock_history"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Content-Type": "application/json",
    "Prefer": "return=representation,resolution=merge-duplicates"
}

data = {
    "id": "ADJ-1001",
    "date": "2026-06-12T12:00:00Z",
    "type": "Buy",
    "details": json.dumps({"id":"ADJ-1001","note":"test","status":"Active"}),
    "qty": 0,
    "weight": 5,
    "metal_type": "pure_gold_999"
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(e)
