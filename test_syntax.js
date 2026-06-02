const html = require('fs').readFileSync('expenses.html', 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
try {
  new Function(js);
  console.log("Syntax is valid!");
} catch(e) {
  console.log("Error:", e);
}
