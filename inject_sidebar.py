import os
import glob

# Search for the injection point
search_str = '<a href="jobwork.html" class="nav-item nested ">Job Work</a>\n                    </div>'
replace_str = '<a href="jobwork.html" class="nav-item nested ">Job Work</a>\n                        <a href="design-book.html" class="nav-item nested ">Design Book</a>\n                    </div>'

# Or an alternative if Jobwork is active
search_str_2 = '<a href="jobwork.html" class="nav-item nested active">Job Work</a>\n                    </div>'
replace_str_2 = '<a href="jobwork.html" class="nav-item nested active">Job Work</a>\n                        <a href="design-book.html" class="nav-item nested ">Design Book</a>\n                    </div>'


files = glob.glob('*.html')
count = 0
for f in files:
    if f == 'design-book.html':
        continue
    with open(f, 'r') as file:
        content = file.read()
    
    if search_str in content:
        content = content.replace(search_str, replace_str)
        with open(f, 'w') as file:
            file.write(content)
        count += 1
        print(f"Updated {f}")
    elif search_str_2 in content:
        content = content.replace(search_str_2, replace_str_2)
        with open(f, 'w') as file:
            file.write(content)
        count += 1
        print(f"Updated {f}")
    else:
        print(f"Skipped {f} (pattern not found)")

print(f"\nTotal files updated: {count}")
