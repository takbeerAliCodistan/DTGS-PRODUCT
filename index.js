const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const cron = require("node-cron");

const twilio = require("twilio");

const accountSid = "AC3ad06204dcd3374f8d4e2a943ad292b1";
const authToken = "86ea2c1922ff90406ef01d3258792a9a";
const twilioClient = twilio(accountSid, authToken);

const fromNumber = "+12524276581";
const toNumberSMS = "+923369594783";

async function sendSMS(message) {
  try {
    const messageResponse = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: toNumberSMS,
    });
    console.log("📩 SMS sent via Twilio:", messageResponse.sid);
  } catch (error) {
    console.error("❌ Twilio SMS error:", error.message);
  }
}

// Files to store last seen titles
const LAST_NEWS_TITLE_FILE = "lastNewsTitle.txt";
const LAST_ANNOUNCE_TITLE_FILE = "lastAnnouncementTitle.txt";

// URLs
const NEWS_URL = "https://ambislamabad.esteri.it/en/news/";
const ANNOUNCEMENT_URL = "https://theitalyvisa.com/page/announcement";

// Read/write helpers
function readLastTitle(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (err) {
    return "";
  }
}

function writeLastTitle(file, title) {
  fs.writeFileSync(file, title);
}

// Check news site for updates
async function checkNews() {
  try {
    const response = await axios.get(NEWS_URL);
    const $ = cheerio.load(response.data);

    const latestNewsElement = $("article").first();
    const latestTitle = latestNewsElement.find("h3").text().trim();
    const latestLink = latestNewsElement.find("a").attr("href");
    const fullLink = `https://ambislamabad.esteri.it${latestLink}`;

    const lastTitle = readLastTitle(LAST_NEWS_TITLE_FILE);

    if (latestTitle && latestTitle !== lastTitle) {
      console.log(`🆕 New News Found: "${latestTitle}"`);
      console.log(`🔗 Link: ${fullLink}`);

      for (let i = 0; i < 10; i++) {
        console.log("send message number news", i + 1);
        await sendSMS(`New News: "${latestTitle}". Read more at: ${fullLink}`);
      }

      writeLastTitle(LAST_NEWS_TITLE_FILE, latestTitle);
      return true; // new content found
    }
    console.log("✅ No new news found.");
    return false;
  } catch (error) {
    console.error("❌ Error checking news:", error.message);
    return false;
  }
}

// Check announcement site for updates
async function checkAnnouncements() {
  try {
    const response = await axios.get(ANNOUNCEMENT_URL);
    const $ = cheerio.load(response.data);

    // Based on your screenshot and previous page structure:
    // Announcements are links under <div> with class or inside the page body
    // We'll target the first announcement link text and href

    // Find first announcement link text and href - update selector if needed
    const firstAnnouncement = $("a")
      .filter(function () {
        return $(this).parent().text().includes("Announcement");
      })
      .first();

    const latestTitle = firstAnnouncement.text().trim();
    const latestLink = firstAnnouncement.attr("href");

    const lastTitle = readLastTitle(LAST_ANNOUNCE_TITLE_FILE);

    if (latestTitle && latestTitle !== lastTitle) {
      console.log(`🆕 New Announcement Found: "${latestTitle}"`);
      console.log(`🔗 Link: ${latestLink}`);

      for (let i = 0; i < 10; i++) {
        console.log("send message number announcment", i + 1);
        await sendSMS(
          `New Announcement: "${latestTitle}". Check here: ${latestLink}`
        );
      }

      writeLastTitle(LAST_ANNOUNCE_TITLE_FILE, latestTitle);
      return true;
    }
    console.log("✅ No new announcements found.");
    return false;
  } catch (error) {
    console.error("❌ Error checking announcements:", error.message);
    return false;
  }
}

// Main check function to check both sites
async function checkBothSites() {
  console.log("🔍 Checking news and announcements for updates...");

  const newsUpdated = await checkNews();
  const announcementsUpdated = await checkAnnouncements();

  if (!newsUpdated && !announcementsUpdated) {
    console.log("✅ No new updates on either site.");
  }
}

// Example: run every 10 minutes

cron.schedule("*/5 * * * * *", () => {
  checkBothSites();
});
