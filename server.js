const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(bodyParser.json());

const isProduction = process.env.AWS_REGION || process.env.RENDER;

let puppeteer, launchOptions;

async function setupPuppeteer() {
  if (isProduction) {
    // Use chrome-aws-lambda when running on Render or AWS
    puppeteer = require("puppeteer-core");
    const chrome = require("chrome-aws-lambda");

    launchOptions = {
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,  // await inside async function
      headless: chrome.headless,
    };
  } else {
    // Use puppeteer locally for development
    puppeteer = require("puppeteer");
    launchOptions = {
      headless: true,
    };
  }
}

app.post("/comment", async (req, res) => {
  const { url, name, email, comment } = req.body;

  try {
    // Ensure Puppeteer is set up before launching the browser
    await setupPuppeteer();

    const browser = await puppeteer.launch(launchOptions);
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
    return res.json({ status: "Error", message: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running");
});
