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
  try {
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

    const payload = JSON.stringify({
      title: title || "Meddelande",
      body: body || "",
      icon: "/icon-192.png",  // kan bytas
      badge: "/icon-192.png", // kan bytas
      url: url || "https://apps-22230.bubbleapps.io/",
    });

    await webpush.sendNotification(subscription, payload);

    return res.json({ success: true });
  } catch (err) {
    console.error("Fel i /send:", err);
    return res
      .status(500)
      .json({ error: "Push misslyckades", details: err.toString() });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("Push-server kör på port", PORT);
});