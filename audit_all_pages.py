import glob
import re

html_files = sorted(glob.glob('*.html'))
print(f"Auditing {len(html_files)} HTML pages...")

issues = []

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check 1: Does it include seed_data.js?
    if 'seed_data.js' not in content:
        issues.append(f"{fpath}: Missing <script src='seed_data.js'></script>")

    # Check 2: Check lines for bare lucide.createIcons();
    lines = content.split('\n')
    for idx, l in enumerate(lines):
        if 'lucide.createIcons()' in l and not 'if (' in l and not 'if(' in l and not 'if (window' in l:
            issues.append(f"{fpath}:{idx+1} Bare unguarded lucide.createIcons() call")

    # Check 3: Check for un-closed script tags or brace mismatches
    script_blocks = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
    for s_idx, sb in enumerate(script_blocks):
        open_b = sb.count('{')
        close_b = sb.count('}')
        if open_b != close_b:
            issues.append(f"{fpath} script block {s_idx}: Mismatched braces open={open_b}, close={close_b}")

if not issues:
    print("ALL HTML PAGES PASSED AUDIT WITH 0 ISSUES!")
else:
    print(f"Found {len(issues)} potential issues across pages:")
    for issue in issues[:30]:
        print(" -", issue)
