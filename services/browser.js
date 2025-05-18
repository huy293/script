const puppeteer = require('puppeteer');

async function launchBrowser() {
  try {
    return await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
      timeout: 120000,
      protocolTimeout: 360000,
    });
  } catch (error) {
    throw new Error(`[browser.js] Lỗi khi khởi tạo browser: ${error.message}`);
  }
}

module.exports = launchBrowser;
