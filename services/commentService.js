const puppeteer = require('puppeteer');

async function postComment({ url, author, email, comment, website }) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      protocolTimeout: 120000, // timeout cho Chrome DevTools Protocol (CDP)
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });

    // Chặn tải các tài nguyên không cần thiết
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const blockedTypes = ['image', 'stylesheet', 'font', 'media', 'other'];
      if (blockedTypes.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Vào trang, chờ DOM sẵn sàng (nhanh hơn networkidle2)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Scroll tới form input#author
    await page.evaluate(() => {
      const el = document.querySelector('input#author');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Hàm gõ dữ liệu vào trường
    const safeType = async (selector, value, label) => {
      const input = await page.$(selector);
      if (!input) throw new Error(`Không tìm thấy trường ${label}`);
      await input.click({ clickCount: 3 }); // chọn nội dung cũ
      await input.type(value);
    };

    await safeType('input#author', author, 'Tên');
    await safeType('input#email', email, 'Email');
    await safeType('textarea#comment', comment, 'Nội dung bình luận');

    // Nếu có website, gõ vào input#url
    const websiteInput = await page.$('input#url');
    if (websiteInput) {
      await websiteInput.click({ clickCount: 3 });
      await websiteInput.type(website);
    }

    // Tìm nút submit, ưu tiên button#submit, fallback input#submit
    const submitBtn = (await page.$('button#submit')) || (await page.$('input#submit'));
    if (!submitBtn) throw new Error('Không tìm thấy nút submit');

    // Click submit và chờ navigation hoặc timeout nhẹ để tránh chờ lâu
    await Promise.all([
      submitBtn.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
    ]);

    await browser.close();
    return { status: 'success', message: 'Comment posted successfully' };
  } catch (error) {
    if (browser) await browser.close();
    return { status: 'error', message: error.message };
  }
}

module.exports = postComment;
