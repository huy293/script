const launchBrowser = require('./browser');
const setupRequestInterception = require('./interceptRequests');
const fillForm = require('./fillForm');
const submitForm = require('./submitForm');

async function postComment({ url, author, email, comment, website }) {
  let browser;

  try {
    browser = await launchBrowser();
    // const page = await browser.newPage();
    // await page.setViewport({ width: 1000, height: 700 });

    // await setupRequestInterception(page);

    // console.log('Đi tới trang:', url);
    // await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // await fillForm(page, { author, email, comment, website });

    // await submitForm(page);

    // console.log('Đã gửi bình luận');

    return { status: 'success', message: 'Đăng bình luận thành công' };
  } catch (error) {
    console.error('Lỗi:', error.message);
    return { status: 'error', message: error.message };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = postComment;
