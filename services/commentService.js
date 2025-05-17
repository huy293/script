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

// Chờ element ổn định (ko thay đổi vị trí, kích thước, ko disabled) trước khi thao tác
async function waitForStableElement(page, selector, timeout = 10000, stableTimeMs = 1500) {
  const pollInterval = 200;
  const maxPolls = timeout / pollInterval;
  let lastBox = null;
  let stableDuration = 0;

  for (let i = 0; i < maxPolls; i++) {
    const el = await page.$(selector);
    if (!el) {
      stableDuration = 0;
      await new Promise(r => setTimeout(r, pollInterval));
      continue;
    }
    const box = await el.boundingBox();
    const isDisabled = await page.evaluate(el => el.disabled, el);
    if (!box || isDisabled) {
      stableDuration = 0;
      await new Promise(r => setTimeout(r, pollInterval));
      continue;
    }
    if (
      lastBox &&
      box.x === lastBox.x &&
      box.y === lastBox.y &&
      box.width === lastBox.width &&
      box.height === lastBox.height
    ) {
      stableDuration += pollInterval;
      if (stableDuration >= stableTimeMs) {
        return el;
      }
    } else {
      stableDuration = 0;
      lastBox = box;
    }
    await new Promise(r => setTimeout(r, pollInterval));
  }
  throw new Error('Element không ổn định trong thời gian chờ');
}

// Chặn sự kiện unload/reload page để tránh bị detached frame khi submit
async function preventPageUnload(page) {
  await page.evaluate(() => {
    window.addEventListener('beforeunload', event => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    }, { capture: true });
  });
}

async function postComment({ url, author, email, comment, website }) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
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

    // Xoá tất cả thẻ <a>
    await page.evaluate(() => {
      document.querySelectorAll('a').forEach(el => el.remove());
    });

    // Xoá các phần tử comment để tránh trùng lặp
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

    // Focus hoặc cuộn tới textarea comment
    await page.evaluate(() => {
      const el = document.querySelector('textarea#comment');
      if (el) {
        el.focus();
      } else {
        window.scrollTo({ top: document.body.scrollHeight });
      }
    });

    // Kiểm tra textarea#comment tồn tại
    const commentField = await page.$('textarea#comment');
    if (!commentField) throw new Error('Không tìm thấy trường comment');

    // Xoá rồi nhập comment
    await commentField.click({ clickCount: 3 });
    await commentField.type(comment);

    // Hàm gõ dữ liệu cho input nếu có
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

    // Chờ nút submit ổn định
    const submitBtn = await waitForStableElement(page, 'button#submit, input#submit', 15000);

    // Chặn reload/unload trang trước khi submit
    await preventPageUnload(page);

    // Click submit và chờ navigation, bắt lỗi timeout nếu có
    try {
      await Promise.all([
        submitBtn.click(),
        page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
      ]);
    } catch (error) {
      // Có thể frame bị detached hoặc timeout khi đợi chuyển trang
      console.warn('Chuyển hướng có thể gặp lỗi hoặc quá chậm:', error.message);
      // Nếu cần, bạn có thể xử lý lại hoặc bỏ qua tùy trường hợp
    }

    await browser.close();
    return { status: 'success', message: 'Comment posted successfully' };
  } catch (error) {
    if (browser) await browser.close();
    return { status: 'error', message: error.message };
  }
}

module.exports = postComment;
