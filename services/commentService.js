const puppeteer = require('puppeteer');

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
      timeout: 120000,
      protocolTimeout: 120000,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });

    // Comment tạm thời đoạn setRequestInterception để test
    // await page.setRequestInterception(true);
    // page.on('request', req => {
    //   const blocked = ['image', 'stylesheet', 'font', 'media', 'script'];
    //   if (blocked.includes(req.resourceType())) {
    //     req.abort();
    //   } else {
    //     req.continue();
    //   }
    // });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Kiểm tra selector textarea#comment
    const hasComment = await page.$('textarea#comment');
    if (!hasComment) throw new Error('Không tìm thấy textarea#comment');

    await page.evaluate(comment => {
      const el = document.querySelector('textarea#comment');
      el.value = comment;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, comment);

    if (author) {
      const el = await page.$('input#author');
      if (!el) throw new Error('Không tìm thấy input#author');
      await page.evaluate(author => {
        const el = document.querySelector('input#author');
        el.value = author;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, author);
    }

    if (email) {
      const el = await page.$('input#email');
      if (!el) throw new Error('Không tìm thấy input#email');
      await page.evaluate(email => {
        const el = document.querySelector('input#email');
        el.value = email;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, email);
    }

    if (website) {
      const el = await page.$('input#url');
      if (!el) throw new Error('Không tìm thấy input#url');
      await page.evaluate(website => {
        const el = document.querySelector('input#url');
        el.value = website;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, website);
    }

    const submitBtn = await page.$('button#submit, input#submit');
    if (!submitBtn) throw new Error('Không tìm thấy nút submit');

    await Promise.all([
      submitBtn.click(),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {}),
    ]);

    return { status: 'success', message: 'Đăng bình luận thành công' };
  } catch (error) {
    return { status: 'error', message: error.message };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = postComment;
