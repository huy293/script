const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/comment', async (req, res) => {
  const { url, author, email, comment } = req.body;
  if (!url || !author || !email || !comment) {
    return res.status(400).json({ error: 'Missing required fields: url, name, email, comment' });
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


    await page.type('input[name="author"]', author);
    await page.type('input[name="email"]', email);
    await page.type('textarea[name="comment"]', comment);

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
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
