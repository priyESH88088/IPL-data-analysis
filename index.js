




import puppeteer from "puppeteer";
import fs from "fs";
import xlsx from "xlsx";


async function IPLStats(stat,year){
const url =`https://www.iplt20.com/stats/${year}/${stat}`;
console.log("Scrap : ",url);

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );

try{
  await page.goto(url, { waitUntil: "networkidle2" });
//   await page.screenshot({ path: `screenshot-${year}-${stat}.png`, fullPage: true });

await autoScroll(page);
  try {
  await page.waitForSelector("table.st-table.statsTable tbody tr td");
} catch (err) {
  console.error(`Timeout waiting for table rows on ${url}`);
  return [];  // or handle no data case gracefully
}

 const IPLData = await page.evaluate(() => {
  
    const rowData = document.querySelectorAll("table.st-table.statsTable tbody tr");
    console.log("Rows : "+ rowData);

    const IPLStatList = [];

    rowData.forEach((row)=>{
       const colsData = row.querySelectorAll("td");
        console.log( "Cols : " + colsData);

       if(colsData.length >= 14){
        const player = colsData[1].innerText.trim().replace(/\n/g," ");
        const runs = colsData[2].innerText.trim();
        const centuries = colsData[10].innerText.trim();
        const fifties = colsData[11].innerText.trim();
        const four_s = colsData[12].innerText.trim();
        const six_s = colsData[13].innerText.trim();

        IPLStatList.push({player,runs , centuries, fifties, six_s, four_s});
       }
    })
    
    return IPLStatList.slice(0,10);
   });
   console.log(IPLData);

 if (!fs.existsSync("data")) fs.mkdirSync("data");
   
 fs.writeFileSync(`data/IPL-${year}-${stat}.json`, JSON.stringify(IPLData, null, 2));

   const workbook = xlsx.utils.book_new(); 
   const sheet = xlsx.utils.json_to_sheet(IPLData);

xlsx.utils.book_append_sheet(workbook, sheet, "Top 10 Players");

    xlsx.writeFile(workbook, `data/IPL-${year}-${stat}.xlsx`);

//  console.log(`Scraped ${stat} data for ${year}`);

}
catch(err){
    console.log(`Failed to scrape ${stat} data for ${year}`,err);
}
finally{
await browser.close();
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
    "most-fifties": "most-50s"
  };

  const years = [2023,2022,2021,2020,2019];

for (let i = 0; i < years.length; i++) {
  const year = years[i];

  const statKeys = Object.keys(statTypes);
  for (let j = 0; j < statKeys.length; j++) {

    const statKey = statKeys[j];           // e.g. "most-runs"
      const statSlug = statTypes[statKey];   // e.g. "orange-cap"
      console.log("Scraping Stat slug:", statSlug, "for year:", year);
      await IPLStats(statSlug, year);
    }
  
 }

//   console.log("All  IPL data scraped successfully.");
}
scrapeAllStats();
