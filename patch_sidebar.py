import os
import glob

for file in glob.glob('*.html'):
    if file == 'image-to-3d.html': continue
    with open(file, 'r') as f:
        content = f.read()
    
    if 'image-to-3d.html' in content:
        continue
        
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        new_lines.append(line)
        if 'href="tree-making.html"' in line and 'nav-item nested' in line:
            new_lines.append('                        <a href="image-to-3d.html" class="nav-item nested">3D Lithophane</a>')
            
    with open(file, 'w') as f:
        f.write('\n'.join(new_lines))

print("Patch complete")
