import subprocess
try:
    with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
        code = f.read()
    
    # Simple bracket counting by line to find the mismatch
    open_c = 0
    for i, line in enumerate(code.split('\n')):
        open_c += line.count('{')
        open_c -= line.count('}')
    print("Final open count:", open_c)
