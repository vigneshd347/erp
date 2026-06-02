with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
    lines = f.readlines()
for i, line in enumerate(lines[-30:]):
    print(f"{len(lines)-30+i}: {line.rstrip()}")
