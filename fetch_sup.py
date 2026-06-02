with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
    lines = f.readlines()
for i in range(817, 891):
    print(f"{i}: {lines[i].rstrip()}")
