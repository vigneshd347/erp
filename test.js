const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');
new Function(content);
