const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('file:///Users/vignesh/Desktop/erp/banking.html', { waitUntil: 'load' });
  await page.click('#add-bank-entry');
  console.log('Clicked Add Entry');
  
  // wait 100ms
  await new Promise(r => setTimeout(r, 100));
  
  // check modal status
  const modalStatus = await page.evaluate(() => {
    const m = document.getElementById('phase-2-modal');
    return {
      classList: Array.from(m.classList),
      display: window.getComputedStyle(m).display
    };
  });
  console.log('Modal status:', modalStatus);
  await browser.close();
})();
