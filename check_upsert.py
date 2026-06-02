with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
    lines = f.readlines()
for i in range(460, 505):
    print(lines[i].rstrip())
