import re
import sys

with open('reports.html') as f:
    content = f.read()

script_blocks = re.findall(r'<script.*?>([\s\S]*?)<\/script>', content)
print(f"Found {len(script_blocks)} script blocks.")
