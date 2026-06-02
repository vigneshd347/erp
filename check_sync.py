with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
    lines = f.readlines()
for i, line in enumerate(lines[455:540]):
    print(f"{i+456}: {line.rstrip()}")
