import urllib.request
import json

SUPABASE_URL = "https://stcomjtuuuchdafhssgv.supabase.co/rest/v1"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}"
}

tables = ["designs", "orders", "trees", "settings", "app_settings", "expenses", "job_works"]

for t in tables:
    try:
        url = f"{SUPABASE_URL}/{t}?select=count"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"Table '{t}': {len(data)} items returned (sample: {data[:1]})")
    except Exception as e:
        print(f"Table '{t}': {e}")
