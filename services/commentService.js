const puppeteer = require('puppeteer');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function postComment({ url, author, email, comment, website }) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ],
      protocolTimeout: 60000,
      timeout: 60000
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });

    await page.setRequestInterception(true);
    page.on('request', req => {
      const blocked = ['image', 'stylesheet', 'font', 'media'];
      if (blocked.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

    // Điền nội dung bình luận
    await page.evaluate((comment) => {
      const el = document.querySelector('textarea#comment');
      if (el) {
        el.value = comment;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, comment);

    // Điền thông tin người dùng
    const safeSet = async (selector, value) => {
      if (!value) return;
      await page.evaluate((sel, val) => {
        const el = document.querySelector(sel);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, selector, value);
    };

    await safeSet('input#author', author);
    await safeSet('input#email', email);
    await safeSet('input#url', website);

    // Nhấn nút submit
    const submitBtn = await page.$('button#submit, input#submit');
    if (submitBtn) {
      await submitBtn.focus();

      await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
      ]);
    } else {
      throw new Error('Không tìm thấy nút Submit');
    }

    return { status: 'success', message: 'Đăng bình luận thành công' };
  } catch (error) {
    return { status: 'error', message: error.message };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = postComment;
