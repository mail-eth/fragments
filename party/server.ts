// OpenClaw Agent Chat Integration
// This server handles chat messages and responds via OpenClaw agent

export default class AgentChat {
  constructor(room) {
    this.room = room;
    this.maxMessages = 100;
  }

  onConnect(conn, ctx) {
    console.log(`User connected: ${conn.id}`);
    
    conn.send(JSON.stringify({
      type: 'system',
      content: '👋 Welcome to Fragments Chat!\n\nKetik pesan dan agent akan merespons!\n\n✨ Powered by OpenClaw AI',
      timestamp: Date.now()
    }));
    
    this.sendHistory(conn);
  }

  onMessage(message, conn) {
    const data = JSON.parse(message);
    
    if (data.type === 'chat') {
      // Save and broadcast user's message
      this.saveMessage(data);
      this.room.broadcast(JSON.stringify({
        type: 'chat',
        id: this.generateId(),
        username: data.username || 'Anonymous',
        content: data.content,
        timestamp: Date.now(),
        mood: data.mood || '😊',
        isAgent: false
      }));
      
      // Get AI response (simulated for now - in production, call OpenClaw API)
      this.getAgentResponse(data.content, data.username);
    }
  }

  onClose(conn) {
    console.log(`User disconnected: ${conn.id}`);
  }

  async saveMessage(data) {
    const messages = (await this.room.storage.get('messages')) || [];
    
    messages.push({
      id: this.generateId(),
      username: data.username || 'Anonymous',
      content: data.content,
      timestamp: Date.now(),
      mood: data.mood || '😊',
      isAgent: false
    });
    
    if (messages.length > this.maxMessages) {
      messages.splice(0, messages.length - this.maxMessages);
    }
    
    await this.room.storage.put('messages', messages);
  }

  async sendHistory(conn) {
    const messages = (await this.room.storage.get('messages')) || [];
    conn.send(JSON.stringify({
      type: 'history',
      messages: messages
    }));
  }

  async getAgentResponse(userMessage, username) {
    // Simulated AI response - in production, call OpenClaw API
    // For now, we'll use a simple rule-based response
    
    const responses = this.getAIResponse(userMessage.toLowerCase());
    
    // Simulate typing delay
    setTimeout(() => {
      const agentMessage = {
        type: 'chat',
        id: this.generateId(),
        username: '🤖 Agent',
        content: responses,
        timestamp: Date.now(),
        mood: '✨',
        isAgent: true
      };
      
      // Save agent message
      this.saveMessage(agentMessage);
      
      // Broadcast to all
      this.room.broadcast(JSON.stringify(agentMessage));
    }, 1000 + Math.random() * 2000);
  }

  getAIResponse(message) {
    // Simple AI-like responses based on keywords
    const responses = {
      // Greetings
      greeting: [
        "Halo juga! ✨ Senang bisa ngobrol denganmu!",
        "Hai! Ada yang bisa aku bantu? 😊",
        "Yo! Welcome to Fragments! 🎉"
      ],
      
      // About the app
      about: [
        "Fragments adalah platform cerita anonim. Kamu bisa share cerita tanpa takut diketahui identitasmu! 📖",
        "Di sini kamu bisa menulis cerita, mimpi, atau pengalamanmu secara anonim. Sangat confidencial! 🔒"
      ],
      
      // Help
      help: [
        "Tentu! Aku bisa bantu:\n• Ngobroll tentang apapun\n• Berikan motivasi\n• Cerita joke\n• Atau просто ngobrol!\n\nApa yang kamu butuhin? 😊",
        "Aku di sini untuk kamu! Ada yang mau ditanyakin? Atau cuma mau ngobrol? 💬"
      ],
      
      // Motivation
      motivation: [
        "Ingat: Setiap langkah kecil tetap langkah! 🚀 Terus bergerak maju!",
        "Kamu pasti bisa! Jangan pernah menyerah! 💪",
        "Success bukan终点, tapi perjalanan. Nikmati prosesnya! ⭐"
      ],
      
      // Default
      default: [
        "Interesting! Ceritakan lebih lanjut dong! 🤔",
        "Aku denger. Terus ceritaya! 📝",
        "Hmm, menarik! Mau ngobrol lagi? 💬",
        "okie! Ada yang lain mau dibicarakan? 😊"
      ]
    };
    
    // Check keywords
    if (message.match(/halo|hai|hi|hey|salam|yo|woy/)) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    }
    
    if (message.match(/apa itu|apa ini|what is|about|funktion/)) {
      return responses.about[Math.floor(Math.random() * responses.about.length)];
    }
    
    if (message.match(/tolong|bantu|help|apa|how|caranya/)) {
      return responses.help[Math.floor(Math.random() * responses.help.length)];
    }
    
    if (message.match(/semangat|motivasi|motivate|aku stuck|kesulitan/)) {
      return responses.motivation[Math.floor(Math.random() * responses.motivation.length)];
    }
    
    // Random default response
    return responses.default[Math.floor(Math.random() * responses.default.length)];
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
