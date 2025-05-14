const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Util class để xử lý logic Puppeteer
class CommentRenderer {
  constructor(browser) {
    this.browser = browser;
  }

  async submitComment(url, name, email, comment) {
    const page = await this.browser.newPage();

    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36"
      );

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 15000, // hợp lý hơn timeout: 0
      });

      await page.type("input[name='author']", name);
      await page.type("input[name='email']", email);
      await page.type("textarea[name='comment']", comment);

      await Promise.all([
        page.click("button[type='submit']"),
        page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }),
      ]);

      await page.close();
      return { success: true };
    } catch (err) {
      await page.close();
      return { success: false, message: err.message };
    }
  }
}

app.post("/comment", async (req, res) => {
  const { url, name, email, comment } = req.body;

  if (!url || !name || !email || !comment) {
    return res.status(400).json({ status: "Error", message: "Missing fields" });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: process.env.CHROME_EXEC_PATH || await chrome.executablePath,
      headless: chrome.headless,
    });

    const renderer = new CommentRenderer(browser);
    const result = await renderer.submitComment(url, name, email, comment);

    await browser.close();

    if (!result.success) {
      return res.status(500).json({ status: "Error", message: result.message });
    }

    return res.json({ status: "Success", message: "Comment submitted successfully" });
  } catch (err) {
    if (browser) await browser.close();
    console.error("Failed to submit comment:", err);
    return res.status(500).json({ status: "Error", message: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
