const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const https = require("follow-redirects").https;
const fs = require("fs");

const twilio = require("twilio");

const accountSid = "AC3ad06204dcd3374f8d4e2a943ad292b1";
const authToken = "86ea2c1922ff90406ef01d3258792a9a";
const twilioClient = twilio(accountSid, authToken);

// Your Twilio phone number (must be Twilio verified)
const fromNumber = "+12524276581"; // Replace with your Twilio number including country code

// Your personal phone number to receive SMS (include country code +92)
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

// URL of the news page
const URL = "https://ambislamabad.esteri.it/en/news/";

// File to store the last seen news title
const LAST_TITLE_FILE = "lastTitle.txt";

// function makeCallWithInfobip(textMessage) {
//   const options = {
//     method: 'POST',
//     hostname: INFOBIP_BASE_URL,
//     path: '/tts/3/advanced',
//     headers: {
//       Authorization: INFOBIP_API_KEY,
//       'Content-Type': 'application/json',
//       Accept: 'application/json'
//     },
//     maxRedirects: 20
//   };

//   const req = https.request(options, res => {
//     let chunks = [];

//     res.on('data', chunk => chunks.push(chunk));
//     res.on('end', () => {
//       const body = Buffer.concat(chunks);
//       console.log('📞 Infobip response:', body.toString());
//     });
//     res.on('error', error => console.error('❌ Infobip error:', error));
//   });

//   const postData = JSON.stringify({
//     messages: [
//       {
//         destinations: [{ to: TO_NUMBER }],
//         from: '38515507799', // Your Infobip sender number (optional)
//         language: 'en',
//         text: textMessage,
//         voice: {
//           name: 'Joanna',
//           gender: 'female'
//         }
//       }
//     ]
//   });

//   req.write(postData);
//   req.end();
// }

// Email configuration (uncomment if needed)
/*
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your.email@gmail.com",
    pass: "your_app_password",
  },
});
*/

// Function to read the last seen title from file
function readLastTitle() {
  try {
    return fs.readFileSync(LAST_TITLE_FILE, "utf8");
  } catch (err) {
    return "";
  }
}

// Function to write the last seen title to file
function writeLastTitle(title) {
  fs.writeFileSync(LAST_TITLE_FILE, title);
}

// Function to check for new news
// async function checkForNews() {
//   try {
//     const response = await axios.get(URL);
//     const $ = cheerio.load(response.data);

//     // ✅ Updated selectors based on actual page structure
//     const latestNewsElement = $("article").first();
//     const latestNewsTitle = latestNewsElement.find("h3").text().trim();
//     const latestNewsLink = latestNewsElement.find("a").attr("href");

//     const lastTitle = readLastTitle();

//     if (latestNewsTitle && latestNewsTitle !== lastTitle) {
//       console.log(`🆕 New News Found: "${latestNewsTitle}"`);
//       console.log(`🔗 Link: https://ambislamabad.esteri.it${latestNewsLink}`);

//       // Uncomment to send email
//       /*
//       await transporter.sendMail({
//         from: '"Embassy News Bot" <your.email@gmail.com>',
//         to: "your.email@gmail.com",
//         subject: "New Embassy News Posted",
//         text: `A new news item has been posted: "${latestNewsTitle}".\nRead more at: https://ambislamabad.esteri.it${latestNewsLink}`,
//       });
//       */

//       // await client.calls.create({
//       //   to: toNumber,
//       //   from: fromNumber,
//       //   url: "http://demo.twilio.com/docs/voice.xml",
//       //   timeout: 10,
//       // });
//       await sendSMS(
//         `New Embassy News: "${latestNewsTitle}". Read more at: https://ambislamabad.esteri.it${latestNewsLink}`
//       );

//       console.log("📞 Call placed to notify about new news.");

//       // Update saved title
//       writeLastTitle(latestNewsTitle);
//     } else {
//       // makeCallWithInfobip("A new news item has been posted. Please check the website.");

//       // console.log('response...', r)
//       console.log("✅ No new news.");
//     }
//   } catch (error) {
//     console.error("❌ Error fetching the news page:", error.message);
//   }
// }

async function checkForNews() {
  try {
    const response = await axios.get('https://khanbbbb.blogspot.com/');
    const $ = cheerio.load(response.data);

    // Select first blog post container (update selector if needed)
    const latestPost = $('div.post').first();

    // Get the title text
    const latestPostTitle = latestPost.find('h3.post-title a').text().trim();

    // Get the post URL (href of the link inside title)
    const latestPostLink = latestPost.find('h3.post-title a').attr('href');

    const lastTitle = readLastTitle();

    if (latestPostTitle && latestPostTitle !== lastTitle) {
      console.log(`🆕 New Blog Post Detected: "${latestPostTitle}"`);
      console.log(`🔗 Link: ${latestPostLink}`);

      await sendSMS(
        `New Blog Post: "${latestPostTitle}". Read more at: ${latestPostLink}`
      );

      // Update last seen title
      writeLastTitle(latestPostTitle);
    } else {
      console.log("✅ No new blog post.");
    }
  } catch (error) {
    console.error("❌ Error fetching blog page:", error.message);
  }
}


async function getLatestNews() {
  try {
    const response = await axios.get(URL);
    const $ = cheerio.load(response.data);

    // Get the first article block (most recent)
    const latestArticle = $("article").first();

    const title = latestArticle.find("h3").text().trim();
    const date = latestArticle.find("div[class*=news-date]").text().trim();
    const relativeLink = latestArticle.find("a").attr("href");
    const fullLink = `https://ambislamabad.esteri.it${relativeLink}`;
    const description = latestArticle.find("p").text().trim();

    console.log("📰 Latest News Post:");
    console.log(`📅 Date: ${date}`);
    console.log(`📝 Title: ${title}`);
    console.log(`🔗 Link: ${fullLink}`);
    console.log(`🧾 Description: ${description}`);
  } catch (err) {
    console.error("❌ Failed to fetch latest news:", err.message);
  }
}

// Run every 10 minutes
cron.schedule("*/10 * * * * *", () => {
  console.log("🔍 Checking for news update...");
  checkForNews();
  // getLatestNews();
});
