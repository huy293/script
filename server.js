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
    console.log("Invalid URL detected:", url);
    return res.status(400).json({ status: 'error', message: 'Invalid URL', urlReceived: url });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 700 });
    await page.goto(url, { waitUntil: 'networkidle2'});

    // Cố gắng điền từng trường nếu có (không throw nếu không thấy)
    const safeType = async (selector, value, label) => {
      try {
        await page.waitForSelector(selector, { visible: true, timeout: 15000 });
        await page.type(selector, value);
      } catch {
        console.warn(`⚠️ Không tìm thấy trường ${label}, bỏ qua.`);
      }
    };

    await safeType('input#author', author, 'Tên');
    await safeType('input#email', email, 'Email');
    await safeType('textarea#comment', comment, 'Nội dung bình luận');

    if (website) await safeType('input#url', website, 'Website');

    // Tìm nút submit
    let submitButton = await page.$('button#submit');
    if (!submitButton) submitButton = await page.$('input#submit');

    if (!submitButton) {
      throw new Error('Không tìm thấy nút submit');
    }

    await Promise.all([
      submitButton.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
    ]);

    await browser.close();
    res.json({ status: 'success', message: 'Comment posted successfully' });
  } catch (error) {
    if (browser) await browser.close();
    console.error('Comment error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
