const puppeteer = require('puppeteer-extra');

const chromium = require('chromium');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

async function launchBrowser() {
  try {
    return await puppeteer.launch({
      executablePath: chromium.path,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
      ],
      
      timeout: 60000,
      protocolTimeout: 120000,
    });
  } catch (error) {
    throw new Error(`[browser.js] Lỗi khi khởi tạo browser: ${error.message}`);
  }
}

module.exports = launchBrowser;
