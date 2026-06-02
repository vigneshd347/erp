import os
import glob

for file in glob.glob('*.html'):
    with open(file, 'r') as f:
        content = f.read()
    
    if 'image-to-3d.html' not in content:
        continue
        
    lines = content.split('\n')
    new_lines = [line for line in lines if 'href="image-to-3d.html"' not in line]
            
    with open(file, 'w') as f:
        f.write('\n'.join(new_lines))

print("Removal complete")
