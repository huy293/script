const puppeteer = require('puppeteer');

async function waitTillHTMLRendered(page, timeout = 30000) {
  const checkDurationMs = 1000;
  const maxChecks = timeout / checkDurationMs;
  let lastHTMLSize = 0;
  let checkCounts = 0;
  let stableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while (checkCounts < maxChecks) {
    checkCounts++;
    const html = await page.content();
    const currentHTMLSize = html.length;

    if (lastHTMLSize !== 0 && currentHTMLSize === lastHTMLSize) {
      stableSizeIterations++;
    } else {
      stableSizeIterations = 0;
    }

    if (stableSizeIterations >= minStableSizeIterations) break;

    lastHTMLSize = currentHTMLSize;
    await new Promise(resolve => setTimeout(resolve, checkDurationMs));
  }
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
        '--single-process',
        '--no-zygote',
        '--disable-gpu',
      ],
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });

    await page.setRequestInterception(true);
    page.on('request', req => {
      const blockedTypes = ['image', 'font', 'media'];
      if (blockedTypes.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await waitTillHTMLRendered(page, 30000);

    // Xoá <a>
    await page.evaluate(() => {
      document.querySelectorAll('a').forEach(el => el.remove());
    });

    // Xoá các phần tử comment không cần thiết
    await page.evaluate(() => {
      const selectorsToRemove = [
        'li.comment', 'div.comment', 'article.comment-body',
        '.comment-content', '.comment-author', '.comment-meta',
        '.comment-metadata', '.media.comment', '.media-body',
        '.avatar', '.reply'
      ];
      selectorsToRemove.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
      });
    });

    // Focus vào textarea
    await page.evaluate(() => {
      const el = document.querySelector('textarea#comment');
      if (el) el.focus();
      else window.scrollTo({ top: document.body.scrollHeight });
    });

    // Gõ comment
    const commentField = await page.$('textarea#comment');
    if (!commentField) throw new Error('Không tìm thấy trường comment');
    await commentField.click({ clickCount: 3 });
    await commentField.type(comment);

    // Gõ thông tin người dùng
    const safeType = async (selector, value) => {
      if (!value) return;
      const input = await page.$(selector);
      if (!input) return;
      await input.click({ clickCount: 3 });
      await input.type(value);
    };

    await safeType('input#author', author);
    await safeType('input#email', email);
    await safeType('input#url', website);

    // Tìm nút submit
    const submitHandle = await page.waitForSelector('button#submit, input#submit', {
      visible: true,
      timeout: 10000,
    });

    // Kiểm tra lại nút còn tồn tại và không bị disabled
    const isClickable = await page.evaluate(el => {
      return document.contains(el) && !el.disabled;
    }, submitHandle);

    if (!isClickable) throw new Error('Nút submit không khả dụng');

    // Click an toàn với retry (tối đa 3 lần)
    let clicked = false;
    for (let i = 0; i < 3 && !clicked; i++) {
      try {
        await Promise.all([
          submitHandle.evaluate(el => el.click()),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
        ]);
        clicked = true;
      } catch (err) {
        if (i === 2) throw new Error('Click submit thất bại sau 3 lần');
        await new Promise(res => setTimeout(res, 1000));
      }
    }

    await browser.close();
    return { status: 'success', message: 'Comment posted successfully' };

  } catch (error) {
    if (browser) await browser.close();
    return { status: 'error', message: error.message };
  }
}

module.exports = postComment;
