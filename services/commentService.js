const puppeteer = require('puppeteer');

async function waitTillHTMLRendered(page, timeout = 15000) {
  const checkInterval = 500;
  const maxChecks = timeout / checkInterval;
  let lastHTMLSize = 0;
  let stableCount = 0;
  const minStableCount = 2;

  for (let i = 0; i < maxChecks; i++) {
    const html = await page.content();
    const currentHTMLSize = html.length;

    if (currentHTMLSize === lastHTMLSize) {
      stableCount++;
      if (stableCount >= minStableCount) break;
    } else {
      stableCount = 0;
      lastHTMLSize = currentHTMLSize;
    }
    await page.waitForTimeout(checkInterval);
  }
}

async function waitForStableElement(page, selector, timeout = 5000, stableTimeMs = 1000) {
  const pollInterval = 200;
  const maxPolls = timeout / pollInterval;
  let lastBox = null;
  let stableDuration = 0;

  for (let i = 0; i < maxPolls; i++) {
    const el = await page.$(selector);
    if (!el) {
      stableDuration = 0;
      await page.waitForTimeout(pollInterval);
      continue;
    }

    const box = await el.boundingBox();
    const isDisabled = await page.evaluate(el => el.disabled, el);
    if (!box || isDisabled) {
      stableDuration = 0;
      await page.waitForTimeout(pollInterval);
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
      if (stableDuration >= stableTimeMs) return el;
    } else {
      stableDuration = 0;
      lastBox = box;
    }

    await page.waitForTimeout(pollInterval);
  }

  throw new Error('Element không ổn định trong thời gian chờ');
}

async function postComment({ url, author, email, comment, website }) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });

    await page.setRequestInterception(true);
    page.on('request', req => {
      const blocked = ['image', 'stylesheet', 'font', 'media', 'script'];
      if (blocked.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitTillHTMLRendered(page);

    // Điền nội dung bình luận
    await page.evaluate((comment) => {
      const el = document.querySelector('textarea#comment');
      if (el) {
        el.value = comment;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, comment);

    // Điền các field còn lại
    const safeSet = async (selector, value) => {
      if (!value) return;
      await page.evaluate((sel, val) => {
        const el = document.querySelector(sel);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, selector, value);
    };

    await safeSet('input#author', author);
    await safeSet('input#email', email);
    await safeSet('input#url', website);

    // Gửi bình luận
    const submitBtn = await waitForStableElement(page, 'button#submit, input#submit');
    await submitBtn.focus();

    await Promise.all([
      page.keyboard.press('Enter'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => { }),
    ]);

    return { status: 'success', message: 'Đăng bình luận thành công' };
  } catch (error) {
    return { status: 'error', message: error.message };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = postComment;
