const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/comment", async (req, res) => {
  const { name, email, comment, url, row } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!name || !email || !comment || !url) {
    return res.status(400).json({ status: "Error", message: "Missing fields" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 800 });

    // Mở trang web
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 10000,
    });

    // Gõ vào các input comment
    await page.type("input[name='author']", name);
    await page.type("input[name='email']", email);
    await page.type("textarea[name='comment']", comment);

    // Click submit và chờ trang reload
    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    await browser.close();

    return res.json({ status: "Success", message: "Commented successfully", row: row });

  } catch (err) {
    if (browser) await browser.close();
    console.error(err);
    return res.status(500).json({ status: "Error", message: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
