require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Kutambua folda ya root kwa ajili ya HTML files
app.use(express.static(__dirname));

// Storage ya kumbukumbu za arifa na bei za Admin
let notifications = [
    { id: 1, title: "Karibu kwenye Mfumo!", message: "Huduma ziko tayari kutumika.", type: "info" }
];

let servicePrices = {
    basicPrice: 5000,
    vipPrice: 15000
};

// 1. GET: Pata Arifa
app.get('/api/notifications', (req, res) => {
    res.json({ success: true, notifications });
});

// 2. POST: Ongeza Arifa (Admin)
app.post('/api/notifications', (req, res) => {
    const { title, message, type } = req.body;
    if (!title || !message) {
        return res.status(400).json({ success: false, error: "Jaza kichwa na ujumbe!" });
    }
    const newNotif = { id: Date.now(), title, message, type: type || 'info' };
    notifications.unshift(newNotif);
    res.json({ success: true, message: "Arifa imetumwa!", notification: newNotif });
});

// 3. GET/POST: Kusimamia Bei za Admin (Badala ya Video za uongo)
app.get('/api/admin/prices', (req, res) => {
    res.json({ success: true, prices: servicePrices });
});

app.post('/api/admin/prices', (req, res) => {
    const { basicPrice, vipPrice } = req.body;
    if (basicPrice) servicePrices.basicPrice = Number(basicPrice);
    if (vipPrice) servicePrices.vipPrice = Number(vipPrice);
    res.json({ success: true, message: "Bei zimebadilishwa mafanikio!", prices: servicePrices });
});

// 4. HarakaPay Payment Integration (Kusanya Malipo)
app.post('/api/payments/collect', async (req, res) => {
    const { phone, amount } = req.body;
    
    if (!phone || !amount) {
        return res.status(400).json({ success: false, error: "Weka namba ya simu na kiasi!" });
    }

    try {
        const HARAKAPAY_API_KEY = process.env.HARAKAPAY_API_KEY;
        
        const response = await axios.post('https://harakapay.net/api/v1/collect', {
            phone_number: phone,
            amount: Number(amount),
            description: 'Website Service Payment',
            webhook_url: 'https://' + req.get('host') + '/api/payments/webhook'
        }, {
            headers: {
                'X-API-Key': HARAKAPAY_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("HarakaPay Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data?.message || "Imeshindikana kuunganisha na HarakaPay." });
    }
});

// 5. Webhook ya HarakaPay kupokea majibu ya malipo
app.post('/api/payments/webhook', (req, res) => {
    const paymentData = req.body;
    console.log("💰 Malipo yamepokelewa:", paymentData);
    res.status(200).json({ received: true });
});

// 6. POST: Wasiliana na AI (OpenRouter - OPENROUTER_API_KEY)
app.post('/api/ai/ask', async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ success: false, error: "Andika swali lako!" });
    }

    try {
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "openai/gpt-4o",
            messages: [
                { role: "system", content: "Wewe ni msaidizi mzuri wa tovuti." },
                { role: "user", content: prompt }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://' + req.get('host'),
                'X-Title': 'My Website'
            }
        });

        const reply = response.data.choices[0].message.content;
        res.json({ success: true, reply });
    } catch (error) {
        console.error("AI Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: "Imeshindikana kuunganisha na AI kwa sasa." });
    }
});

// Routes za kufungua kurasa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Kuanzisha Seva
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server inaendesha kwenye port ${PORT}`);
});

