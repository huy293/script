const puppeteer = require('puppeteer');

async function postComment({ url, author, email, comment, website }) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });
    await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

    // Cuộn đến phần tử form (input#author)
    await page.evaluate(() => {
      const element = document.querySelector('input#author');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    const safeType = async (selector, value, label) => {
      const found = await page.$(selector);
      if (!found) throw new Error(`Không tìm thấy trường ${label}`);
      await page.type(selector, value);
    };

    await safeType('input#author', author, 'Tên');
    await safeType('input#email', email, 'Email');
    await safeType('textarea#comment', comment, 'Nội dung bình luận');

    const websiteField = await page.$('input#url');
    if (websiteField) await page.type('input#url', website);

    let submitButton = await page.$('button#submit') || await page.$('input#submit');
    if (!submitButton) throw new Error('Không tìm thấy nút submit');

    await Promise.all([
      submitButton.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
    ]);

    await browser.close();
    return { status: 'success', message: 'Comment posted successfully' };
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

module.exports = postComment;
