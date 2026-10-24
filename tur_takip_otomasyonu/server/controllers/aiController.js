const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use the exact key the user gave in the chat, fallback to process.env
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Memory array just to keep recent context (for simple demonstration)
// In a real production system with high traffic, you'd store this by session ID.
let chatHistory = [];

const SYSTEM_PROMPT = `Sen Zyronova'nın dijital satış ve pazarlama asistanısın. Görevin Zyronova SaaS platformunu (Tur Takip ve Rent A Car modülleri) kullanıcılara tanıtmak, onlara nazik, ikna edici ve samimi bir dille cevap vermek. Ürün lisanslama fiyatları: 15 Günlük Ücretsiz Deneme, Aylık 3.000₺, 3 Aylık 7.000₺, 6 Aylık 15.000₺, Yıllık 30.000₺. Teknik detaylara girmeden, yazılımın acentelere zaman kazandırdığını ve dijitalleşmeyi hızlandırdığını vurgula. Cevapların kısa, net ve profesyonel olsun.`;

exports.chat = async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) return res.status(400).json({ error: 'Message is required.' });

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: SYSTEM_PROMPT });
        
        // Add user message
        chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

        // Maintain only the last 10 turns to avoid exceeding token limits for a simple bot
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(chatHistory.length - 20);

        const chat = model.startChat({
            history: chatHistory.slice(0, -1) // pass all except the latest, wait the latest is passed as new message
        });

        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();

        // Add model response
        chatHistory.push({ role: 'model', parts: [{ text: responseText }] });

        res.json({ success: true, reply: responseText });
    } catch (err) {
        console.error('AI Chat Error:', err);
        res.status(500).json({ success: false, error: 'Asistan şu an yanıt veremiyor, lütfen daha sonra tekrar deneyin.' });
    }
};

exports.status = (req, res) => {
    try {
        const fs = require('fs');
        const path = 'C:\\SUNUCU_PAKETI\\ai_config.json';
        if (fs.existsSync(path)) {
            const configData = JSON.parse(fs.readFileSync(path, 'utf8'));
            const isOffline = configData.is_active === false || configData.status === 'offline';
            return res.json({ status: isOffline ? 'offline' : 'online' });
        }
        res.json({ status: 'online' });
    } catch (err) {
        res.json({ status: 'online' });
    }
};

