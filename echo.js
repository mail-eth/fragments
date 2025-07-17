// echo.js - Advanced Emotional Echo System for Fragments
// Implements soul memory, whisper wall, time-based prompts, and vault retention

class EmotionalEcho {
    constructor() {
        this.soulMemory = this.initializeSoulMemory();
        this.vault = this.initializeVault();
        this.whisperWall = this.initializeWhisperWall();
        this.timeTriggers = this.setupTimeTriggers();
        this.emotionalPatterns = this.loadEmotionalPatterns();
        this.init();
    }

    // ====== INITIALIZATION ======
    init() {
        this.loadVault();
        this.loadSoulMemory();
        this.incrementVisit();
        this.checkSoulEvolution();
        this.setupTimeBasedTriggers();
        return this.initializeComplete();
    }

    // ====== SOUL MEMORY SYSTEM ======
    initializeSoulMemory() {
        return {
            currentLevel: 'discovering', // discovering, aware, connected, awakened
            totalVisits: 0,
            emotionalResonance: 0,
            lastVisit: null,
            consecutiveDays: 0,
            preferredEmotions: [],
            soulFragments: [], // Deep personal memories
            isDeepMode: false,
            awakening: {
                progress: 0,
                threshold: 100,
                triggers: []
            },
            memory: {
                quotes: [],
                whispers: [],
                patterns: {},
                connections: []
            }
        };
    }

    loadSoulMemory() {
        const saved = localStorage.getItem('fragments_soul_memory');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.soulMemory = { ...this.soulMemory, ...parsed };
            } catch (e) {
                console.warn('Soul memory corrupted, regenerating...');
            }
        }
        this.saveSoulMemory();
    }

    saveSoulMemory() {
        localStorage.setItem('fragments_soul_memory', JSON.stringify(this.soulMemory));
    }

    incrementVisit() {
        const today = new Date().toDateString();
        const lastVisit = this.soulMemory.lastVisit;
        
        this.soulMemory.totalVisits++;
        this.soulMemory.lastVisit = today;
        
        // Check consecutive days
        if (lastVisit) {
            const lastDate = new Date(lastVisit);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                this.soulMemory.consecutiveDays++;
            } else if (diffDays > 1) {
                this.soulMemory.consecutiveDays = 1;
            }
        } else {
            this.soulMemory.consecutiveDays = 1;
        }
        
        this.vault.totalVisits = this.soulMemory.totalVisits;
        this.saveSoulMemory();
        this.saveToVault();
    }

    checkSoulEvolution() {
        const { totalVisits, consecutiveDays, emotionalResonance } = this.soulMemory;
        let newLevel = this.soulMemory.currentLevel;
        let shouldEvolve = false;

        // Evolution criteria
        if (totalVisits >= 50 && emotionalResonance >= 80) {
            newLevel = 'awakened';
            shouldEvolve = true;
        } else if (totalVisits >= 20 && consecutiveDays >= 7) {
            newLevel = 'connected';
            shouldEvolve = true;
        } else if (totalVisits >= 7 && emotionalResonance >= 30) {
            newLevel = 'aware';
            shouldEvolve = true;
        }

        // Deep mode activation
        if (totalVisits >= 10 && consecutiveDays >= 3) {
            this.soulMemory.isDeepMode = true;
        }

        if (shouldEvolve && newLevel !== this.soulMemory.currentLevel) {
            this.triggerSoulEvolution(this.soulMemory.currentLevel, newLevel);
            this.soulMemory.currentLevel = newLevel;
            this.saveSoulMemory();
        }
    }

    async triggerSoulEvolution(oldLevel, newLevel) {
        const evolutionMessages = {
            'aware': {
                title: '🌱 Soul Awakening',
                message: 'Your soul is becoming more aware. The fragments of your journey are forming patterns...',
                ability: 'Time-based prompts unlocked'
            },
            'connected': {
                title: '💫 Soul Connection',
                message: 'You are deeply connected to the collective consciousness. Your whispers echo through time...',
                ability: 'Whisper Wall access granted'
            },
            'awakened': {
                title: '✨ Soul Awakening Complete',
                message: 'You have achieved soul enlightenment. Your fragments are now eternal echoes...',
                ability: 'Master of the Emotional Echo'
            }
        };

        const evolution = evolutionMessages[newLevel];
        if (evolution && typeof Swal !== 'undefined') {
            await Swal.fire({
                title: evolution.title,
                html: `
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🦋</div>
                        <div style="font-size: 1.2rem; line-height: 1.6; margin-bottom: 1.5rem; color: #374151;">
                            ${evolution.message}
                        </div>
                        <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 1rem; border-radius: 1rem; font-weight: 600;">
                            ✨ ${evolution.ability}
                        </div>
                    </div>
                `,
                icon: null,
                confirmButtonText: 'Embrace the Evolution',
                confirmButtonColor: '#8B5CF6',
                allowOutsideClick: false,
                customClass: {
                    popup: 'soul-evolution-modal'
                }
            });
        }
    }

    // ====== VAULT SYSTEM ======
    initializeVault() {
        return {
            totalVisits: 0,
            quotesInteracted: 0,
            storiesShared: 0,
            whispersAdded: 0,
            emotionalMoments: [],
            soulFragments: [],
            timeMarkers: [],
            personalQuotes: []
        };
    }

    loadVault() {
        const saved = localStorage.getItem('fragments_vault');
        if (saved) {
            try {
                this.vault = { ...this.vault, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Vault corrupted, regenerating...');
            }
        }
    }

    saveToVault() {
        localStorage.setItem('fragments_vault', JSON.stringify(this.vault));
    }

    addToVault(type, data) {
        const timestamp = Date.now();
        const entry = {
            id: this.generateId(),
            type,
            data,
            timestamp,
            emotionalWeight: this.calculateEmotionalWeight(data)
        };

        switch (type) {
            case 'quote':
                this.vault.personalQuotes.push(entry);
                this.vault.quotesInteracted++;
                break;
            case 'whisper':
                this.vault.emotionalMoments.push(entry);
                this.vault.whispersAdded++;
                break;
            case 'story':
                this.vault.soulFragments.push(entry);
                this.vault.storiesShared++;
                break;
            case 'moment':
                this.vault.timeMarkers.push(entry);
                break;
        }

        this.saveToVault();
        this.updateEmotionalResonance(entry.emotionalWeight);
    }

    calculateEmotionalWeight(data) {
        // Simple emotional weight calculation
        if (typeof data === 'string') {
            const emotionalWords = [
                'love', 'heart', 'soul', 'dream', 'hope', 'fear', 'joy', 'pain',
                'beautiful', 'broken', 'healing', 'truth', 'freedom', 'peace'
            ];
            const words = data.toLowerCase().split(' ');
            const emotionalCount = words.filter(word => 
                emotionalWords.some(emotion => word.includes(emotion))
            ).length;
            return Math.min(emotionalCount * 10, 50);
        }
        return 10;
    }

    updateEmotionalResonance(weight) {
        this.soulMemory.emotionalResonance += weight;
        this.saveSoulMemory();
    }

    async showVaultExplorer() {
        const vaultData = this.organizeVaultData();
        
        if (typeof Swal !== 'undefined') {
            await Swal.fire({
                title: '🗃️ Soul Vault Explorer',
                html: this.createVaultHTML(vaultData),
                showCancelButton: true,
                showConfirmButton: false,
                cancelButtonText: 'Close Vault',
                width: '80%',
                customClass: {
                    popup: 'vault-explorer-modal'
                },
                didOpen: () => {
                    this.setupVaultInteractions();
                }
            });
        }
    }

    organizeVaultData() {
        return {
            summary: {
                totalVisits: this.vault.totalVisits,
                quotesInteracted: this.vault.quotesInteracted,
                storiesShared: this.vault.storiesShared,
                whispersAdded: this.vault.whispersAdded,
                soulLevel: this.soulMemory.currentLevel,
                emotionalResonance: this.soulMemory.emotionalResonance
            },
            recentMoments: this.vault.emotionalMoments.slice(-5),
            personalQuotes: this.vault.personalQuotes.slice(-3),
            soulFragments: this.vault.soulFragments.slice(-3)
        };
    }

    createVaultHTML(data) {
        return `
            <div class="vault-content">
                <div class="vault-summary">
                    <h3>Soul Statistics</h3>
                    <div class="soul-stats">
                        <div class="stat-item">
                            <span class="stat-value">${data.summary.totalVisits}</span>
                            <span class="stat-label">Visits</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${data.summary.emotionalResonance}</span>
                            <span class="stat-label">Resonance</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${data.summary.whispersAdded}</span>
                            <span class="stat-label">Whispers</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${data.summary.storiesShared}</span>
                            <span class="stat-label">Stories</span>
                        </div>
                    </div>
                </div>
                
                <div class="vault-sections">
                    <div class="vault-section">
                        <h4>💫 Recent Emotional Moments</h4>
                        <div class="vault-items">
                            ${data.recentMoments.map(moment => `
                                <div class="vault-item" data-type="moment" data-id="${moment.id}">
                                    <div class="vault-item-content">${this.truncateText(moment.data, 50)}</div>
                                    <div class="vault-item-meta">${this.getTimeAgo(moment.timestamp)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="vault-section">
                        <h4>✨ Personal Quotes</h4>
                        <div class="vault-items">
                            ${data.personalQuotes.map(quote => `
                                <div class="vault-item" data-type="quote" data-id="${quote.id}">
                                    <div class="vault-item-content">"${this.truncateText(quote.data.quote || quote.data, 60)}"</div>
                                    <div class="vault-item-meta">${this.getTimeAgo(quote.timestamp)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupVaultInteractions() {
        document.querySelectorAll('.vault-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                this.showVaultItemDetail(type, id);
            });
        });
    }

    // ====== WHISPER WALL SYSTEM ======
    initializeWhisperWall() {
        return {
            whispers: this.loadWhispers(),
            categories: [
                'confession', 'hope', 'grief', 'joy', 'regret', 
                'gratitude', 'longing', 'peace', 'fear', 'love'
            ]
        };
    }

    loadWhispers() {
        const saved = localStorage.getItem('fragments_whispers');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Whispers corrupted, regenerating...');
            }
        }
        return this.generateSeedWhispers();
    }

    saveWhispers() {
        localStorage.setItem('fragments_whispers', JSON.stringify(this.whisperWall.whispers));
    }

    generateSeedWhispers() {
        return [
            {
                id: this.generateId(),
                content: "Sometimes I wonder if anyone else feels this lost in their own life...",
                mood: "confession",
                timestamp: Date.now() - 86400000,
                echoes: 12,
                anonymous: true
            },
            {
                id: this.generateId(),
                content: "I found a letter I wrote to myself years ago. I'm proud of how far I've come.",
                mood: "hope",
                timestamp: Date.now() - 172800000,
                echoes: 8,
                anonymous: true
            },
            {
                id: this.generateId(),
                content: "The sunset tonight reminded me that endings can be beautiful too.",
                mood: "peace",
                timestamp: Date.now() - 259200000,
                echoes: 15,
                anonymous: true
            }
        ];
    }

    async showWhisperWallPrompt() {
        if (!this.soulMemory.isDeepMode) {
            await Swal.fire({
                title: '🔒 Deep Mode Required',
                text: 'The Whisper Wall is accessible only to souls in deep mode. Continue your journey...',
                icon: 'info',
                confirmButtonColor: '#8B5CF6'
            });
            return;
        }

        // Use modern SweetAlert2 input validation
        const { value: whisperData, isConfirmed } = await Swal.fire({
            title: '💫 Add Your Whisper',
            html: `
                <div class="whisper-form">
                    <textarea id="swal-whisper-content" 
                        placeholder="Share what's in your heart... Your whisper will echo anonymously through time..."
                        maxlength="300" 
                        style="width: 100%; height: 120px; padding: 1rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; resize: vertical; font-family: inherit;">
                    </textarea>
                    <div style="margin: 1rem 0;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Emotional Tone:</label>
                        <select id="swal-whisper-mood" style="width: 100%; padding: 0.5rem; border: 1px solid #D1D5DB; border-radius: 0.5rem;">
                            <option value="confession">Confession 🤫</option>
                            <option value="hope">Hope ✨</option>
                            <option value="grief">Grief 💔</option>
                            <option value="joy">Joy 😊</option>
                            <option value="regret">Regret 😔</option>
                            <option value="gratitude">Gratitude 🙏</option>
                            <option value="longing">Longing 💭</option>
                            <option value="peace">Peace 🕊️</option>
                            <option value="fear">Fear 😰</option>
                            <option value="love">Love 💕</option>
                        </select>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Send Whisper',
            confirmButtonColor: '#8B5CF6',
            focusConfirm: false,
            preConfirm: () => {
                const content = document.getElementById('swal-whisper-content').value.trim();
                const mood = document.getElementById('swal-whisper-mood').value;
                
                if (!content) {
                    Swal.showValidationMessage('Please write something to whisper...');
                    return false;
                }
                
                return { content, mood };
            }
        });

        if (isConfirmed && whisperData) {
            this.addWhisper(whisperData.content, whisperData.mood);
        }
    }

    addWhisper(content, mood) {
        const whisper = {
            id: this.generateId(),
            content: content,
            mood: mood,
            timestamp: Date.now(),
            echoes: 0,
            anonymous: true
        };

        this.whisperWall.whispers.unshift(whisper);
        this.saveWhispers();
        this.addToVault('whisper', content);
        
        // Show confirmation
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '💫 Whisper Sent',
                text: 'Your whisper has been added to the eternal echo...',
                icon: 'success',
                confirmButtonColor: '#8B5CF6',
                timer: 2000
            });
        }
    }

    renderWhisperWall(filterMood = 'all') {
        const container = document.getElementById('whisper-wall-container');
        if (!container) return;

        let whispersToShow = this.whisperWall.whispers;
        if (filterMood !== 'all') {
            whispersToShow = whispersToShow.filter(w => w.mood === filterMood);
        }

        if (whispersToShow.length === 0) {
            container.innerHTML = `
                <div class="empty-whispers">
                    <div class="empty-icon">💫</div>
                    <h3>No whispers yet</h3>
                    <p>Be the first to share your soul's whisper...</p>
                </div>
            `;
            return;
        }

        container.innerHTML = whispersToShow.map(whisper => this.createWhisperCard(whisper)).join('');
        this.attachWhisperEventListeners();
    }

    createWhisperCard(whisper) {
        const moodEmojis = {
            confession: '🤫', hope: '✨', grief: '💔', joy: '😊', regret: '😔',
            gratitude: '🙏', longing: '💭', peace: '🕊️', fear: '😰', love: '💕'
        };

        return `
            <div class="whisper-card" data-id="${whisper.id}" data-mood="${whisper.mood}">
                <div class="whisper-content">
                    "${whisper.content}"
                </div>
                <div class="whisper-meta">
                    <span class="whisper-mood">${moodEmojis[whisper.mood]} ${whisper.mood}</span>
                    <span class="whisper-time">${this.getTimeAgo(whisper.timestamp)}</span>
                    <button class="whisper-echo-btn" onclick="fragmentsApp.emotionalEcho.echoWhisper('${whisper.id}')">
                        💜 ${whisper.echoes} echoes
                    </button>
                </div>
            </div>
        `;
    }

    attachWhisperEventListeners() {
        document.querySelectorAll('.whisper-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.whisper-echo-btn')) {
                    const whisperId = card.dataset.id;
                    this.showWhisperDetail(whisperId);
                }
            });
        });
    }

    echoWhisper(whisperId) {
        const whisper = this.whisperWall.whispers.find(w => w.id === whisperId);
        if (whisper) {
            whisper.echoes++;
            this.saveWhispers();
            this.renderWhisperWall();
            
            // Update emotional resonance
            this.updateEmotionalResonance(5);
        }
    }

    showWhisperDetail(whisperId) {
        const whisper = this.whisperWall.whispers.find(w => w.id === whisperId);
        if (!whisper) return;

        const moodEmojis = {
            confession: '🤫', hope: '✨', grief: '💔', joy: '😊', regret: '😔',
            gratitude: '🙏', longing: '💭', peace: '🕊️', fear: '😰', love: '💕'
        };

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: `${moodEmojis[whisper.mood]} ${whisper.mood.charAt(0).toUpperCase() + whisper.mood.slice(1)} Whisper`,
                html: `
                    <div style="text-align: left; padding: 1rem;">
                        <div style="font-style: italic; font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.5rem; color: #374151;">
                            "${whisper.content}"
                        </div>
                        <div style="text-align: center; color: #6B7280; font-size: 0.9rem;">
                            <div>Whispered ${this.getTimeAgo(whisper.timestamp)}</div>
                            <div>💜 ${whisper.echoes} souls have echoed this whisper</div>
                        </div>
                        <div style="margin-top: 1.5rem; text-align: center;">
                            <button onclick="fragmentsApp.emotionalEcho.echoWhisper('${whisper.id}')" 
                                style="background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500;">
                                💜 Echo This Whisper
                            </button>
                        </div>
                    </div>
                `,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: 'Close',
                customClass: {
                    popup: 'whisper-detail-modal'
                }
            });
        }
    }

    // ====== TIME-BASED PROMPTS ======
    setupTimeTriggers() {
        return {
            dawn: { hour: 5, message: "The dawn whispers: What dreams did you release last night?" },
            morning: { hour: 8, message: "Morning light asks: What intention will guide you today?" },
            noon: { hour: 12, message: "The sun at its peak wonders: How are you honoring your truth?" },
            evening: { hour: 18, message: "Evening shadows invite: What did you learn about yourself today?" },
            night: { hour: 22, message: "Night's embrace asks: What are you grateful for in this moment?" },
            deepNight: { hour: 2, message: "In the depths of night: What truth emerges when the world sleeps?" }
        };
    }

    setupTimeBasedTriggers() {
        // Check every minute for time-based prompts
        setInterval(() => {
            this.checkTimeBasedPrompts();
        }, 60000);

        // Initial check
        setTimeout(() => this.checkTimeBasedPrompts(), 5000);
    }

    checkTimeBasedPrompts() {
        if (!this.soulMemory.isDeepMode) return;

        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();

        // Only trigger on the exact hour
        if (minute !== 0) return;

        const triggerKey = this.getTimeTriggerKey(hour);
        if (!triggerKey) return;

        // Check if already triggered today
        const today = now.toDateString();
        const lastTriggered = localStorage.getItem(`lastTimeTrigger_${triggerKey}`);

        if (lastTriggered === today) return;

        // Trigger the prompt
        this.showTimeBasedPrompt(triggerKey, this.timeTriggers[triggerKey]);
        localStorage.setItem(`lastTimeTrigger_${triggerKey}`, today);
    }

    getTimeTriggerKey(hour) {
        if (hour === 5) return 'dawn';
        if (hour === 8) return 'morning';
        if (hour === 12) return 'noon';
        if (hour === 18) return 'evening';
        if (hour === 22) return 'night';
        if (hour === 2) return 'deepNight';
        return null;
    }

    async showTimeBasedPrompt(triggerKey, trigger) {
        const icons = {
            dawn: '🌅',
            morning: '☀️',
            noon: '🌞',
            evening: '🌇',
            night: '🌙',
            deepNight: '🌌'
        };

        if (typeof Swal !== 'undefined') {
            const { value: response, isConfirmed } = await Swal.fire({
                title: `${icons[triggerKey]} Time Echo`,
                text: trigger.message,
                input: 'textarea',
                inputPlaceholder: 'Let your soul respond...',
                showCancelButton: true,
                confirmButtonText: 'Capture This Moment',
                confirmButtonColor: '#8B5CF6',
                customClass: {
                    popup: 'time-prompt-modal'
                },
                inputValidator: (value) => {
                    if (!value || !value.trim()) {
                        return 'Please write something to capture this moment...';
                    }
                }
            });

            if (isConfirmed && response && response.trim()) {
                this.addToVault('moment', {
                    trigger: triggerKey,
                    prompt: trigger.message,
                    response: response,
                    hour: new Date().getHours()
                });

                await Swal.fire({
                    title: '✨ Moment Captured',
                    text: 'Your soul\'s response has been preserved in the vault of time...',
                    icon: 'success',
                    confirmButtonColor: '#8B5CF6',
                    timer: 2000,
                    timerProgressBar: true
                });
            }
        }
    }

    // ====== EMOTIONAL ORCHESTRATION ======
    async orchestrateEmotionalJourney(baseQuote) {
        // Check for special time-based quotes
        const timeQuote = this.getTimeBasedQuote();
        if (timeQuote) return timeQuote;

        // Check for soul memory quotes
        const memoryQuote = this.getSoulMemoryQuote();
        if (memoryQuote) return memoryQuote;

        // Check for return visitor quotes
        if (this.soulMemory.totalVisits > 1) {
            const returnQuote = this.getReturnVisitorQuote();
            if (returnQuote) return returnQuote;
        }

        return baseQuote;
    }

    getTimeBasedQuote() {
        const hour = new Date().getHours();
        const timeQuotes = {
            early: [
                { quote: "In the quiet before dawn, your truest self awakens.", author: "Inner Voice" },
                { quote: "Night's last whispers carry tomorrow's promises.", author: "Dawn Keeper" }
            ],
            sunrise: [
                { quote: "Every sunrise is your soul's invitation to begin again.", author: "Dawn Keeper" },
                { quote: "Light returns because darkness taught it how to shine.", author: "Morning Sage" }
            ],
            deep: [
                { quote: "When the world sleeps, your soul speaks its deepest truths.", author: "Night Oracle" },
                { quote: "In darkness, we find the light we didn't know we carried.", author: "Shadow Walker" }
            ]
        };

        if (hour >= 1 && hour <= 4) {
            return this.getRandomFromArray(timeQuotes.deep);
        } else if (hour >= 4 && hour <= 6) {
            return this.getRandomFromArray(timeQuotes.sunrise);
        } else if (hour >= 5 && hour <= 7) {
            return this.getRandomFromArray(timeQuotes.early);
        }

        return null;
    }

    getSoulMemoryQuote() {
        if (!this.soulMemory.isDeepMode) return null;

        const soulQuotes = {
            discovering: [
                { quote: "Your journey of discovery has only just begun.", author: "Soul Guide" },
                { quote: "Every fragment you share adds to the beautiful mosaic of your being.", author: "Inner Voice" }
            ],
            aware: [
                { quote: "Awareness is the first step toward emotional mastery.", author: "Soul Mentor" },
                { quote: "Your growing consciousness illuminates paths for others.", author: "Echo Keeper" }
            ],
            connected: [
                { quote: "In connection, we find the threads that weave all souls together.", author: "Unity Voice" },
                { quote: "Your resonance creates ripples across the collective consciousness.", author: "Connection Oracle" }
            ],
            awakened: [
                { quote: "Awakened souls become beacons for those still finding their way.", author: "Enlightened One" },
                { quote: "Your mastery of emotion transforms the world around you.", author: "Ascended Guide" }
            ]
        };

        const levelQuotes = soulQuotes[this.soulMemory.currentLevel];
        return levelQuotes ? this.getRandomFromArray(levelQuotes) : null;
    }

    getReturnVisitorQuote() {
        const returnQuotes = [
            { quote: "Welcome back, familiar soul. Your return enriches this space.", author: "Return Whisperer" },
            { quote: "Each return deepens your connection to this sacred space.", author: "Guardian Echo" },
            { quote: "Your consistency in showing up creates powerful momentum.", author: "Persistence Spirit" }
        ];

        return this.getRandomFromArray(returnQuotes);
    }

    // ====== EMOTIONAL PATTERNS ======
    loadEmotionalPatterns() {
        return {
            resonanceWords: ['soul', 'heart', 'spirit', 'love', 'hope', 'dream', 'peace', 'truth'],
            deepWords: ['shadow', 'darkness', 'depth', 'profound', 'mystery', 'ancient', 'eternal'],
            connectionWords: ['together', 'unity', 'bond', 'shared', 'collective', 'community']
        };
    }

    // ====== ENHANCED EMOTIONAL ANALYTICS ======
    getEmotionalInsights() {
        const insights = {
            dominantMoods: this.analyzeDominantMoods(),
            emotionalGrowth: this.calculateEmotionalGrowth(),
            resonancePattern: this.getResonancePattern(),
            soulJourneyStage: this.getSoulJourneyStage()
        };
        return insights;
    }

    analyzeDominantMoods() {
        const moodCounts = {};
        this.whisperWall.whispers.forEach(whisper => {
            moodCounts[whisper.mood] = (moodCounts[whisper.mood] || 0) + 1;
        });
        
        return Object.entries(moodCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([mood, count]) => ({ mood, count }));
    }

    calculateEmotionalGrowth() {
        const totalInteractions = this.vault.quotesInteracted + 
                                this.vault.whispersAdded + 
                                this.vault.storiesShared;
        
        const growthRate = Math.min(totalInteractions / 10, 1) * 100;
        return Math.round(growthRate);
    }

    getResonancePattern() {
        const recent = this.vault.emotionalMoments.slice(-10);
        if (recent.length < 3) return 'emerging';
        
        const avgWeight = recent.reduce((sum, moment) => sum + (moment.emotionalWeight || 0), 0) / recent.length;
        
        if (avgWeight > 30) return 'intense';
        if (avgWeight > 15) return 'moderate';
        return 'gentle';
    }

    getSoulJourneyStage() {
        const { currentLevel, totalVisits, consecutiveDays, isDeepMode } = this.soulMemory;
        
        return {
            level: currentLevel,
            visits: totalVisits,
            streak: consecutiveDays,
            deepMode: isDeepMode,
            nextMilestone: this.getNextMilestone()
        };
    }

    getNextMilestone() {
        const { currentLevel, totalVisits, consecutiveDays, emotionalResonance } = this.soulMemory;
        
        switch (currentLevel) {
            case 'discovering':
                if (totalVisits < 7) return `${7 - totalVisits} more visits to become Aware`;
                return `${30 - emotionalResonance} more resonance to become Aware`;
            case 'aware':
                if (totalVisits < 20) return `${20 - totalVisits} more visits to become Connected`;
                return `${7 - consecutiveDays} more consecutive days to become Connected`;
            case 'connected':
                if (totalVisits < 50) return `${50 - totalVisits} more visits to become Awakened`;
                return `${80 - emotionalResonance} more resonance to become Awakened`;
            case 'awakened':
                return 'You have achieved soul mastery';
            default:
                return 'Continue your journey';
        }
    }

    // ====== VAULT ITEM DETAILS ======
    showVaultItemDetail(type, id) {
        let item;
        switch (type) {
            case 'moment':
                item = this.vault.timeMarkers.find(m => m.id === id) || 
                       this.vault.emotionalMoments.find(m => m.id === id);
                break;
            case 'quote':
                item = this.vault.personalQuotes.find(q => q.id === id);
                break;
            case 'whisper':
                item = this.vault.emotionalMoments.find(w => w.id === id);
                break;
        }

        if (!item) return;

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: `${this.getVaultItemIcon(type)} Vault Memory`,
                html: `
                    <div style="text-align: left; padding: 1rem;">
                        <div style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.5rem; color: #374151;">
                            ${this.formatVaultItemContent(item)}
                        </div>
                        <div style="text-align: center; color: #6B7280; font-size: 0.9rem;">
                            <div>Captured ${this.getTimeAgo(item.timestamp)}</div>
                            <div>Emotional Weight: ${item.emotionalWeight || 0}</div>
                        </div>
                    </div>
                `,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: 'Close Memory',
                customClass: {
                    popup: 'vault-detail-modal'
                }
            });
        }
    }

    getVaultItemIcon(type) {
        const icons = {
            moment: '⏰',
            quote: '✨',
            whisper: '💫',
            story: '📖'
        };
        return icons[type] || '🔮';
    }

    formatVaultItemContent(item) {
        if (typeof item.data === 'object') {
            if (item.data.response) {
                return `
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #F3F4F6; border-radius: 0.5rem;">
                        <strong>Prompt:</strong> ${item.data.prompt}
                    </div>
                    <div><strong>Your Response:</strong> "${item.data.response}"</div>
                `;
            } else if (item.data.quote) {
                return `"${item.data.quote}" - ${item.data.author || 'Unknown'}`;
            }
            return JSON.stringify(item.data, null, 2);
        }
        return `"${item.data}"`;
    }

    // ====== PERSISTENCE & CLEANUP ======
    performVaultMaintenance() {
        // Remove old emotional moments (keep last 100)
        if (this.vault.emotionalMoments.length > 100) {
            this.vault.emotionalMoments = this.vault.emotionalMoments.slice(-100);
        }

        // Remove old time markers (keep last 50)
        if (this.vault.timeMarkers.length > 50) {
            this.vault.timeMarkers = this.vault.timeMarkers.slice(-50);
        }

        // Clean up old whispers (keep last 500)
        if (this.whisperWall.whispers.length > 500) {
            this.whisperWall.whispers = this.whisperWall.whispers.slice(0, 500);
            this.saveWhispers();
        }

        this.saveToVault();
        console.log('🧹 Vault maintenance completed');
    }

    // ====== EXPORT/IMPORT SOUL DATA ======
    exportSoulData() {
        const soulData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            soulMemory: this.soulMemory,
            vault: this.vault,
            whispers: this.whisperWall.whispers,
            insights: this.getEmotionalInsights()
        };

        const dataStr = JSON.stringify(soulData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `soul-fragments-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '🔮 Soul Data Exported',
                text: 'Your emotional journey has been preserved for eternity.',
                icon: 'success',
                confirmButtonColor: '#8B5CF6'
            });
        }
    }

    async importSoulData(file) {
        try {
            const text = await file.text();
            const soulData = JSON.parse(text);
            
            if (soulData.version && soulData.soulMemory) {
                // Merge imported data with existing data
                this.soulMemory = { ...this.soulMemory, ...soulData.soulMemory };
                this.vault = { ...this.vault, ...soulData.vault };
                
                if (soulData.whispers) {
                    // Merge whispers, avoiding duplicates
                    const existingIds = new Set(this.whisperWall.whispers.map(w => w.id));
                    const newWhispers = soulData.whispers.filter(w => !existingIds.has(w.id));
                    this.whisperWall.whispers = [...this.whisperWall.whispers, ...newWhispers];
                }
                
                this.saveSoulMemory();
                this.saveToVault();
                this.saveWhispers();
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: '✨ Soul Data Imported',
                        text: 'Your emotional journey has been restored and integrated.',
                        icon: 'success',
                        confirmButtonColor: '#8B5CF6'
                    });
                }
            } else {
                throw new Error('Invalid soul data format');
            }
        } catch (error) {
            console.error('Import failed:', error);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '❌ Import Failed',
                    text: 'The soul data file appears to be corrupted or invalid.',
                    icon: 'error',
                    confirmButtonColor: '#EF4444'
                });
            }
        }
    }

    // ====== PERIODIC MAINTENANCE ======
    startPeriodicMaintenance() {
        // Run maintenance every hour
        setInterval(() => {
            this.performVaultMaintenance();
        }, 3600000);

        // Run immediate maintenance after 30 seconds
        setTimeout(() => {
            this.performVaultMaintenance();
        }, 30000);
    }

    // ====== UTILITY FUNCTIONS ======
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    getRandomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) {
            return `${days}d ago`;
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'just now';
        }
    }

    truncateText(text, maxLength) {
        if (typeof text !== 'string') {
            text = JSON.stringify(text);
        }
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // ====== INITIALIZATION COMPLETION ======
    initializeComplete() {
        this.startPeriodicMaintenance();
        console.log('🌟 Emotional Echo System fully initialized');
        console.log(`📊 Current Stats: Level ${this.soulMemory.currentLevel}, ${this.vault.totalVisits} visits, ${this.soulMemory.emotionalResonance} resonance`);
        
        // Log system status
        const status = {
            soulLevel: this.soulMemory.currentLevel,
            isDeepMode: this.soulMemory.isDeepMode,
            totalVisits: this.vault.totalVisits,
            whisperCount: this.whisperWall.whispers.length,
            vaultSize: Object.keys(this.vault).reduce((total, key) => {
                return total + (Array.isArray(this.vault[key]) ? this.vault[key].length : 0);
            }, 0)
        };
        
        console.table(status);
        return this;
    }

    // ====== PUBLIC API METHODS ======
    // These methods are exposed for external use
    getSystemStatus() {
        return {
            initialized: true,
            soulLevel: this.soulMemory.currentLevel,
            isDeepMode: this.soulMemory.isDeepMode,
            totalVisits: this.vault.totalVisits,
            emotionalResonance: this.soulMemory.emotionalResonance,
            whisperCount: this.whisperWall.whispers.length
        };
    }

    // Method to manually trigger evolution (for testing)
    forceEvolution(level) {
        if (['discovering', 'aware', 'connected', 'awakened'].includes(level)) {
            const oldLevel = this.soulMemory.currentLevel;
            this.triggerSoulEvolution(oldLevel, level);
            this.soulMemory.currentLevel = level;
            this.saveSoulMemory();
            return true;
        }
        return false;
    }

    // Method to manually enable deep mode (for testing)
    enableDeepMode() {
        this.soulMemory.isDeepMode = true;
        this.saveSoulMemory();
        console.log('🌌 Deep Mode manually enabled');
        return true;
    }

    // Method to clear all soul data (for reset)
    clearAllData() {
        localStorage.removeItem('fragments_soul_memory');
        localStorage.removeItem('fragments_vault');
        localStorage.removeItem('fragments_whispers');
        console.log('🗑️ All soul data cleared');
        return true;
    }
}

// Make EmotionalEcho available globally for debugging in development
if (typeof window !== 'undefined') {
    window.EmotionalEcho = EmotionalEcho;
}

export default EmotionalEcho;