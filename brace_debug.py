with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
    lines = f.readlines()
    
depth = 0
for i, line in enumerate(lines):
    depth += line.count('{')
    depth -= line.count('}')
    # ignore string literals for a simple check, this might not be 100% accurate but gives a clue
    
    if i % 50 == 0:
        print(f"Line {i}: depth {depth}")
print("Final Depth:", depth)
