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
    const html = await page.content(); // [Error-1]
    const currentHTMLSize = html.length;

    if (lastHTMLSize !== 0 && currentHTMLSize === lastHTMLSize) {
      stableSizeIterations++;
    } else {
      stableSizeIterations = 0;
    }

    if (stableSizeIterations >= minStableSizeIterations) break;

    lastHTMLSize = currentHTMLSize;
    await new Promise(resolve => setTimeout(resolve, checkDurationMs)); // [Error-2]
  }
}

async function waitForStableElement(page, selector, timeout = 10000, stableTimeMs = 1500) {
  const pollInterval = 200;
  const maxPolls = timeout / pollInterval;
  let lastBox = null;
  let stableDuration = 0;

  for (let i = 0; i < maxPolls; i++) {
    const el = await page.$(selector); // [Error-3]
    if (!el) {
      stableDuration = 0;
      await new Promise(r => setTimeout(r, pollInterval)); // [Error-4]
      continue;
    }
    const box = await el.boundingBox(); // [Error-5]
    const isDisabled = await page.evaluate(el => el.disabled, el); // [Error-6]
    if (!box || isDisabled) {
      stableDuration = 0;
      await new Promise(r => setTimeout(r, pollInterval)); // [Error-7]
      continue;
    }
    if (
      lastBox &&
      box.x === lastBox.x &&
      box.y === lastBox.y &&
      box.width === lastBox.width &&
      box.height === lastBox.height
    ) {
      stableDuration += pollInterval; // [Error-8]
      if (stableDuration >= stableTimeMs) {
        return el; // [Error-9]
      }
    } else {
      stableDuration = 0;
      lastBox = box; // [Error-10]
    }
    await new Promise(r => setTimeout(r, pollInterval)); // [Error-11]
  }
  throw new Error('Element không ổn định trong thời gian chờ [Error-12]');
}

async function postComment({ url, author, email, comment, website }) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',                     // [Error-13]
        '--disable-setuid-sandbox',         // [Error-14]
        '--disable-dev-shm-usage',          // [Error-15]
        '--disable-gpu',                    // [Error-16]
      ],
      // protocolTimeout là option không hợp lệ của puppeteer.launch, có thể gây lỗi
      // nên bỏ hoặc đổi cách set timeout khác
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 }); // [Error-17]

    await page.setRequestInterception(true); // [Error-18]
    page.on('request', req => {
      const blockedTypes = ['image', 'font', 'media', 'stylesheet', 'script', 'manifest', 'ping'];
      if (blockedTypes.includes(req.resourceType())) { // [Error-19]
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 }); // [Error-20]
    await waitTillHTMLRendered(page, 120000); // [Error-21]

    await page.evaluate(() => {
      const el = document.querySelector('textarea#comment'); // [Error-22]
      if (el) {
        el.focus();
      } else {
        window.scrollTo({ top: document.body.scrollHeight });
      }
    });

    await page.evaluate((comment) => {
      const el = document.querySelector('textarea#comment'); // [Error-23]
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
        const el = document.querySelector(sel); // [Error-24]
        if (el) {
          el.value = '';
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, selector, value);
    };

    await safeSetValue('input#author', author);  // [Error-25]
    await safeSetValue('input#email', email);    // [Error-26]
    await safeSetValue('input#url', website);    // [Error-27]

    const submitBtn = await waitForStableElement(page, 'button#submit, input#submit', 3000); // [Error-28]

    try {
      await submitBtn.focus();             // [Error-29]
      await Promise.all([
        page.keyboard.press('Enter'),     // [Error-30]
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }), // [Error-31]
      ]);
    } catch (error) {
      console.warn('Chuyển hướng có thể gặp lỗi hoặc quá chậm:', error.message, '[Error-32]');
    }

    await browser.close(); // [Error-33]
    return { status: 'success', message: 'Comment posted successfully' };
  } catch (error) {
    if (browser) await browser.close(); // [Error-34]
    return { status: 'error', message: error.message + ' [Error-35]' };
  }
}

module.exports = postComment;
