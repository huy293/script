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
        '--disable-features=HttpsFirstBalancedModeAutoEnable',
        '--disable-features=site-per-process',
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
    
    // 1. Xoá <a>
    await page.evaluate(() => {
      document.querySelectorAll('a').forEach(el => el.remove());
    });
    
    // 2. Xoá các phần tử liên quan đến comment (trừ iframe)
    await page.evaluate(() => {
      const selectorsToRemove = [
        'li.comment',
        'div.comment',
        'article.comment-body',
        '.comment-content',
        '.comment-author',
        '.comment-meta',
        '.comment-metadata',
        '.media.comment',
        '.media-body',
        '.avatar',
        '.reply'
      ];
      selectorsToRemove.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
      });
    });
    
    // 3. Cuộn hoặc focus nhẹ
    await page.evaluate(() => {
      const el = document.querySelector('textarea#comment');
      if (el) {
        el.focus();
      } else {
        window.scrollTo({ top: document.body.scrollHeight });
      }
    });
    

    // Bắt buộc phải có textarea#comment
    const commentField = await page.$('textarea#comment');
    if (!commentField) throw new Error('Không tìm thấy trường comment');
    await commentField.click({ clickCount: 3 });
    await commentField.type(comment);

    // Gõ các trường thông tin nếu có
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

    const submitBtn = (await page.$('button#submit')) || (await page.$('input#submit'));
    if (!submitBtn) throw new Error('Không tìm thấy nút submit');

    await Promise.all([
      submitBtn.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
      await page.waitForTimeout(3000),
    ]);

    await browser.close();
    return { status: 'success', message: 'Comment posted successfully' };
  } catch (error) {
    if (browser) await browser.close();
    return { status: 'error', message: error.message };
  }
}

module.exports = postComment;
