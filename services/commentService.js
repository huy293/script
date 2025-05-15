const puppeteer = require('puppeteer');

async function postComment({ url, author, email, comment, website }) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      protocolTimeout: 120000 // Tăng thời gian timeout của Chrome protocol
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });

    // Chặn các tài nguyên không cần thiết để tăng tốc
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      const blocked = ['image', 'stylesheet', 'font', 'media', 'other'];
      if (blocked.includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Cuộn tới form
    await page.evaluate(() => {
      const element = document.querySelector('input#author');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // Điền form
    const safeType = async (selector, value, label) => {
      const found = await page.$(selector);
      if (!found) throw new Error(`Không tìm thấy trường ${label}`);
      await found.click({ clickCount: 3 }); // chọn toàn bộ nội dung cũ nếu có
      await found.type(value);
    };

    await safeType('input#author', author, 'Tên');
    await safeType('input#email', email, 'Email');
    await safeType('textarea#comment', comment, 'Nội dung bình luận');

    const websiteField = await page.$('input#url');
    if (websiteField) {
      await websiteField.click({ clickCount: 3 });
      await websiteField.type(website);
    }

    const submitButton = await page.$('button#submit') || await page.$('input#submit');
    if (!submitButton) throw new Error('Không tìm thấy nút submit');

    // Gửi form và chờ phản hồi hoặc timeout nhẹ
    await Promise.all([
      submitButton.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
    ]);

    await browser.close();
    return { status: 'success', message: 'Comment posted successfully' };
  } catch (error) {
    if (browser) await browser.close();
    return { status: 'error', message: error.message };
  }
}

module.exports = postComment;
