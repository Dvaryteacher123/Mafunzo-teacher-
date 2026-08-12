const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Kutambua folda ya public/root kwa ajili ya HTML files
app.use(express.static(__dirname));

// Storage ya kumbukumbu ya arifa (Notifications)
let notifications = [
    { id: 1, title: "Karibu kwenye Mfumo!", message: "Sasa unaweza kusoma na kupata huduma kwa urahisi.", type: "info" }
];

// 1. GET: Pata Arifa zote
app.get('/api/notifications', (req, res) => {
    res.json({ success: true, notifications });
});

// 2. POST: Ongeza Arifa Mpya (Admin)
app.post('/api/notifications', (req, res) => {
    const { title, message, type } = req.body;
    if (!title || !message) {
        return res.status(400).json({ success: false, error: "Jaza kichwa cha habari na ujumbe!" });
    }
    const newNotif = { id: Date.now(), title, message, type: type || 'info' };
    notifications.unshift(newNotif);
    res.json({ success: true, message: "Arifa imetumwa!", notification: newNotif });
});

// 3. DELETE: Futa Arifa (Admin)
app.delete('/api/notifications/:id', (req, res) => {
    const { id } = req.params;
    notifications = notifications.filter(n => n.id != id);
    res.json({ success: true, message: "Arifa imefutwa!" });
});

// 4. POST: HarakaPay Payment Integration (Kusanya Malipo kupitia USSD Push)
app.post('/api/payments/collect', async (req, res) => {
    const { phone, amount } = req.body;
    
    if (!phone || !amount) {
        return res.status(400).json({ success: false, error: "Weka namba ya simu na kiasi!" });
    }

    try {
        // Weka API Key yako halisi hapa au kupitia Environment Variable
        const HARAKAPAY_API_KEY = process.env.HARAKAPAY_API_KEY || 'hpk_your_api_key_here';
        
        const response = await axios.post('https://harakapay.net/api/v1/collect', {
            phone_number: phone,
            amount: Number(amount),
            description: 'Support Website Payment',
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
        res.status(500).json({ success: false, error: "Imeshindikana kuunganisha na HarakaPay." });
    }
});

// 5. Webhook ya HarakaPay kupokea majibu ya malipo
app.post('/api/payments/webhook', (req, res) => {
    const paymentData = req.body;
    console.log("💰 Malipo yamepokelewa kutoka HarakaPay:", paymentData);
    
    // Hapa unaweza kuongeza mantiki ya kusasisha hali ya oda kwenye database yako kama ipo
    
    res.status(200).json({ received: true });
});

// Routes za kufungua kurasa za HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Kuanzisha Seva
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server inaendesha kwenye port ${PORT}`);
});

