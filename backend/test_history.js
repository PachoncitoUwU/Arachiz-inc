require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testHistory() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest", systemInstruction: "Eres un asistente." });
    
    // Simulate first request
    const chat = model.startChat({
      history: [],
    });
    console.log("Sending MSG1...");
    const result1 = await chat.sendMessage("Hola");
    console.log("Resp1:", result1.response.text());

    // Simulate second request (frontend state)
    // History sent from frontend would be:
    const historyFromFrontend = [
      { role: 'user', content: 'Hola' },
      { role: 'model', content: result1.response.text() }
    ];

    let formattedHistory = historyFromFrontend.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }));

    const chat2 = model.startChat({
      history: formattedHistory,
    });
    console.log("Sending MSG2...");
    const result2 = await chat2.sendMessage("Como estas?");
    console.log("Resp2:", result2.response.text());

  } catch (err) {
    console.error("Error:", err);
  }
}
testHistory();
