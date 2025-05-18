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
      ],
      timeout: 60000,        // 60s timeout khi khởi tạo browser
      protocolTimeout: 60000 // timeout giao thức cũng 60s
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });

    // Chặn các request tài nguyên không cần thiết để tiết kiệm tài nguyên
    await page.setRequestInterception(true);
    page.on('request', req => {
      const blocked = ['image', 'stylesheet', 'font', 'media', 'script'];
      if (blocked.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Điền nội dung bình luận
    await page.evaluate((comment) => {
      const el = document.querySelector('textarea#comment');
      if (el) {
        el.value = comment;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, comment);

    // Hàm điền thông tin input an toàn
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

    // Lấy nút submit (có thể là button hoặc input) và submit form
    const submitBtn = await page.$('button#submit, input#submit');
    if (!submitBtn) throw new Error('Không tìm thấy nút submit');

    await submitBtn.focus();

    await Promise.all([
      submitBtn.click(),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {})
    ]);

    return { status: 'success', message: 'Đăng bình luận thành công' };
  } catch (error) {
    return { status: 'error', message: error.message };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = postComment;
