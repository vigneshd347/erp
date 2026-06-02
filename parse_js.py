import re

with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
    code = f.read()

# Remove single line comments
code = re.sub(r'//.*', '', code)
# Remove multi line comments
code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
# Remove strings
code = re.sub(r'".*?"', '', code)
code = re.sub(r"'.*?'", '', code)
code = re.sub(r"`.*?`", '', code, flags=re.DOTALL)

depth = 0
lines = code.split('\n')
for i, line in enumerate(lines):
    depth += line.count('{')
    depth -= line.count('}')
    if depth < 0:
        print(f"Error: unmatched }} at line {i+1}")
        break

print(f"Final Depth: {depth}")
if depth > 0:
    print("Missing } somewhere")
