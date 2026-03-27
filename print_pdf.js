const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/create-invoice.html', { waitUntil: 'networkidle0' });
    
    // Add some items
    for (let i = 0; i < 4; i++) {
        await page.click('#add-item');
    }
    
    // Sync to template
    await page.evaluate(() => {
        syncWithTemplate();
    });
    
    // Generate PDF
    await page.pdf({
        path: 'print_output.pdf',
        format: 'A4',
        printBackground: true
    });
    
    await browser.close();
})();
