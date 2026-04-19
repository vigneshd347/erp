const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('/Users/vignesh/Desktop/erp/purchases.html', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;

window.records = [{
    type: 'Purchase Order',
    id: 'PO-0001',
    status: 'Open',
    date: '2023-01-01',
    dueDate: '2023-01-07',
    vendor: 'V-0001',
    category: 'Design',
    items: [
        { desc: 'Test', qty: 1, rate: 100 }
    ]
}];

window.addEventListener('error', (event) => {
    console.error("Uncaught error:", event.error);
});

try {
    window.editRecord(0);
    console.log("Edit completed without throwing synchronous errors in script!");
} catch (e) {
    console.error("Caught error:", e);
}
