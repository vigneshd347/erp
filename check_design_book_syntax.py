import re

with open('design-book.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
print(f"Found {len(scripts)} inline script blocks.")

for idx, s in enumerate(scripts):
    lines = s.split('\n')
    open_b = 0
    close_b = 0
    for line_idx, l in enumerate(lines):
        for ch in l:
            if ch == '{': open_b += 1
            elif ch == '}': close_b += 1
            if close_b > open_b:
                print(f"Block {idx} line {line_idx+1}: Unexpected token '}}' -> {l.strip()}")
                close_b = open_b # reset for scan
    print(f"Block {idx}: open={open_b}, close={close_b}")

