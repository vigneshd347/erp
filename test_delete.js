const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('/Users/vignesh/Desktop/erp/purchases.html', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;

// Setup mocks
window.localStorage = {
    getItem: (key) => null,
    setItem: () => {}
};
window.supabase = {
    from: () => ({ delete: () => ({ match: () => Promise.resolve({error: null}) }) })
};

window.records = [{
    id: 'PO-0002',
    category: 'Assets',
    status: 'Completed'
}];

window.confirm = (msg) => true; // Always say yes

window.alert = (msg) => { console.log('ALERT:', msg) };

window.renderTable = () => { console.log('RENDER CALLED'); };

try {
    window.deleteRecord(0);
    console.log("Delete completely succeeded:", window.records);
} catch (e) {
    console.error("Crash during delete:", e);
}
