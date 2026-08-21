import glob

files = ['seed_data.js', 'supabase.js', 'script.js', 'manti_repair.js', 'liquid-button.js', 'image-cropper.js']

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    open_b = 0
    close_b = 0
    errs = 0
    for idx, l in enumerate(lines):
        # Ignore comments
        line_clean = l.split('//')[0]
        for ch in line_clean:
            if ch == '{': open_b += 1
            elif ch == '}': close_b += 1
            if close_b > open_b:
                print(f"File {fpath} line {idx+1}: Unexpected token '}}' -> {l.strip()}")
                errs += 1
                close_b = open_b
    if errs == 0:
        print(f"File {fpath}: Braces OK (open={open_b}, close={close_b})")
