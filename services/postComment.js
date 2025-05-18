const launchBrowser = require('./browser');
const setupRequestInterception = require('./interceptRequests');
const fillForm = require('./fillForm');
const submitForm = require('./submitForm');

async function postComment({ url, author, email, comment, website }) {
  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    
    await setupRequestInterception(page);

    console.log('Đi tới trang:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Đợi 5 giây để kiểm tra nội dung...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // dừng 5 giây

    await fillForm(page, { author, email, comment, website });
    await new Promise(resolve => setTimeout(resolve, 5000)); // dừng 5 giây

    await submitForm(page);
    console.log('Đã gửi bình luận');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return { status: 'success', message: 'Đăng bình luận thành công' };
  } catch (error) {
    console.error('Lỗi:', error.message);
    return { status: 'error', message: error.message };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = postComment;
