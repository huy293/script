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

    // Chờ các trường hiện lên
    await page.waitForSelector('input#author', { visible: true, timeout: 0 });
    await page.waitForSelector('input#email', { visible: true, timeout: 0 });
    await page.waitForSelector('textarea#comment', { visible: true, timeout: 0 });
    await page.waitForSelector('input#url', { visible: true, timeout: 0 });
    await page.waitForSelector('button#submit', { visible: true, timeout: 0 });

    // Điền form
    await page.type('input#author', author);
    await page.type('input#email', email);
    await page.type('textarea#comment', comment);
    await page.type('input#url', website);
    // Submit form và chờ navigation (hoặc chờ phần tử xác nhận xuất hiện)
    // Click submit
    await Promise.all([
      page.click('button#submit'),
      // Nếu submit có chuyển trang, dùng waitForNavigation, nếu không thì comment dòng này đi
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 }).catch(() => {}),
    ]);

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
