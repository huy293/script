const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/screenshot', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] }); // nếu chạy trên server cloud thì nên thêm args này
    const page = await browser.newPage();

    await page.setViewport({ width: 1000, height: 500 });
    await page.goto(url, { waitUntil: 'networkidle2' });

    const screenshotBuffer = await page.screenshot();

    await browser.close();

    // Gửi ảnh dưới dạng Buffer (image/png)
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': screenshotBuffer.length,
    });
    res.end(screenshotBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to take screenshot' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
