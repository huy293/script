const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/comment", async (req, res) => {
  const { url, name, email, comment } = req.body;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

    // Giả sử các selector dưới đây đúng, cần chỉnh lại tuỳ blog
    await page.type("input[name='author']", name);
    await page.type("input[name='email']", email);
    await page.type("textarea[name='comment']", comment);

    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle0" })
    ]);

    await browser.close();

    return res.json({ status: "Success", message: "Commented successfully" });
  } catch (err) {
    return res.json({ status: "Error", message: err.message });
  }
});

app.listen(3000, () => {
    console.log("Server is running at http://localhost:3000");
  });
