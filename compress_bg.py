import base64
from PIL import Image
import io

img = Image.open('Manti Jewel_letterpad-1_page-0001.png')
# Convert to RGB (in case of RGBA)
img = img.convert('RGB')
# Resize to a sensible A4 resolution, e.g., 1240 x 1754 (150 DPI)
img.thumbnail((1240, 1754), Image.Resampling.LANCZOS)
buffer = io.BytesIO()
img.save(buffer, format='JPEG', quality=85)
b64_str = base64.b64encode(buffer.getvalue()).decode('utf-8')

js_content = f"window.LETTERHEAD_B64 = 'data:image/jpeg;base64,{b64_str}';\n"
with open('letterhead-data.js', 'w') as f:
    f.write(js_content)
print(f"Compressed! New length: {len(js_content)}")
