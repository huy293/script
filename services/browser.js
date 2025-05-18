const puppeteer = require('puppeteer');

async function launchBrowser() {
  try {
    return await puppeteer.launch({
      headless: false, // Hoặc 'new' nếu hỗ trợ
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
      ],
      timeout: 60000,          // Giảm timeout để tránh chờ quá lâu
      protocolTimeout: 90000,  // Tăng nhẹ protocolTimeout nếu Railway yếu
    });
  } catch (error) {
    throw new Error(`[browser.js] Lỗi khi khởi tạo browser: ${error.message}`);
  }
}

module.exports = launchBrowser;
