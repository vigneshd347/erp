const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('reports.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

dom.window.localStorage.setItem('manti_journal_entries', '[]');
dom.window.localStorage.setItem('manti_bank_accounts', '[]');

setTimeout(() => {
    try {
        console.log("Calling selectReport...");
        dom.window.selectReport('banking-ledger');
        console.log("Success! reportHead:", dom.window.document.getElementById('report-head').innerHTML.substring(0, 100));
        console.log("Success! reportBody:", dom.window.document.getElementById('report-body').innerHTML.substring(0, 100));
    } catch (e) {
        console.error("Error evaluating:", e);
    }
}, 500);
