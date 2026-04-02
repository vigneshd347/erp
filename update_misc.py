import os, re

def r(fname, patt, repl):
    with open(fname, 'r') as f: c = f.read()
    if re.search(patt, c, re.DOTALL):
        c = re.sub(patt, repl, c, flags=re.DOTALL)
        with open(fname, 'w') as f: f.write(c)

r('expenses.html', 
  r"const expId = 'EXP-' \+ String\(Date\.now\(\)\)\.slice\(-8\);", 
  """let nextId = 1;
            const records = JSON.parse(localStorage.getItem('manti_expenses') || '[]');
            records.forEach(r => {
                if(r.id && r.id.startsWith('EXP-')) {
                    const n = parseInt(r.id.replace('EXP-', ''), 10);
                    if(!isNaN(n) && n >= nextId) nextId = n + 1;
                }
            });
            const expId = 'EXP-' + nextId.toString().padStart(4, '0');""")

r('payment-made.html',
  r"id: 'PAY-' \+ Date\.now\(\)\.toString\(\)\.slice\(-6\),",
  """id: (function(){
                    let nextId = 1;
                    payments.forEach(r => {
                        if(r.id && r.id.startsWith('PAY-')) {
                            const n = parseInt(r.id.replace('PAY-', ''), 10);
                            if(!isNaN(n) && n >= nextId) nextId = n + 1;
                        }
                    });
                    return 'PAY-' + nextId.toString().padStart(4, '0');
                })(),""")

r('journal-entry.html',
  r"\(Math\.random\(\)\s*\*\s*1000\)",
  """Date.now()""") # Let's see how journal-entry generated it, I must grep it first

