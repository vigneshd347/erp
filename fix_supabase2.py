with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
    lines = f.readlines()

# find the exact boundaries
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "let isoDate = new Date().toISOString();" in line and i > 500 and start_idx == -1:
        start_idx = i - 2 # including the blank lines before it
    if "} else if (key === 'manti_designs') {" in line and i > 700:
        end_idx = i - 1

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx] + lines[end_idx+1:]
    with open('/Users/vignesh/Desktop/erp/supabase.js', 'w') as f:
        f.writelines(new_lines)
    print(f"Deleted from {start_idx} to {end_idx}")
else:
    print("Could not find boundaries")

