const express = require("express");
const cors = require("cors");
const webpush = require("web-push");

const app = express();
app.use(cors());
app.use(express.json());

// --- DINA VAPID-KEYS (PUBLIC + PRIVATE) ---
const publicVapidKey =
  "BK-jH6Sd16Z5mgGsLt6FAG7qdgtT4jwHhc20Ng0ifzYqxAWrtEQbkus7L9HjjC2hW08DZ1B159Mu7TisitoVm5w";
const privateVapidKey = "3Roi5kprofsvFG91Je7GyEMHq8WHse8GG6NHz65BHZI";

webpush.setVapidDetails(
  "mailto:info@tradspecialisterna.se",
  publicVapidKey,
  privateVapidKey
);

// Enkel "hemlig nyckel" så inte vem som helst kan använda ditt push-API
const SERVER_SECRET = "Nvidia8007185716@";

// POST /send  → skicka EN push till EN subscription
app.post("/send", async (req, res) => {
  const { secret, endpoint, p256dh, auth, title, body, url } = req.body;

  if (secret !== SERVER_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const subscription = {
    endpoint,
    keys: {
      p256dh,
      auth,
    },
  };

  console.log("Skickar push till endpoint:", endpoint);

  const payload = JSON.stringify({
    title: title || "Meddelande",
    body: body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    url: url || "https://apps-22230.bubbleapps.io/",
    sentAt: Date.now(),
  });

  const options = {
    TTL: 60,
    urgency: "high",
  };

  try {
    await webpush.sendNotification(subscription, payload, options);

    console.log("Push skickad OK till:", endpoint);
    // success = true, gone = false
    return res.json({ success: true, gone: false });
  } catch (err) {
    // Vanligast: 404 / 410 = subscription ogiltig/borttagen
    console.error(
      "WebPush error:",
      err.statusCode,
      err.body || err.toString()
    );

    if (err.statusCode === 404 || err.statusCode === 410) {
      // Säg till Bubble att denna subscription är "död"
      return res.json({
        success: false,
        gone: true,
        statusCode: err.statusCode,
      });
    }

    // Andra fel → riktig 500
    return res.status(500).json({
      error: "Push misslyckades",
      details: err.toString(),
      statusCode: err.statusCode || null,
    });
  }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("Push-server kör på port", PORT);
});