with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "// 13. Stock History" in line and start_idx == -1:
        start_idx = i
    if "window.ERP_MEMORY.set('manti_stock_history'" in line and i > 800:
        end_idx = i + 1

print(f"Indices: {start_idx} to {end_idx}")
for i, line in enumerate(lines[start_idx:end_idx+1]):
    print(f"{i+start_idx}: {line.rstrip()}")

