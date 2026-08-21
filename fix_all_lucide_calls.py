import glob

html_files = glob.glob('*.html')
js_files = glob.glob('*.js')

files = html_files + js_files

count = 0
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content.replace("lucide.createIcons();", "if (window.lucide && window.lucide.createIcons) lucide.createIcons();")
    new_content = new_content.replace("window.lucide.createIcons();", "if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();")
    new_content = new_content.replace("if (window.lucide) if (window.lucide && window.lucide.createIcons) lucide.createIcons();", "if (window.lucide && window.lucide.createIcons) lucide.createIcons();")
    new_content = new_content.replace("if (window.lucide) lucide.createIcons();", "if (window.lucide && window.lucide.createIcons) lucide.createIcons();")

    if new_content != content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
        print(f"Fixed lucide calls in {fpath}")

print(f"Total files updated: {count}")
