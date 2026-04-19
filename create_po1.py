import json
import urllib.request

url = "https://stcomjtuuuchdafhssgv.supabase.co/rest/v1/orders"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

ext_data = {
    "items": [],
    "category": "Design",
    "assetType": "",
    "mainMetalType": "Gold",
    "billNo": "",
    "mcPercent": "",
    "mcAmount": "",
    "remark": "Synthetically recreated to fill the sequence gap."
}

dummy_po = [
    {
        "order_number": "PO-0001",
        "type": "Purchase Order",
        "date": "2024-01-01",
        "due_date": "2024-01-07",
        "customer_name": "System Restored",
        "vendor_id": "System Restored",
        "product_name": "System Restored",
        "total_weight": 0,
        "weight_unit": "g",
        "total_amount": 0,
        "paid_amount": 0,
        "status": "Cancelled",
        "remark": json.dumps(ext_data)
    }
]

req = urllib.request.Request(url, data=json.dumps(dummy_po).encode('utf-8'), headers=headers, method='POST')
try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode('utf-8'))
except urllib.error.URLError as e:
    print("Error:", e.read().decode('utf-8') if hasattr(e, 'read') else str(e))
