import json

with open('seed_designs.json', 'r') as f:
    designs = json.load(f)

seed = {
    "manti_order_records": [
        {
            "id": "PO-1001",
            "type": "Purchase Order",
            "date": "2025-12-23",
            "dueDate": "2026-01-26",
            "customer": "",
            "product": "Jewelry Casting & Equipment",
            "weight": 9,
            "qty": 9,
            "unit": "g",
            "amount": 388220,
            "paidAmount": 388220,
            "status": "Completed",
            "vendor": "SUP-1001",
            "category": "Assets",
            "assetType": "Machinery",
            "billNo": "202 & 14",
            "remark": "-",
            "items": [
                { "desc": "Burnout 12X12", "qty": "1", "rate": "48000", "gst": "18", "total": "56640.00" },
                { "desc": "Melting SPL", "qty": "1", "rate": "23000", "gst": "18", "total": "27140.00" },
                { "desc": "Buffing single", "qty": "1", "rate": "38000", "gst": "18", "total": "44840.00" },
                { "desc": "Magnet polish 1 KG", "qty": "1", "rate": "35000", "gst": "18", "total": "41300.00" },
                { "desc": "Drom polish", "qty": "1", "rate": "23000", "gst": "18", "total": "27140.00" },
                { "desc": "Ultra wash 9Ltr", "qty": "1", "rate": "27000", "gst": "18", "total": "31860.00" },
                { "desc": "Water Jet", "qty": "1", "rate": "28000", "gst": "18", "total": "33040.00" },
                { "desc": "Injector", "qty": "1", "rate": "22000", "gst": "18", "total": "25960.00" },
                { "desc": "Casting 500 LPM", "qty": "1", "rate": "85000", "gst": "18", "total": "100300.00" }
            ]
        },
        {
            "id": "PO-1002",
            "type": "Purchase Order",
            "date": "2026-02-05",
            "dueDate": "2026-02-07",
            "customer": "",
            "product": "3 kg E.W. Scale",
            "weight": 1,
            "qty": 1,
            "unit": "g",
            "amount": 16520,
            "paidAmount": 16520,
            "status": "Completed",
            "vendor": "SUP-1003",
            "category": "Assets",
            "assetType": "Electronics",
            "billNo": "2046/25-26",
            "remark": "Machine No : 260411\nAccuracy : 10 MG",
            "items": [
                { "desc": "3 kg E.W.Scale ", "qty": "1", "rate": "14000", "gst": "18", "total": "16520.00" }
            ]
        }
    ],
    "manti_supplier_kyc_records": [
        { "id": "SUP-1001", "name": "SAI ENGINEERING", "mobile": "9994493941", "email": None, "address": "5/23 PERUMAL KONAR STREET EDAYARPALAYAM KUNIYAMUTHUR COIMBATORE", "gst": "33AJEPA1372Q1Z9", "pan": "AJEPA1372Q" },
        { "id": "SUP-1002", "name": "AUGMENT 3DI", "mobile": "+91 78068 08545", "email": None, "address": "No.52,illango Nagar,Avarampalyam Ganapathy-641006 Coimbatore Tamil Nadu", "gst": "33ABNFA1691H1ZF", "pan": "ABNFA1691H" },
        { "id": "SUP-1003", "name": "VASAVI SCALES", "mobile": "9380354043", "email": None, "address": "No. 105/71, NAINIAPPA NAICKEN STREET, CHENNAI - 600 003", "gst": "33AACFV4705B1ZQ", "pan": "AACFV4705B" },
        { "id": "SUP-1004", "name": "RKB Designer", "mobile": "7550301868", "email": "rakeefrkf@gmail.com", "address": "nill", "gst": "nill", "pan": "nill" },
        { "id": "SUP-1005", "name": "Kalai rubber stamps and printings", "mobile": "9787574989", "email": "Kalairubberstamps@gmail.com", "address": "Sf no.99/5,periyanaickenpalayam,coimbatore", "gst": "33AXHPA9978PIZO", "pan": "AXHPA9978P" }
    ],
    "manti_assets": [
        { "id": "AST-832197", "date": "2025-12-11", "name": "Mac M2", "notes": "laptop with charger and bag", "value": "50000", "status": "Active", "category": "Electronics", "depreciation": "5" },
        { "id": "AST-1820180", "date": "2026-02-05", "name": "3 kg e.w.scale-shri vasavi machine no.260411 accuracy:10mg", "notes": "Auto-added from PO: PO-1002", "value": "16520", "status": "Active", "category": "Electronics", "depreciation": "8" },
        { "id": "AST-0006490", "date": "2026-03-13", "name": "Anycubic photon mono m7 pro 3Dprinter", "notes": "Auto-added from PO: PO-1001", "value": "58004.08", "status": "Active", "category": "Machinery" }
    ],
    "manti_expenses": [
        { "id": "EXP-11770762", "date": "2026-03-02", "account": "Rent Expense", "amount": 6080, "paidThrough": "Bank Account", "vendor": "vijay", "reference": "", "notes": "include of gst 18%", "status": "Payment Pending", "total": 6080 },
        { "id": "EXP-11703464", "date": "2026-02-03", "account": "Rent Expense", "amount": 6080, "paidThrough": "Bank Account", "vendor": "vijay", "reference": "", "notes": "With GST 18%", "status": "Payment Pending", "total": 6080 }
    ],
    "manti_designs": designs
}

js_content = f"window.MANTI_SEED_DATA = {json.dumps(seed, indent=2)};\n"

with open("seed_data.js", "w") as f:
    f.write(js_content)

print("Created seed_data.js successfully.")
