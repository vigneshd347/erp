import requests
import json

url = "https://stcomjtuuuchdafhssgv.supabase.co/rest/v1/orders"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Try to insert a dummy order to test schema
data = {
    "order_number": "PO-TEST",
    "type": "Purchase Order",
    "date": "2026-05-18",
    "total_weight": 0,
    "total_amount": 0,
    "status": "Completed"
}

response = requests.post(url, headers=headers, json=data)
print("Insert response:", response.status_code, response.text)

if response.status_code in [200, 201]:
    delete_url = f"{url}?order_number=eq.PO-TEST"
    del_resp = requests.delete(delete_url, headers=headers)
    print("Delete response:", del_resp.status_code)
