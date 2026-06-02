const fs = require('fs');
const code = fs.readFileSync('/Users/vignesh/Desktop/erp/supabase.js', 'utf8');
try {
    new Function(code);
    console.log("No syntax errors found!");
} catch (e) {
    console.log("Syntax Error:", e.message);
    // V8 usually gives line numbers in stack trace
    console.log(e.stack);
}
