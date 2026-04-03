import re

with open('reports.html') as f:
    text = f.read()

# very basic brace counting in the script
script_text = re.search(r'<script>(.*?)<\/script>', text, re.DOTALL)
if script_text:
    code = script_text.group(1)
    # this will strip out simple strings to avoid counting braces inside strings
    # very naive string removal
    # Actually just count ({[
    
    stack = []
    lines = code.split('\n')
    for i, line in enumerate(lines, 1):
        for char in line:
            if char in '{[(': stack.append((char, i))
            elif char in '}])':
                if not stack:
                    print(f"Unmatched closing {char} on line {i}")
                else:
                    last, l_i = stack.pop()
                    # optionally check if they match type e.g. { with }
    if stack:
        print("Unmatched opening brackets:", stack)
    else:
        print("Braces perfectly balanced!")
