with open('/Users/vignesh/Desktop/erp/supabase.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []

for idx, l in enumerate(lines):
    line_no = idx + 1
    # Strip comments and string literals roughly
    in_str = False
    str_ch = None
    for col_idx, ch in enumerate(l):
        if not in_str and (ch == '"' or ch == "'" or ch == '`'):
            in_str = True
            str_ch = ch
        elif in_str and ch == str_ch and l[col_idx-1] != '\\':
            in_str = False
        elif not in_str and ch == '/' and col_idx + 1 < len(l) and l[col_idx+1] == '/':
            break # Rest of line is comment
        elif not in_str:
            if ch == '{':
                stack.append((line_no, l.strip()))
            elif ch == '}':
                if stack:
                    stack.pop()
                else:
                    print(f"Extra closing brace at line {line_no}: {l.strip()}")

print(f"Unclosed braces count: {len(stack)}")
for item in stack[-5:]:
    print(f" Unclosed brace opened at line {item[0]}: {item[1]}")

