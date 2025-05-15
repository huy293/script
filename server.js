const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/comment', async (req, res) => {
  const { url, author, email, comment, website } = req.body;
  if (!url || !author || !email || !comment) {
    return res.status(400).json({ error: 'Missing required fields: url, author, email, comment' });
  }

  const validUrl = (str) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };
  if (!validUrl(url)) {
    return res.status(400).json({ status: 'error', message: 'Invalid URL' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });
    await page.goto(url, { waitUntil: 'networkidle2' });

   const safeWait = async (selector) => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

  if (await safeWait('input#author')) await page.type('input#author', author);
  if (await safeWait('input#email')) await page.type('input#email', email);
  if (await safeWait('textarea#comment')) await page.type('textarea#comment', comment);
  if (await safeWait('input#url')) await page.type('input#url', website);


    // Click submit
    const submitButton = await page.$('button[type=submit], input[type=submit]');
  if (submitButton) {
    await Promise.all([
      submitButton.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
    ]);
  }

    await browser.close();

    res.json({ status: 'success', message: 'Comment posted successfully' });
  } catch (error) {
    if (browser) await browser.close();
    console.error('comment error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
