const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('.canvas-container');
  
  console.log("Canvas loaded. Looking for Main Gateway...");
  
  // Find node by aria-label
  const node = await page.$('[aria-label="Main Gateway details"]');
  if (node) {
    console.log("Found Main Gateway node. Double clicking...");
    
    // Simulate double tap
    await node.click();
    await page.waitForTimeout(100);
    await node.click();
    
    console.log("Waiting for sidebar...");
    try {
      await page.waitForSelector('.sidebar', { timeout: 2000 });
      console.log("Sidebar IS visible.");
      
      const sidebarHtml = await page.$eval('.sidebar', el => el.outerHTML);
      console.log("Sidebar HTML snippet:", sidebarHtml.substring(0, 100));
    } catch(err) {
      console.log("Sidebar DID NOT appear.");
    }
  } else {
    console.log("Main Gateway node not found.");
  }
  
  await browser.close();
})();
