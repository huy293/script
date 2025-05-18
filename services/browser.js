const puppeteer = require('puppeteer-core');
const chromium = require('chromium');

async function launchBrowser() {
  try {
    return await puppeteer.launch({
      executablePath: chromium.path,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
      ],
      timeout: 60000,
      protocolTimeout: 120000,
    });
  } catch (error) {
    throw new Error(`[browser.js] Lỗi khi khởi tạo browser: ${error.message}`);
  }
}

module.exports = launchBrowser;
