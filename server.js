const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const puppeteer = require("puppeteer"); // Nếu sử dụng puppeteer-core thì import puppeteer-core
const chrome = require("chrome-aws-lambda"); // Dành cho môi trường AWS Lambda

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/comment", async (req, res) => {
  const { url, name, email, comment } = req.body;

  try {
    // Tạo cấu hình để khởi động Puppeteer
    const browser = await puppeteer.launch({
      args: chrome.args, // Cấu hình args nếu bạn đang sử dụng AWS Lambda hoặc Render
      defaultViewport: chrome.defaultViewport, // Đảm bảo viewport mặc định
      executablePath: await chrome.executablePath || "/usr/bin/google-chrome", // Đường dẫn đến trình duyệt Chrome/Chromium
      headless: chrome.headless, // Đảm bảo Puppeteer chạy headless
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

    // Điền thông tin vào các trường input
    await page.type("input[name='author']", name);
    await page.type("input[name='email']", email);
    await page.type("textarea[name='comment']", comment);

    // Gửi comment và đợi điều hướng
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
