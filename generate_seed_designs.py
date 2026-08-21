import json

categories = [
    ("Ladies ring", "RG", 100, [12, 14, 16, 18], 1.5, 4.5),
    ("Gents ring", "RG", 40, [18, 20, 22], 3.5, 8.0),
    ("Bangle", "BG", 40, ["2x4", "2x6", "2x8"], 8.0, 24.0),
    ("Earring", "ER", 30, [], 2.0, 6.0),
    ("Necklace", "NK", 16, [], 10.0, 35.0),
    ("Mix", "MX", 10, [], 3.0, 15.0)
]

designers = ["RKB Designer", "AUGMENT 3DI", "Manti In-House", "Rajesh Crafts", "Devi Artisans"]
types = ["Mold", "3DM", "STL", "Mold & 3DM"]

designs = []

idx = 1
for cat, prefix, count, sizes, min_wt, max_wt in categories:
    for i in range(1, count + 1):
        num_str = f"{i:03d}"
        wt = round(min_wt + ((max_wt - min_wt) * (i / count)), 2)
        sz = sizes[i % len(sizes)] if sizes else ""
        
        d_id = f"{prefix}{num_str}"
        if wt > 0: d_id += f"-{wt}"
        if sz: d_id += f"-{sz}"
        
        designer = designers[(i + idx) % len(designers)]
        d_type = types[(i + idx) % len(types)]
        purch_val = round(wt * 450 + 200, 2)
        
        designs.append({
            "id": d_id,
            "category": cat,
            "subCategory": cat if cat in ["Ladies ring", "Gents ring"] else None,
            "weight": wt,
            "size": sz,
            "designType": d_type,
            "designerName": designer,
            "purchaseValue": purch_val,
            "imageUrl": "",
            "_sourcePO": ""
        })
        idx += 1

print(f"Generated {len(designs)} seed designs.")

with open("seed_designs.json", "w") as f:
    json.dump(designs, f, indent=2)

