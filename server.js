const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/comment", async (req, res) => {
  const { url, name, email, comment } = req.body;

  try {
    const browser = await puppeteer.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      // Sử dụng fallback nếu không tìm thấy đường dẫn của chrome từ chrome-aws-lambda
      executablePath: process.env.CHROME_EXEC_PATH || await chrome.executablePath,
      headless: chrome.headless,
      enableExtensions: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

    await page.type("input[name='author']", name);
    await page.type("input[name='email']", email);
    await page.type("textarea[name='comment']", comment);

    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    await browser.close();

    return res.json({ status: "Success", message: "Commented successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "Error", message: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
