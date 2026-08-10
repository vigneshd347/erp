import urllib.request
import json
url = "https://stcomjtuuuchdafhssgv.supabase.co/rest/v1/stock_history?select=*"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0"
}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        stock = json.loads(response.read().decode('utf-8'))
        stock = sorted(stock, key=lambda x: x.get('created_at', ''), reverse=True)
        print(f"Total records: {len(stock)}")
        if len(stock) > 0:
            print("Latest 5 records:")
            print(json.dumps(stock[:5], indent=2))
except Exception as e:
    print(e)
