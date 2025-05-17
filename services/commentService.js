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
async function postComment({ url, author, email, comment, website }) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });

    await page.setRequestInterception(true);
      page.on('request', req => {
        const blockedTypes = ['image', 'font', 'media', 'stylesheet', 'script', 'manifest', 'ping'];
        if (blockedTypes.includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });


    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitTillHTMLRendered(page, 120000);

    // Focus hoặc cuộn tới textarea comment
    await page.evaluate(() => {
      const el = document.querySelector('textarea#comment');
      if (el) {
        el.focus();
      } else {
        window.scrollTo({ top: document.body.scrollHeight });
      }
    });

    // Xóa và gán nhanh comment
await page.evaluate((comment) => {
  const el = document.querySelector('textarea#comment');
  if (el) {
    el.value = '';
    el.value = comment;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}, comment);

const safeSetValue = async (selector, value) => {
  if (!value) return;
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (el) {
      el.value = '';
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, selector, value);
};

await safeSetValue('input#author', author);
await safeSetValue('input#email', email);
await safeSetValue('input#url', website);

    // Chờ nút submit ổn định
    const submitBtn = await waitForStableElement(page, 'button#submit, input#submit', 3000);

    try {
      await submitBtn.focus();             // Focus vào nút submit
      await Promise.all([
        page.keyboard.press('Enter'),     // Nhấn Enter để submit
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      ]);
    } catch (error) {
      console.warn('Chuyển hướng có thể gặp lỗi hoặc quá chậm:', error.message);
    }


    await browser.close();
    return { status: 'success', message: 'Comment posted successfully' };
  } catch (error) {
    if (browser) await browser.close();
    return { status: 'error', message: error.message };
  }
}

module.exports = postComment;
