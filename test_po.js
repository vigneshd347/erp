const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('purchases.html', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
const window = dom.window;
const document = window.document;

// Mock localStorage
window.localStorage = {
  getItem: (k) => {
    if (k === 'manti_order_records') return "[]";
    if (k === 'manti_supplier_kyc_records') return "[]";
    return null;
  },
  setItem: () => {}
};

// Wait for load, then trigger event
window.addEventListener("load", () => {
    console.log("Window loaded, dispatching CloudDataLoaded");
    try {
        document.dispatchEvent(new window.Event('CloudDataLoaded'));
        console.log("Event dispatched. Now clicking button...");
        const btn = document.getElementById('add-order-btn');
        if (btn) {
            btn.click();
            console.log("Button clicked. Form display:", document.getElementById('order-form').style.display);
        } else {
            console.log("Button not found!");
        }
    } catch (e) {
        console.error("Error generated:", e);
    }
});
