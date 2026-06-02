import subprocess
try:
    with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
        code = f.read()
    # we can check for obvious unmatched brackets
    open_b = code.count('{')
    close_b = code.count('}')
    print(f"Braces: {open_b} open, {close_b} closed")
except Exception as e:
    print(e)
