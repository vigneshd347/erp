import urllib.request
import urllib.error
import json

url = "https://stcomjtuuuchdafhssgv.supabase.co/rest/v1/stock_history"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Content-Type": "application/json",
    "Prefer": "return=representation,resolution=merge-duplicates"
}
data = json.dumps([{
    "id": "TEST-1234",
    "date": "2026-05-17T00:00:00Z",
    "type": "Buy",
    "qty": 1,
    "weight": 1,
    "metal_type": "gold"
}]).encode('utf-8')

req = urllib.request.Request(url, data=data, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print("Upsert Success!")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Upsert Error:", e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Error:", str(e))
