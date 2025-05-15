const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/screenshot', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();
    console.log('Using Chrome executable at:', chromePath);

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 500 });
    await page.goto(url, { waitUntil: 'networkidle2' });

    const screenshotBuffer = await page.screenshot();

    await browser.close();
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': screenshotBuffer.length,
    });
    res.end(screenshotBuffer);
  } catch (error) {
    console.error('Screenshot error:', error); // 👈 Xem log chi tiết
    res.status(500).json({ error: 'Failed to take screenshot', detail: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));