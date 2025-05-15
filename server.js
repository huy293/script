const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/comment', async (req, res) => {
  const { url, author, email, comment } = req.body;
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

    // Chờ các trường input hiện lên và sẵn sàng thao tác
    await page.waitForSelector('input[name="author"]', { visible: true, timeout: 5000 });
    await page.waitForSelector('input[name="email"]', { visible: true, timeout: 5000 });
    await page.waitForSelector('textarea[name="comment"]', { visible: true, timeout: 5000 });
    await page.waitForSelector('button[type="submit"]', { visible: true, timeout: 5000 });

    // Gõ dữ liệu vào form
    await page.focus('input[name="author"]');
    await page.keyboard.type(author);

    await page.focus('input[name="email"]');
    await page.keyboard.type(email);

    await page.focus('textarea[name="comment"]');
    await page.keyboard.type(comment);

    // Submit form và chờ navigation (hoặc chờ phần tử xác nhận xuất hiện)
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      // Nếu không có navigation thì thay bằng chờ một phần tử xác nhận có thể có
      // ví dụ: await page.waitForSelector('.success-message', { timeout: 10000 })
    ]);

    await browser.close();

    res.json({ status: 'success', message: 'Comment posted successfully' });
  } catch (error) {
    if (browser) await browser.close();
    console.error('Comment error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
