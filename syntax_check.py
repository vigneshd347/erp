import re
import subprocess
import json

with open('purchases.html', 'r') as f:
    html = f.read()
    
scripts = re.findall(r'<script.*?>\s*(.*?)\s*</script>', html, re.DOTALL)
for i, script in enumerate(scripts):
    with open(f'tmp_{i}.js', 'w') as out:
        out.write(script)

# Run some basic syntax checks? Since node isn't there, we can't easily. 
