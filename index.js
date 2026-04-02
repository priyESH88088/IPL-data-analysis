import puppeteer from "puppeteer";
import fs from "fs";
import xlsx from "xlsx";
const MIN_COLUMNS = 14;
async function IPLStats(page, urlStat, fileStat, year) {
  const url = `https://www.iplt20.com/stats/${year}/${urlStat}`;
  console.log("Scraping:", url);
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    await autoScroll(page);
    try {
      await page.waitForSelector("table.st-table.statsTable tbody tr td");
    } catch (err) {
      console.error(`Timeout waiting for table rows on ${url}`);
      return [];
    }
    const IPLData = await page.evaluate((MIN_COLUMNS) => {
      const rows = document.querySelectorAll(
        "table.st-table.statsTable tbody tr"
      );
      const result = [];
      rows.forEach((row) => {
        const cols = row.querySelectorAll("td");
        if (cols.length >= MIN_COLUMNS) {
          const player = cols[1].innerText.trim().replace(/\n/g, " ");
          const runs = cols[2].innerText.trim();
          const centuries = cols[10].innerText.trim();
          const fifties = cols[11].innerText.trim();
          const four_s = cols[12].innerText.trim();
          const six_s = cols[13].innerText.trim();
          result.push({ player, runs, centuries, fifties, four_s, six_s });
        }
      });
      return result.slice(0, 10);
    }, MIN_COLUMNS);
    if (!IPLData.length) {
      console.warn(`No data found for ${year} - ${fileStat}`);
      return;
    }
    if (!fs.existsSync("data")) fs.mkdirSync("data");
    fs.writeFileSync(
      `data/IPL-${year}-${fileStat}.json`,
      JSON.stringify(IPLData, null, 2)
    );
    const workbook = xlsx.utils.book_new();
    const sheet = xlsx.utils.json_to_sheet(IPLData);
    xlsx.utils.book_append_sheet(workbook, sheet, "Top 10 Players");
    xlsx.writeFile(workbook, `data/IPL-${year}-${fileStat}.xlsx`);
    console.log(`Done: ${fileStat} (${year})`);
  } catch (err) {
    console.log(`Failed: ${fileStat} (${year})`, err.message);
  }
}
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}
async function scrapeAllStats() {
  const statTypes = {
    "most-runs": "orange-cap",
    "most-fours": "most-4s",
    "most-sixes": "most-6s",
    "most-centuries": "most-100s",
    "most-fifties": "most-50s",
  };
  const years = [2023, 2022, 2021, 2020, 2019];
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    for (let i = 0; i < years.length; i++) {
      const year = years[i];
      for (const [urlStat, fileStat] of Object.entries(statTypes)) {
        console.log(`Processing ${year} - ${fileStat}`);
        const page = await browser.newPage();
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        );
        await IPLStats(page, urlStat, fileStat, year);
        await page.close();
      }
    }
    console.log("All IPL data scraped successfully");
  } catch (err) {
    console.error("Error in scraping:", err.message);
  } finally {
    await browser.close();
  }
}
scrapeAllStats();

