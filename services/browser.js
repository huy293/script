const puppeteer = require('puppeteer');

async function launchBrowser() {
  try {
    return await puppeteer.launch({
      headless: new, // Hoặc 'new' nếu hỗ trợ
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-notifications',
      ],
      timeout: 60000,          // Giảm timeout để tránh chờ quá lâu
      protocolTimeout: 120000,  // Tăng nhẹ protocolTimeout nếu Railway yếu
    });
  } catch (error) {
    throw new Error(`[browser.js] Lỗi khi khởi tạo browser: ${error.message}`);
  }
}

module.exports = launchBrowser;
