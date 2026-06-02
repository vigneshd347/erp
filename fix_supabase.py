with open('/Users/vignesh/Desktop/erp/supabase.js', 'r') as f:
    lines = f.readlines()

# Python list is 0-indexed, so lines 552 to 707 are indices 551 to 706 inclusive.
# But wait, looking at the file:
# line 550 is `            try { originalSetItem.call(localStorage, 'manti_stock_history', JSON.stringify(ramStock)); } catch(e) {}`
# line 551 is `\n`
# line 552 is `\n`
# ...
# line 707 is `        } else if (key === 'manti_designs') {`

# Let's verify by just printing those lines first
for i, line in enumerate(lines[550:710]):
    print(f"{i+551}: {line.rstrip()}")

