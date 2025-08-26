const { chromium } = require('@playwright/test');
const fetch = require('node-fetch');

/**
 * Test that uses Playwright MCP to navigate to a website
 */
async function runTest() {
  console.log('Connecting to Playwright MCP server...');
  // Connect to Playwright MCP server
  const browser = await chromium.connectOverCDP('http://localhost:8080');
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Run test using MCP
    console.log('Navigating to example.com');
    await page.goto('https://example.com');
    
    // Take screenshot
    await page.screenshot({ path: 'example-screenshot.png' });
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Get page content
    const content = await page.content();
    console.log(`Page content length: ${content.length} characters`);
    
    // Test passes if we get here
    return { title, status: 'PASS' };
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test and output results
if (require.main === module) {
  runTest()
    .then(result => {
      console.log('Test completed successfully');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed with error:', error);
      process.exit(1);
    });
}

module.exports = { runTest };
