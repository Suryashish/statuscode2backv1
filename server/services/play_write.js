// import { chromium } from "playwright";
// import fs from "fs";
const { chromium } = require("playwright");
const fs = require("fs");

const playwright_function = async (url) => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // const url = "https://playwright.dev/python/docs/input";
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Extract all visible text from the body
    const textContent = await page.innerText("body");

    // Save into a TXT file
    fs.writeFileSync("documents/page_content.txt", textContent, "utf-8");

    console.log(`✅ Full text content of ${url} saved to page_content.txt`);

    await browser.close();
};
// (async () => {
//   const browser = await chromium.launch({ headless: true });
//   const page = await browser.newPage();

//   const url = "https://playwright.dev/python/docs/input";
//   await page.goto(url, { waitUntil: "domcontentloaded" });

//   // Extract all visible text from the body
//   const textContent = await page.innerText("body");

//   // Save into a TXT file
//   fs.writeFileSync("documents/page_content.txt", textContent, "utf-8");

//   console.log(`✅ Full text content of ${url} saved to page_content.txt`);

//   await browser.close();
// })();

module.exports = {
  playwright_function
};
