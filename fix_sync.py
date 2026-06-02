import re

with open('supabase.js', 'r') as f:
    content = f.read()

pattern = re.compile(
    r"const idList = (\w+)\.map\(([a-zA-Z0-9_]+) => `\"\$\{\2\.([a-zA-Z0-9_]+)\}\"`\)\.join\(\',\'\);\s*"
    r"await supabase\.from\('([a-zA-Z0-9_]+)'\)\.delete\(\)\.not\('([a-zA-Z0-9_]+)', 'in', `\(\$\{idList\}\)`\);"
)

def repl(match):
    arr_name = match.group(1)
    var_name = match.group(2)
    id_prop = match.group(3)
    table_name = match.group(4)
    col_name = match.group(5)
    
    return f"""// Safely delete stale records using chunked deletes
                const {{ data: cloudIds }} = await supabase.from('{table_name}').select('{col_name}');
                if (cloudIds) {{
                    const localIds = new Set({arr_name}.map({var_name} => {var_name}.{id_prop}));
                    const toDelete = cloudIds.filter(c => !localIds.has(c.{col_name})).map(c => c.{col_name});
                    if (toDelete.length > 0) {{
                        for (let i = 0; i < toDelete.length; i += 100) {{
                            const chunk = toDelete.slice(i, i + 100);
                            await supabase.from('{table_name}').delete().in('{col_name}', chunk);
                        }}
                    }}
                }}"""

new_content = pattern.sub(repl, content)

with open('supabase.js', 'w') as f:
    f.write(new_content)

print(f"Fixed supabase.js. Replaced {len(pattern.findall(content))} occurrences.")
