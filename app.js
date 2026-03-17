// ===== Application State =====
class FragmentsApp {
    constructor() {
        this.currentTab = 'stories';
        this.selectedCategory = null;
        this.selectedMood = '😊';
        this.username = this.generateUsername();
        this.stories = [];
        
        // Chat
        this.channel = null;
        
        // Initialize
        this.init();
    }

    // ===== Initialize =====
    init() {
        this.setupNavigation();
        this.setupCategoryButtons();
        this.setupMoodButtons();
        this.setupChatInput();
        this.loadStories();
        this.connectChat();
        
        console.log('🚀 Fragments App Started');
    }

    // ===== Generate Random Username =====
    generateUsername() {
        const adjectives = ['Bintang', 'Mimpi', 'Harapan', 'Semangat', 'Penyair', 'Wanderer', 'Dreamer', 'Star'];
        const nouns = ['Jiwa', 'Hati', 'Fikiran', 'Soul', 'Heart', 'Mind', 'Spirit', 'Light'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 1000);
        return `${adj}${noun}${num}`;
    }

    // ===== Navigation =====
    setupNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        this.currentTab = tabName;
    }

    // ===== Category Buttons =====
    setupCategoryButtons() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedCategory = btn.dataset.category;
            });
        });
    }

    // ===== Mood Selector =====
    setupMoodButtons() {
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedMood = btn.dataset.mood;
            });
        });
    }

    // ===== Chat Input =====
    setupChatInput() {
        const input = document.getElementById('chat-input');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChat();
            }
        });
    }

    // ===== Stories =====
    loadStories() {
        const saved = localStorage.getItem('fragments-stories');
        if (saved) {
            this.stories = JSON.parse(saved);
        }
        this.renderStories();
    }

    saveStories() {
        localStorage.setItem('fragments-stories', JSON.stringify(this.stories));
    }

    postStory() {
        const content = document.getElementById('story-content').value.trim();
        
        if (!content) {
            this.showAlert('Tulis dulu ceritamu!', 'warning');
            return;
        }

        const story = {
            id: Date.now(),
            content: content,
            category: this.selectedCategory || 'experience',
            username: this.username,
            timestamp: new Date().toISOString()
        };

        this.stories.unshift(story);
        this.saveStories();
        this.renderStories();
        
        document.getElementById('story-content').value = '';
        document.getElementById('char-count').textContent = '0';
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
        this.selectedCategory = null;
        
        this.showAlert('Cerita berhasil dipublikasikan! 📖', 'success');
    }

    renderStories() {
        const container = document.getElementById('stories-container');
        
        if (this.stories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📝</span>
                    <p>Belum ada cerita</p>
                    <small>Jadilah yang pertama!</small>
                </div>
            `;
            return;
        }

        container.innerHTML = this.stories.map(story => `
            <div class="story-card">
                <span class="story-category">${this.getCategoryEmoji(story.category)} ${this.getCategoryName(story.category)}</span>
                <p class="story-content">${this.escapeHtml(story.content)}</p>
                <div class="story-meta">
                    <span>👤 ${story.username}</span>
                    <span>${this.formatTime(story.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    getCategoryEmoji(category) {
        const emojis = { dreams: '🌟', fears: '😨', hope: '💫', experience: '📝' };
        return emojis[category] || '📝';
    }

    getCategoryName(category) {
        const names = { dreams: 'Mimpi', fears: 'Ketakutan', hope: 'Harapan', experience: 'Pengalaman' };
        return names[category] || 'Cerita';
    }

    // ===== Chat with Agent =====
    connectChat() {
        try {
            this.channel = new BroadcastChannel('fragments-chat');
            
            this.channel.onmessage = (event) => {
                const data = event.data;
                if (data.type === 'chat') {
                    this.addChatMessage(data);
                    
                    // Agent responds to user messages
                    if (!data.isAgent && data.username !== this.username) {
                        this.getAgentResponse(data.content);
                    }
                }
            };
            
            console.log('📡 Chat channel connected');
            this.addSystemMessage('💬 Chat aktif! Ketik pesan dan agent akan merespons!');
            this.addSystemMessage('✨ Agent: OpenClaw AI - Siap ngobrol 24/7!');
            
        } catch (error) {
            console.warn('BroadcastChannel not supported');
            this.addSystemMessage('💬 Demo mode');
        }
        
        document.getElementById('online-count').textContent = '1+ online';
    }

    sendChat() {
        const input = document.getElementById('chat-input');
        const content = input.value.trim();
        
        if (!content) return;

        const message = {
            type: 'chat',
            username: this.username,
            content: content,
            mood: this.selectedMood,
            timestamp: Date.now()
        };

        if (this.channel) {
            this.channel.postMessage(message);
        }
        
        this.addChatMessage(message);
        input.value = '';
        
        // Agent responds
        this.getAgentResponse(content);
    }

    // ===== OpenClaw Agent Response =====
    getAgentResponse(userMessage) {
        // Show typing indicator
        this.addTypingIndicator();
        
        // Simulate AI thinking delay
        setTimeout(() => {
            this.removeTypingIndicator();
            
            const response = this.generateAgentResponse(userMessage);
            
            const agentMessage = {
                type: 'chat',
                username: '🤖 Agent',
                content: response,
                mood: '✨',
                timestamp: Date.now(),
                isAgent: true
            };

            if (this.channel) {
                this.channel.postMessage(agentMessage);
            }
            
            this.addChatMessage(agentMessage);
        }, 1500 + Math.random() * 1500);
    }

    // ===== Agent AI Logic =====
    generateAgentResponse(message) {
        const msg = message.toLowerCase();
        
        const responses = {
            greeting: [
                "Halo juga! ✨ Senang bisa ngobrol denganmu!",
                "Hai! Welcome to Fragments! 🎉 Ada yang bisa aku bantu?",
                "Yo! Nice to meet you! 😊"
            ],
            about: [
                "Fragments adalah platform cerita anonim. Kamu bisa share cerita tanpa takut identitasmu diketahui! 📖\n\nKamu bisa tulis mimpi, pengalaman, atau apapun dengan aman!",
                "Fragments itu tempat buat kamu yang mau Curhat atau share cerita tanpa takut diketahui orang lain. 100% anonim! 🔒"
            ],
            help: [
                "Tentu! Aku bisa:\n• Ngobrol santai\n• Beri motivasi\n• Denger curhatanmu\n• Atau sekadar jadi teman chat\n\n Mau ngobrol tentang apa? 😊",
                "Aku di sini buat kamu! Mau cerita apa hari ini? Atau ada yang bikin kamu senang/sedih? 💬"
            ],
            motivation: [
                "Ingat: Setiap langkah kecil tetap langkah! 🚀 Terus bergerak maju!",
                "Kamu pasti bisa! Jangan pernah menyerah! 💪\n\nHari ini mungkin sulit, tapi besok akan lebih baik!",
                "Success itu perjalanan, bukan终点. Nikmati prosesnya! ⭐\n\nKamu sudah luar biasa sudah berani share di sini!"
            ],
            comfort: [
                "Aku denger kamu. 💙\n\nSharing your feelings itu berani, bukan lemah. Kamu tidak sendiri!",
                "Sedih itu manusiawi. 💙\n\nTapi ingat, masa lalu tidak menentukan masa depanmu. Kamu bisa bangkit!",
                "Aku di sini buat kamu. 🤗\n\nApapun yang kamu rasakan, valid. Tapi jangan lupa: kamu lebih kuat dari yang kamu pikir!"
            ],
            default: [
                "Interesting! Ceritakan lebih lanjut dong! 🤔",
                "Aku denger. Terus ceritaya! 📝",
                "Hmm, menarik! Mau ngobrol lagi? 💬",
                "okeh! Ada yang lain mau dibicarakan? 😊",
                "Nice! Aku suka energy kamu! ✨"
            ]
        };
        
        // Check keywords
        if (msg.match(/halo|hai|hi|hey|salam|yo|woy|oy/)) {
            return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
        }
        
        if (msg.match(/apa( itu| ini)|what is|about|tentang|funktion/)) {
            return responses.about[Math.floor(Math.random() * responses.about.length)];
        }
        
        if (msg.match(/tolong|bantu|help|apa( yang|bisa)|caranya|gimana/)) {
            return responses.help[Math.floor(Math.random() * responses.help.length)];
        }
        
        if (msg.match(/semangat|motivasi|aku stuck|kesulitan|gagal|down/)) {
            return responses.motivation[Math.floor(Math.random() * responses.motivation.length)];
        }
        
        if (msg.match(/sedih|marah|kecewa|menangis|sakit|banjir|depresi|stress/)) {
            return responses.comfort[Math.floor(Math.random() * responses.comfort.length)];
        }
        
        if (msg.match(/thanks|terima kasih|thank|makasih|okies|oke|sip|good/)) {
            return "Sama-sama! 😊 Senang bisa bantu! Kapan aja mau ngobrol, aku sini! 💬";
        }
        
        if (msg.length < 3) {
            return "Aku denger! Cerita lagi dong! 📝";
        }
        
        return responses.default[Math.floor(Math.random() * responses.default.length)];
    }

    addTypingIndicator() {
        const container = document.getElementById('chat-messages');
        const existing = container.querySelector('.typing-indicator');
        if (existing) return;
        
        const el = document.createElement('div');
        el.className = 'chat-message other typing-indicator';
        el.innerHTML = `
            <div class="chat-username">🤖 Agent</div>
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
    }

    removeTypingIndicator() {
        const existing = document.querySelector('.typing-indicator');
        if (existing) existing.remove();
    }

    addChatMessage(data) {
        const container = document.getElementById('chat-messages');
        const isOwn = data.username === this.username;
        
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isOwn ? 'own' : 'other'} ${data.isAgent ? 'agent' : ''}`;
        messageEl.innerHTML = `
            <div class="chat-username">${data.mood || ''} ${data.username}</div>
            <div class="chat-text">${this.escapeHtml(data.content)}</div>
            <div class="chat-time">${this.formatTime(data.timestamp)}</div>
        `;
        
        container.appendChild(messageEl);
        container.scrollTop = container.scrollHeight;
    }

    addSystemMessage(content) {
        const container = document.getElementById('chat-messages');
        const el = document.createElement('div');
        el.className = 'chat-system';
        el.innerHTML = `<p>${content}</p>`;
        container.appendChild(el);
    }

    // ===== Utilities =====
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showAlert(message, type = 'info') {
        Swal.fire({
            text: message,
            icon: type,
            toast: true,
            position: 'top',
            timer: 3000,
            showConfirmButton: false
        });
    }
}

// ===== Character Counter =====
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('story-content');
    const counter = document.getElementById('char-count');
    
    if (textarea && counter) {
        textarea.addEventListener('input', () => {
            counter.textContent = textarea.value.length;
        });
    }
});

// ===== Initialize App =====
const app = new FragmentsApp();
window.app = app;
