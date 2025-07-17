// ====== FIREBASE IMPORTS & CONFIG ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
    getDatabase, 
    ref, 
    push, 
    onValue, 
    remove, 
    set
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Import Firebase config from external file
import { firebaseConfig } from "./firebase-config.js";

// Import Daily Quotes system
import { getDailyQuote, shouldShowDailyQuote, markQuoteAsShown } from "./quotes.js";

// Import Emotional Echo system - with fallback for direct script inclusion
let EmotionalEcho;
try {
    const echoModule = await import("./echo.js");
    EmotionalEcho = echoModule.default;
} catch (error) {
    console.warn('Echo module import failed, checking global:', error);
    // Fallback to global if import fails
    EmotionalEcho = window.EmotionalEcho;
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// ====== APPLICATION STATE ======
class FragmentsApp {
    constructor() {
        this.currentUser = this.generateAnonymousUser();
        this.currentTab = 'stories';
        this.selectedCategory = null;
        this.selectedMood = null;
        this.stories = [];
        this.chats = [];
        this.pendingDeleteId = null;
        this.emotionalEcho = null; // Will be initialized in init()
        
        this.init();
    }

    // ====== INITIALIZATION ======
    async init() {
        // Initialize Emotional Echo System with proper error handling
        try {
            if (EmotionalEcho) {
                this.emotionalEcho = new EmotionalEcho();
                console.log('✅ Emotional Echo System initialized successfully');
            } else {
                console.warn('⚠️ Emotional Echo System not available - running in basic mode');
                this.emotionalEcho = this.createFallbackEcho();
            }
        } catch (error) {
            console.error('❌ Emotional Echo initialization failed:', error);
            this.emotionalEcho = this.createFallbackEcho();
        }

        this.setupEventListeners();
        this.setupFirebaseListeners();
        this.loadUserData();
        this.initializeAnimations();
        
        // Show soul level indicator
        setTimeout(() => this.showSoulLevelIndicator(), 1000);
        
        // Show daily quote or emotional journey
        setTimeout(() => {
            this.initiateDailyEmotionalJourney();
        }, 2000);
        
        // Setup whisper wall if user is in deep mode
        setTimeout(() => {
            this.setupWhisperWallTab();
        }, 3000);
        
        console.log('🚀 Fragments App Initialized');
        console.log('✨ Emotional Echo System Active');
        console.log(`🧠 Soul Level: ${this.emotionalEcho.soulMemory?.currentLevel || 'unknown'}`);
    }

    // Fallback Echo system for when main system fails
    createFallbackEcho() {
        return {
            soulMemory: {
                currentLevel: 'discovering',
                totalVisits: 1,
                emotionalResonance: 0,
                isDeepMode: false
            },
            vault: {
                totalVisits: 1,
                quotesInteracted: 0,
                storiesShared: 0,
                whispersAdded: 0
            },
            orchestrateEmotionalJourney: (quote) => Promise.resolve(quote),
            addToVault: () => {},
            updateEmotionalResonance: () => {},
            showVaultExplorer: () => this.showFallbackMessage('Vault system unavailable'),
            showWhisperWallPrompt: () => this.showFallbackMessage('Whisper wall unavailable'),
            getEmotionalInsights: () => ({ dominantMoods: [], emotionalGrowth: 0, resonancePattern: 'emerging', soulJourneyStage: {} }),
            exportSoulData: () => this.showFallbackMessage('Export unavailable'),
            saveSoulMemory: () => {},
            saveToVault: () => {},
            saveWhispers: () => {}
        };
    }

    showFallbackMessage(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '⚠️ Feature Unavailable',
                text: message,
                icon: 'warning',
                confirmButtonColor: '#8B5CF6'
            });
        } else {
            alert(message);
        }
    }

    // ====== ENHANCED DAILY QUOTE WITH EMOTIONAL ECHO ======
    async initiateDailyEmotionalJourney() {
        if (!shouldShowDailyQuote()) return;

        // Get base daily quote
        const dailyQuote = getDailyQuote();
        
        // Let emotional echo system orchestrate the full experience
        const finalQuote = await this.emotionalEcho.orchestrateEmotionalJourney(dailyQuote);
        
        // Show the quote (could be original, time-based, or soul memory quote)
        await this.showEnhancedDailyQuote(finalQuote);
        
        markQuoteAsShown();
    }

    async showEnhancedDailyQuote(quote) {
        // Determine quote type for styling
        const hour = new Date().getHours();
        let quoteClass = 'daily-quote-modal';
        
        if (hour >= 1 && hour <= 4) quoteClass += ' deep-night';
        else if (hour >= 4 && hour <= 6) quoteClass += ' sunrise';
        else if (quote.author === 'Inner Voice' || quote.author === 'Return Whisperer') quoteClass += ' revisit';

        const isDeepMode = this.emotionalEcho.soulMemory.isDeepMode;
        const soulLevel = this.emotionalEcho.soulMemory.currentLevel;

        let additionalContent = '';
        if (isDeepMode) {
            additionalContent = `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E5E7EB; color: #8B5CF6; font-size: 0.85rem; font-style: italic;">
                    Soul Level: ${soulLevel} • Your journey continues...
                </div>
            `;
        }

        await Swal.fire({
            title: this.getQuoteTitleByTime(),
            html: `
                <div style="text-align: center; padding: 1.5rem;">
                    <div style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.5rem; color: #374151; font-style: italic;">
                        "${quote.quote}"
                    </div>
                    <div style="font-weight: 600; color: #8B5CF6; font-size: 1rem;">
                        — ${quote.author}
                    </div>
                    ${additionalContent}
                    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 0.9rem;">
                        💜 Daily inspiration for Fragments community
                    </div>
                </div>
            `,
            icon: null,
            showCloseButton: true,
            confirmButtonText: this.getQuoteButtonText(),
            confirmButtonColor: "#8B5CF6",
            customClass: {
                popup: quoteClass,
                title: 'daily-quote-title',
                htmlContainer: 'daily-quote-content'
            },
            backdrop: 'rgba(15, 15, 35, 0.8)',
            allowOutsideClick: true,
            timer: isDeepMode ? 20000 : 15000,
            timerProgressBar: true
        });
        
        // Trigger emotional resonance effect and save to vault
        this.triggerEmotionalResonance();
        this.emotionalEcho.addToVault('quote', quote);
    }

    getQuoteTitleByTime() {
        const hour = new Date().getHours();
        if (hour >= 1 && hour <= 4) return "🌙 Night Reflection";
        if (hour >= 4 && hour <= 6) return "🌅 Dawn Awakening";
        if (this.emotionalEcho.soulMemory.isDeepMode) return "✨ Soul Fragment";
        return "✨ Daily Inspiration";
    }

    getQuoteButtonText() {
        const level = this.emotionalEcho.soulMemory.currentLevel;
        const buttons = {
            'discovering': 'Thank you ✨',
            'aware': 'I hear you 🙏',
            'connected': 'This resonates 💜',
            'awakened': 'Until tomorrow 🌟'
        };
        return buttons[level] || 'Thank you ✨';
    }

    // ====== SOUL LEVEL INDICATOR ======
    showSoulLevelIndicator() {
        const level = this.emotionalEcho.soulMemory.currentLevel;
        const visits = this.emotionalEcho.vault.totalVisits;
        
        if (visits <= 1) return; // Don't show on first visit

        const indicator = document.createElement('div');
        indicator.className = 'soul-level-indicator';
        indicator.innerHTML = `Soul Level: ${level} (${visits} visits)`;
        
        document.body.appendChild(indicator);
        
        // Show with animation
        setTimeout(() => {
            indicator.classList.add('show');
        }, 1000);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.opacity = '0';
                setTimeout(() => indicator.remove(), 500);
            }
        }, 6000);
    }

    // ====== EMOTIONAL RESONANCE EFFECTS ======
    triggerEmotionalResonance() {
        const resonance = document.createElement('div');
        resonance.className = 'echo-resonance';
        document.body.appendChild(resonance);
        
        setTimeout(() => {
            resonance.classList.add('active');
            setTimeout(() => {
                if (resonance.parentNode) {
                    resonance.remove();
                }
            }, 3000);
        }, 100);
    }

    // ====== WHISPER WALL INTEGRATION ======
    setupWhisperWallTab() {
        // Add whisper wall to navigation if user is in deep mode
        if (this.emotionalEcho.soulMemory.isDeepMode) {
            this.addWhisperWallTab();
        }
    }

    addWhisperWallTab() {
        const navTabs = document.querySelector('.nav-tabs');
        const existingWhisperTab = document.querySelector('[data-tab="whisper-wall"]');
        
        if (existingWhisperTab) return; // Already exists

        const whisperTab = document.createElement('div');
        whisperTab.className = 'nav-tab';
        whisperTab.dataset.tab = 'whisper-wall';
        whisperTab.innerHTML = `
            <span class="tab-icon">💫</span>
            <span class="tab-text">Whisper Wall</span>
        `;
        
        navTabs.appendChild(whisperTab);
        
        // Add click listener
        whisperTab.addEventListener('click', () => this.switchTab('whisper-wall'));
        
        // Add whisper wall content
        const container = document.querySelector('.container');
        const whisperWallContent = document.createElement('div');
        whisperWallContent.id = 'whisper-wall-tab';
        whisperWallContent.className = 'tab-content hidden';
        whisperWallContent.innerHTML = `
            <div class="whisper-wall-tab">
                <div class="whisper-wall-header">
                    <h2>Whisper Wall</h2>
                    <p>Anonymous whispers from souls like yours...</p>
                </div>
                <div class="whisper-wall-filters">
                    <div class="whisper-filter active" data-mood="all">All</div>
                    <div class="whisper-filter" data-mood="confession">Confession 🤫</div>
                    <div class="whisper-filter" data-mood="hope">Hope ✨</div>
                    <div class="whisper-filter" data-mood="grief">Grief 💔</div>
                    <div class="whisper-filter" data-mood="joy">Joy 😊</div>
                    <div class="whisper-filter" data-mood="regret">Regret 😔</div>
                    <div class="whisper-filter" data-mood="gratitude">Gratitude 🙏</div>
                    <div class="whisper-filter" data-mood="longing">Longing 💭</div>
                    <div class="whisper-filter" data-mood="peace">Peace 🕊️</div>
                    <div class="whisper-filter" data-mood="fear">Fear 😰</div>
                    <div class="whisper-filter" data-mood="love">Love 💕</div>
                </div>
                <div id="whisper-wall-container"></div>
                <div style="text-align: center; margin-top: 2rem;">
                    <button class="submit-btn" onclick="fragmentsApp.emotionalEcho.showWhisperWallPrompt()" style="max-width: 300px;">
                        <span class="btn-text">Add Your Whisper</span>
                        <span class="btn-icon">💫</span>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(whisperWallContent);
        
        // Setup filter listeners
        this.setupWhisperWallFilters();
        
        // Render whisper wall
        this.emotionalEcho.renderWhisperWall();
        
        console.log('💫 Whisper Wall unlocked and added');
    }

    setupWhisperWallFilters() {
        document.querySelectorAll('.whisper-filter').forEach(filter => {
            filter.addEventListener('click', () => {
                document.querySelectorAll('.whisper-filter').forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                this.filterWhisperWall(filter.dataset.mood);
            });
        });
    }

    filterWhisperWall(mood) {
        this.emotionalEcho.renderWhisperWall(mood);
    }

    // ====== ENHANCED FOOTER TRIGGERS ======
    setupEnhancedFooterTriggers() {
        const secretGift = document.getElementById('secret-gift');
        if (secretGift) {
            secretGift.addEventListener('click', () => this.showFooterMenu());
        }
    }

    async showFooterMenu() {
        const isDeepMode = this.emotionalEcho.soulMemory.isDeepMode;
        const soulLevel = this.emotionalEcho.soulMemory.currentLevel;
        
        let buttons = {
            'quote': '✨ Daily Quote',
            'vault': '🗃️ Soul Vault',
            'insights': '📊 Soul Insights'
        };

        if (isDeepMode) {
            buttons['whisper'] = '💫 Add Whisper';
            buttons['export'] = '💾 Export Soul Data';
        }

        // Create buttons HTML
        const buttonsHTML = Object.keys(buttons).map(key => 
            `<button class="soul-menu-button" data-action="${key}">${buttons[key]}</button>`
        ).join('');

        const result = await Swal.fire({
            title: `🔮 Soul Menu (${soulLevel})`,
            html: `
                <div style="text-align: center; padding: 1rem;">
                    <p style="color: #6B7280; margin-bottom: 1.5rem;">
                        What calls to your soul today?
                    </p>
                    <div class="soul-menu-buttons">
                        ${buttonsHTML}
                    </div>
                </div>
            `,
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: 'Close',
            customClass: {
                popup: 'soul-menu-modal'
            },
            didOpen: (popup) => {
                // Setup button listeners using the popup parameter
                const menuButtons = popup.querySelectorAll('.soul-menu-button');
                menuButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const action = button.dataset.action;
                        Swal.close();
                        this.handleFooterMenuChoice(action);
                    });
                });
            }
        });
    }

    async handleFooterMenuChoice(choice) {
        switch (choice) {
            case 'quote':
                const dailyQuote = getDailyQuote();
                await this.showEnhancedDailyQuote(dailyQuote);
                break;
            case 'vault':
                await this.emotionalEcho.showVaultExplorer();
                break;
            case 'whisper':
                await this.emotionalEcho.showWhisperWallPrompt();
                break;
            case 'insights':
                await this.showSoulInsights();
                break;
            case 'export':
                this.emotionalEcho.exportSoulData();
                break;
        }
    }

    async showSoulInsights() {
        const insights = this.emotionalEcho.getEmotionalInsights();
        
        await Swal.fire({
            title: '📊 Soul Insights',
            html: `
                <div class="soul-insights">
                    <div class="insights-section">
                        <h4>🌟 Soul Journey</h4>
                        <div class="insight-item">
                            <span class="insight-label">Current Level:</span>
                            <span class="insight-value">${insights.soulJourneyStage.level}</span>
                        </div>
                        <div class="insight-item">
                            <span class="insight-label">Total Visits:</span>
                            <span class="insight-value">${insights.soulJourneyStage.visits}</span>
                        </div>
                        <div class="insight-item">
                            <span class="insight-label">Streak:</span>
                            <span class="insight-value">${insights.soulJourneyStage.streak} days</span>
                        </div>
                        <div class="insight-item">
                            <span class="insight-label">Deep Mode:</span>
                            <span class="insight-value">${insights.soulJourneyStage.deepMode ? 'Active' : 'Dormant'}</span>
                        </div>
                    </div>
                    
                    <div class="insights-section">
                        <h4>💫 Emotional Patterns</h4>
                        <div class="insight-item">
                            <span class="insight-label">Growth:</span>
                            <span class="insight-value">${insights.emotionalGrowth}%</span>
                        </div>
                        <div class="insight-item">
                            <span class="insight-label">Resonance:</span>
                            <span class="insight-value">${insights.resonancePattern}</span>
                        </div>
                    </div>
                    
                    <div class="insights-section">
                        <h4>🎭 Dominant Moods</h4>
                        ${insights.dominantMoods.map(mood => `
                            <div class="insight-item">
                                <span class="insight-label">${mood.mood}:</span>
                                <span class="insight-value">${mood.count} whispers</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="insights-section">
                        <h4>🛤️ Next Milestone</h4>
                        <p style="color: #6B7280; font-style: italic;">${insights.soulJourneyStage.nextMilestone}</p>
                    </div>
                </div>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Continue Journey',
            confirmButtonColor: '#8B5CF6',
            customClass: {
                popup: 'soul-insights-modal'
            },
            width: '80%'
        });
    }

    generateAnonymousUser() {
        const adjectives = [
            'Wandering', 'Silent', 'Dreaming', 'Gentle', 'Brave', 'Quiet', 'Mystic', 'Hidden',
            'Serene', 'Lost', 'Free', 'Wild', 'Peaceful', 'Restless', 'Curious', 'Ancient'
        ];
        const nouns = [
            'Soul', 'Spirit', 'Heart', 'Mind', 'Voice', 'Echo', 'Shadow', 'Light',
            'Star', 'Moon', 'River', 'Mountain', 'Ocean', 'Forest', 'Wind', 'Fire'
        ];
        const emojis = [
            '🦋', '🌙', '⭐', '🌊', '🍃', '🔮', '🕊️', '🦄', '🐺', '🦉', '🌸', '🍀',
            '🎭', '🎨', '📚', '🎵', '🌈', '☘️', '🦋', '🌺', '🍂', '🌙', '⭐', '🔥'
        ];

        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];

        return {
            name: `${adjective} ${noun}`,
            emoji: emoji,
            id: this.generateId()
        };
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    loadUserData() {
        const savedUser = localStorage.getItem('fragments_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
            } catch (e) {
                console.warn('Invalid saved user data, generating new user');
                localStorage.setItem('fragments_user', JSON.stringify(this.currentUser));
            }
        } else {
            localStorage.setItem('fragments_user', JSON.stringify(this.currentUser));
        }
    }

    // ====== EVENT LISTENERS ======
    setupEventListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Story form
        const storyContent = document.getElementById('story-content');
        const shareBtn = document.getElementById('share-story');
        
        if (storyContent) {
            storyContent.addEventListener('input', () => this.updateCharCounter());
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareStory());
        }

        // Category and mood selection
        document.querySelectorAll('.category-pill').forEach(pill => {
            pill.addEventListener('click', () => this.selectCategory(pill));
        });

        document.querySelectorAll('.mood-pill').forEach(pill => {
            pill.addEventListener('click', () => this.selectMood(pill));
        });

        // Filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => this.setFilter(chip));
        });

        // FAB button
        const fab = document.getElementById('quick-write');
        if (fab) {
            fab.addEventListener('click', () => this.quickWrite());
        }

        // Modal controls
        this.setupModalControls();

        // Chat functionality (legacy)
        this.setupChatControls();

        // Enhanced footer triggers
        this.setupEnhancedFooterTriggers();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    setupModalControls() {
        const deleteModal = document.getElementById('delete-modal');
        const storyModal = document.getElementById('story-modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const confirmBtn = document.getElementById('confirm-btn');
        const closeStoryModal = document.getElementById('close-story-modal');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideModal(deleteModal));
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmDelete());
        }

        if (closeStoryModal) {
            closeStoryModal.addEventListener('click', () => this.hideModal(storyModal));
        }

        // Close modals on outside click
        [deleteModal, storyModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) this.hideModal(modal);
                });
            }
        });
    }

    setupChatControls() {
        const usernameInput = document.getElementById('username');
        const messageInput = document.getElementById('message');
        const sendBtn = document.getElementById('send-btn');

        if (usernameInput) {
            usernameInput.value = localStorage.getItem('chatUser') || '';
            usernameInput.addEventListener('input', () => {
                localStorage.setItem('chatUser', usernameInput.value.trim());
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendChatMessage());
        }

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
            });
        }
    }

    // ====== FIREBASE LISTENERS ======
    setupFirebaseListeners() {
        // Listen for stories
        const storiesRef = ref(database, 'stories');
        onValue(storiesRef, (snapshot) => {
            this.stories = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    this.stories.push({
                        id: child.key,
                        ...child.val()
                    });
                });
            }
            this.renderStories();
        });

        // Listen for chats (legacy)
        const chatsRef = ref(database, 'chats');
        onValue(chatsRef, (snapshot) => {
            this.chats = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    this.chats.push({
                        id: child.key,
                        ...child.val()
                    });
                });
            }
            this.renderChats();
        });
    }

    // ====== TAB MANAGEMENT ======
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) {
            tabContent.classList.remove('hidden');
        }

        this.currentTab = tabName;

        // Tab-specific actions
        if (tabName === 'discover') {
            this.loadDiscoverContent();
        } else if (tabName === 'whisper-wall') {
            this.emotionalEcho.renderWhisperWall();
        }
    }

    // ====== STORY FUNCTIONALITY ======
    updateCharCounter() {
        const textarea = document.getElementById('story-content');
        const counter = document.getElementById('char-count');
        
        if (!textarea || !counter) return;

        const length = textarea.value.length;
        const maxLength = 2000;
        
        counter.textContent = length;
        const parent = counter.parentElement;
        if (parent) {
            parent.classList.remove('warning', 'danger');
            
            if (length > maxLength * 0.9) {
                parent.classList.add('danger');
            } else if (length > maxLength * 0.75) {
                parent.classList.add('warning');
            }
        }
    }

    selectCategory(pill) {
        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        this.selectedCategory = pill.dataset.category;
    }

    selectMood(pill) {
        document.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        this.selectedMood = pill.dataset.mood;
    }

    async shareStory() {
        const contentEl = document.getElementById('story-content');
        if (!contentEl) return;
        
        const content = contentEl.value.trim();
        
        if (!content) {
            this.showToast('Please write something to share...', 'warning');
            return;
        }

        if (content.length > 2000) {
            this.showToast('Story is too long. Please keep it under 2000 characters.', 'danger');
            return;
        }

        const shareBtn = document.getElementById('share-story');
        if (shareBtn) {
            shareBtn.disabled = true;
            shareBtn.innerHTML = '<span class="spinner"></span> Sharing...';
        }

        try {
            const storyData = {
                content: content,
                author: this.currentUser.name,
                authorEmoji: this.currentUser.emoji,
                authorId: this.currentUser.id,
                category: this.selectedCategory || 'other',
                mood: this.selectedMood || null,
                timestamp: Date.now(),
                likes: 0,
                comments: 0,
                likedBy: {}
            };

            await push(ref(database, 'stories'), storyData);

            // Clear form
            contentEl.value = '';
            this.selectedCategory = null;
            this.selectedMood = null;
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('selected'));
            document.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('selected'));
            this.updateCharCounter();

            // Update soul memory and vault
            this.emotionalEcho.addToVault('story', content);
            this.emotionalEcho.updateEmotionalResonance(15);

            this.showToast('Your story has been shared anonymously! 💜', 'success');
            this.switchTab('stories');

        } catch (error) {
            console.error('Error sharing story:', error);
            this.showToast('Failed to share story. Please try again.', 'danger');
        } finally {
            if (shareBtn) {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<span class="btn-text">Share Anonymously</span><span class="btn-icon">🚀</span>';
            }
        }
    }

    renderStories() {
        const container = document.getElementById('stories-container');
        const loading = document.getElementById('stories-loading');
        
        if (!container) return;

        if (loading) loading.style.display = 'none';

        if (this.stories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No stories yet</h3>
                    <p>Be the first to share your story with the world.</p>
                    <button class="submit-btn" onclick="fragmentsApp.quickWrite()">Share Your Story</button>
                </div>
            `;
            return;
        }

        // Sort stories by timestamp (newest first)
        const sortedStories = [...this.stories].sort((a, b) => b.timestamp - a.timestamp);

        container.innerHTML = sortedStories.map(story => this.createStoryCard(story)).join('');
        
        // Add event listeners to story cards
        this.attachStoryEventListeners();
    }

    createStoryCard(story) {
        const isOwnStory = story.authorId === this.currentUser.id;
        const timeAgo = this.getTimeAgo(story.timestamp);
        const isLiked = story.likedBy && story.likedBy[this.currentUser.id];

        return `
            <div class="story-card" data-story-id="${story.id}">
                <div class="story-meta">
                    <div class="story-avatar">${story.authorEmoji}</div>
                    <div class="story-info">
                        <h3>${this.escapeHtml(story.author)}</h3>
                        <div class="timestamp">${timeAgo}</div>
                    </div>
                    <div class="story-badges">
                        ${story.category ? `<div class="story-category">${this.getCategoryDisplay(story.category)}</div>` : ''}
                        ${story.mood ? `<div class="story-mood">${this.getMoodDisplay(story.mood)}</div>` : ''}
                    </div>
                    ${isOwnStory ? `<button class="delete-btn" onclick="fragmentsApp.deleteStory('${story.id}')">🗑️</button>` : ''}
                </div>
                <div class="story-content">${this.formatStoryContent(story.content)}</div>
                <div class="story-actions">
                    <div class="action-group">
                        <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="fragmentsApp.toggleLike('${story.id}')">
                            <span>💜</span>
                            <span>${story.likes || 0}</span>
                        </button>
                        <button class="action-btn" onclick="fragmentsApp.showStoryDetail('${story.id}')">
                            <span>💬</span>
                            <span>${story.comments || 0}</span>
                        </button>
                        <button class="action-btn" onclick="fragmentsApp.shareStoryLink('${story.id}')">
                            <span>🔗</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachStoryEventListeners() {
        document.querySelectorAll('.story-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn') && !e.target.closest('.delete-btn')) {
                    const storyId = card.dataset.storyId;
                    this.showStoryDetail(storyId);
                }
            });
        });
    }

    async toggleLike(storyId) {
        try {
            const story = this.stories.find(s => s.id === storyId);
            if (!story) return;

            const isLiked = story.likedBy && story.likedBy[this.currentUser.id];
            const newLikes = Math.max(0, (story.likes || 0) + (isLiked ? -1 : 1));
            const newLikedBy = { ...(story.likedBy || {}) };

            if (isLiked) {
                delete newLikedBy[this.currentUser.id];
            } else {
                newLikedBy[this.currentUser.id] = true;
                // Update emotional echo interaction count
                this.emotionalEcho.updateEmotionalResonance(5);
            }

            await set(ref(database, `stories/${storyId}/likes`), newLikes);
            await set(ref(database, `stories/${storyId}/likedBy`), newLikedBy);

        } catch (error) {
            console.error('Error toggling like:', error);
            this.showToast('Failed to update like. Please try again.', 'danger');
        }
    }

    deleteStory(storyId) {
        this.pendingDeleteId = storyId;
        const modal = document.getElementById('delete-modal');
        this.showModal(modal);
    }

    async confirmDelete() {
        if (!this.pendingDeleteId) return;

        try {
            await remove(ref(database, `stories/${this.pendingDeleteId}`));
            this.showToast('Story deleted successfully.', 'success');
        } catch (error) {
            console.error('Error deleting story:', error);
            this.showToast('Failed to delete story. Please try again.', 'danger');
        } finally {
            this.pendingDeleteId = null;
            const modal = document.getElementById('delete-modal');
            this.hideModal(modal);
        }
    }

    showStoryDetail(storyId) {
        const story = this.stories.find(s => s.id === storyId);
        if (!story) return;

        const modal = document.getElementById('story-modal');
        const content = document.getElementById('story-detail-content');
        
        if (!modal || !content) return;

        const timeAgo = this.getTimeAgo(story.timestamp);
        const isLiked = story.likedBy && story.likedBy[this.currentUser.id];

        content.innerHTML = `
            <div class="story-detail-header">
                <div class="story-meta">
                    <div class="story-avatar">${story.authorEmoji}</div>
                    <div class="story-info">
                        <h3>${this.escapeHtml(story.author)}</h3>
                        <div class="timestamp">${timeAgo}</div>
                    </div>
                    <div class="story-badges">
                        ${story.category ? `<div class="story-category">${this.getCategoryDisplay(story.category)}</div>` : ''}
                        ${story.mood ? `<div class="story-mood">${this.getMoodDisplay(story.mood)}</div>` : ''}
                    </div>
                </div>
            </div>
            <div class="story-detail-content">
                <p>${this.formatStoryContent(story.content)}</p>
            </div>
            <div class="story-detail-actions">
                <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="fragmentsApp.toggleLike('${story.id}')">
                    <span>💜</span>
                    <span>${story.likes || 0} likes</span>
                </button>
                <button class="action-btn" onclick="fragmentsApp.shareStoryLink('${story.id}')">
                    <span>🔗</span>
                    <span>Share</span>
                </button>
            </div>
        `;

        this.showModal(modal);
        
        // Track story view interaction
        this.emotionalEcho.updateEmotionalResonance(2);
    }

    shareStoryLink(storyId) {
        const url = `${window.location.origin}/?story=${storyId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Anonymous Story - Fragments',
                text: 'Check out this anonymous story on Fragments',
                url: url
            }).catch(console.error);
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Story link copied to clipboard!', 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(url);
            });
        } else {
            this.fallbackCopyToClipboard(url);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            this.showToast('Story link copied to clipboard!', 'success');
        } catch (err) {
            this.showToast('Failed to copy link', 'danger');
        }
        document.body.removeChild(textArea);
    }

    // ====== DISCOVER FUNCTIONALITY ======
    loadDiscoverContent() {
        const container = document.getElementById('discover-container');
        if (!container) return;

        // Show trending stories (most liked)
        const trendingStories = [...this.stories]
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 10);

        if (trendingStories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>Nothing to discover yet</h3>
                    <p>Stories will appear here as the community grows.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = trendingStories.map(story => this.createStoryCard(story)).join('');
        this.attachStoryEventListeners();
    }

    setFilter(chip) {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        // Implement filtering logic here
        this.loadDiscoverContent();
    }

    // ====== CHAT FUNCTIONALITY (LEGACY) ======
    async sendChatMessage() {
        const usernameInput = document.getElementById('username');
        const messageInput = document.getElementById('message');
        
        if (!usernameInput || !messageInput) return;

        const username = usernameInput.value.trim() || 'Anonymous';
        const message = messageInput.value.trim();

        if (!message) return;

        try {
            const chatData = {
                user: username,
                message: message,
                timestamp: Date.now()
            };

            await push(ref(database, 'chats'), chatData);
            messageInput.value = '';
            
            // Update emotional resonance for chat participation
            this.emotionalEcho.updateEmotionalResonance(3);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Failed to send message. Please try again.', 'danger');
        }
    }

    renderChats() {
        const chatList = document.getElementById('chat-list');
        if (!chatList) return;

        if (this.chats.length === 0) {
            chatList.innerHTML = '<li class="empty-message">No messages yet. Start the conversation!</li>';
            return;
        }

        const emojis = [
            "🦊", "🐼", "🐧", "🦄", "🐸", "🐻", "🐰", "🐱", "🐯", "🐶", 
            "🐨", "🐙", "🐢", "🦁", "🐮", "🐵", "🐤", "🐔", "🦉", "🐬"
        ];

        const sortedChats = [...this.chats].sort((a, b) => a.timestamp - b.timestamp);

        chatList.innerHTML = sortedChats
            .map((chat, index) => {
                const emoji = emojis[index % emojis.length];
                const timeAgo = this.getTimeAgo(chat.timestamp);
                const isOwnMessage = chat.user === localStorage.getItem('chatUser');

                return `
                    <li class="chat-message ${isOwnMessage ? 'own-message' : ''}">
                        <div class="chat-avatar">${emoji}</div>
                        <div class="chat-content">
                            <div class="chat-header">
                                <span class="chat-user">${this.escapeHtml(chat.user)}:</span>
                                <span class="chat-time">${timeAgo}</span>
                            </div>
                            <div class="chat-text">${this.formatStoryContent(chat.message)}</div>
                        </div>
                        ${isOwnMessage ? `<button class="delete-btn" onclick="fragmentsApp.deleteChatMessage('${chat.id}')">×</button>` : ''}
                    </li>
                `;
            }).join('');

        this.scrollChatToBottom();
    }

    scrollChatToBottom() {
        const chatList = document.getElementById('chat-list');
        if (chatList) {
            chatList.scrollTop = chatList.scrollHeight;
        }
    }

    async deleteChatMessage(chatId) {
        try {
            await remove(ref(database, `chats/${chatId}`));
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showToast('Failed to delete message.', 'danger');
        }
    }

    // ====== UTILITY FUNCTIONS ======
    quickWrite() {
        this.switchTab('create');
        setTimeout(() => {
            const textarea = document.getElementById('story-content');
            if (textarea) {
                textarea.focus();
            }
        }, 100);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    formatStoryContent(content) {
        return this.escapeHtml(content)
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }

    getCategoryDisplay(category) {
        const categories = {
            'life': '💫 Life',
            'dreams': '🌙 Dreams',
            'fears': '🌊 Fears',
            'love': '💕 Love',
            'growth': '🌱 Growth',
            'confession': '🤫 Confession',
            'hope': '✨ Hope',
            'advice': '💡 Advice',
            'gratitude': '🙏 Gratitude',
            'other': '🔮 Other'
        };
        return categories[category] || this.escapeHtml(category);
    }

    getMoodDisplay(mood) {
        const moods = {
            'happy': '😊 Happy',
            'sad': '😢 Sad',
            'excited': '🎉 Excited',
            'peaceful': '😌 Peaceful',
            'anxious': '😰 Anxious',
            'grateful': '🥺 Grateful',
            'hopeful': '🌈 Hopeful'
        };
        return moods[mood] || this.escapeHtml(mood);
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

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            'success': '✅',
            'danger': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    showModal(modal) {
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K to quick write
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.quickWrite();
        }

        // Ctrl/Cmd + Shift + V to open vault
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            this.emotionalEcho.showVaultExplorer();
        }

        // Ctrl/Cmd + Shift + W to add whisper (if in deep mode)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'W') {
            e.preventDefault();
            if (this.emotionalEcho.soulMemory.isDeepMode) {
                this.emotionalEcho.showWhisperWallPrompt();
            }
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="flex"]');
            openModals.forEach(modal => this.hideModal(modal));
        }
    }

    // ====== ANIMATIONS ======
    initializeAnimations() {
        // GSAP animations for smooth page load
        if (typeof gsap !== 'undefined') {
            gsap.from('.header h1', {
                duration: 1,
                y: -50,
                opacity: 0,
                ease: "bounce.out"
            });

            gsap.from('.nav-tabs', {
                duration: 0.8,
                y: 30,
                opacity: 0,
                delay: 0.3,
                ease: "power2.out"
            });

            gsap.from('.container', {
                duration: 0.8,
                y: 50,
                opacity: 0,
                delay: 0.5,
                ease: "power2.out"
            });
        }

        // Observe elements for scroll animations
        if (typeof IntersectionObserver !== 'undefined') {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                    }
                });
            });

            // Observe story cards after they're rendered
            setTimeout(() => {
                document.querySelectorAll('.story-card').forEach(card => {
                    observer.observe(card);
                });
            }, 1000);
        }
    }
}

// ====== ADDITIONAL STYLES FOR ENHANCED FEATURES ======
const enhancedStyles = `
<style>
/* Soul Menu Button Styles */
.soul-menu-modal {
    border-radius: 1.5rem !important;
    background: linear-gradient(135deg, #1e1b4b, #312e81) !important;
    color: white !important;
}

.soul-menu-button {
    display: block;
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 1rem;
    margin: 0.5rem 0;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
    font-weight: 500;
}

.soul-menu-button:hover {
    background: rgba(139, 92, 246, 0.3);
    border-color: #8B5CF6;
    transform: translateY(-2px);
}

/* Soul Insights Modal */
.soul-insights-modal {
    background: linear-gradient(135deg, #0f172a, #1e293b) !important;
    color: #e2e8f0 !important;
}

.soul-insights {
    text-align: left;
    max-height: 70vh;
    overflow-y: auto;
}

.insights-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    border: 1px solid rgba(139, 92, 246, 0.2);
}

.insights-section h4 {
    margin-bottom: 1rem;
    color: #a78bfa;
    font-size: 1rem;
    border-bottom: 1px solid rgba(139, 92, 246, 0.3);
    padding-bottom: 0.5rem;
}

.insight-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.insight-item:last-child {
    border-bottom: none;
}

.insight-label {
    color: #cbd5e1;
    font-size: 0.9rem;
}

.insight-value {
    color: #a78bfa;
    font-weight: 600;
    font-size: 0.9rem;
}

/* Enhanced Toast Styles */
.toast {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    z-index: 1001;
    transform: translateX(400px);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 10px 30px var(--shadow);
    backdrop-filter: blur(10px);
    max-width: 400px;
    min-width: 300px;
    opacity: 0;
}

.toast.show {
    transform: translateX(0);
    opacity: 1;
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.toast-icon {
    font-size: 1.2rem;
}

.toast-message {
    color: var(--text);
    font-weight: 500;
    flex: 1;
}

.toast-success {
    border-color: var(--accent);
    background: rgba(16, 185, 129, 0.1);
}

.toast-danger {
    border-color: var(--danger);
    background: rgba(239, 68, 68, 0.1);
}

.toast-warning {
    border-color: var(--warning);
    background: rgba(245, 158, 11, 0.1);
}

.toast-info {
    border-color: var(--primary);
    background: rgba(139, 92, 246, 0.1);
}

@media (max-width: 768px) {
    .toast {
        top: 1rem;
        right: 1rem;
        left: 1rem;
        transform: translateY(-100px);
        max-width: none;
        min-width: auto;
    }
    
    .toast.show {
        transform: translateY(0);
    }
    
    .soul-insights {
        max-height: 60vh;
        padding: 0.5rem;
    }
    
    .insights-section {
        padding: 0.75rem;
    }
    
    .insight-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }
}
</style>
`;

// Inject enhanced styles safely
if (!document.querySelector('#enhanced-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'enhanced-styles';
    styleElement.innerHTML = enhancedStyles;
    document.head.appendChild(styleElement);
}

// ====== APP INITIALIZATION ======
let fragmentsApp;

// Initialize app when DOM is ready
function initFragmentsApp() {
    if (!fragmentsApp) {
        fragmentsApp = new FragmentsApp();
        
        // Make app globally available for onclick handlers
        window.fragmentsApp = fragmentsApp;
        
        console.log('🔮 Fragments - Where stories find their voice');
        console.log('💜 Built with love by @xoxim');
        console.log('✨ Emotional Echo System Active');
        console.log('🧠 Soul Memory Initialized');
        console.log('💫 Whisper Wall Ready');
        console.log('🗃️ Vault System Online');
    }
}

// Multiple initialization methods to ensure app starts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFragmentsApp);
} else {
    initFragmentsApp();
}

// Fallback initialization
setTimeout(initFragmentsApp, 1000);

// ====== URL ROUTING FOR SHARED STORIES ======
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('story');
    
    if (storyId && fragmentsApp) {
        // Wait for stories to load then show the specific story
        setTimeout(() => {
            if (fragmentsApp && fragmentsApp.showStoryDetail) {
                fragmentsApp.showStoryDetail(storyId);
            }
        }, 3000);
    }
});

// ====== PWA SERVICE WORKER REGISTRATION ======
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// ====== ENHANCED ERROR HANDLING ======
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (fragmentsApp && fragmentsApp.showToast) {
        fragmentsApp.showToast('Something went wrong. Please refresh the page.', 'danger');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (fragmentsApp && fragmentsApp.showToast) {
        fragmentsApp.showToast('Network error. Please check your connection.', 'warning');
    }
});

// ====== EMOTIONAL ECHO SYSTEM HELPERS ======
window.addEventListener('beforeunload', () => {
    // Save soul memory before page unload
    if (fragmentsApp && fragmentsApp.emotionalEcho) {
        fragmentsApp.emotionalEcho.saveSoulMemory();
        fragmentsApp.emotionalEcho.saveToVault();
        fragmentsApp.emotionalEcho.saveWhispers();
    }
});

// Periodic auto-save for emotional echo data
setInterval(() => {
    if (fragmentsApp && fragmentsApp.emotionalEcho) {
        fragmentsApp.emotionalEcho.saveSoulMemory();
        fragmentsApp.emotionalEcho.saveToVault();
        fragmentsApp.emotionalEcho.saveWhispers();
    }
}, 30000); // Auto-save every 30 seconds

// ====== VISIBILITY API FOR SOUL PRESENCE ======
document.addEventListener('visibilitychange', () => {
    if (fragmentsApp && fragmentsApp.emotionalEcho) {
        if (document.hidden) {
            // User left the tab - save state
            fragmentsApp.emotionalEcho.saveSoulMemory();
            fragmentsApp.emotionalEcho.saveToVault();
            console.log('👻 Soul presence paused');
        } else {
            // User returned to the tab - check for time-based prompts
            console.log('👁️ Soul presence resumed');
            setTimeout(() => {
                fragmentsApp.emotionalEcho.checkTimeBasedPrompts();
            }, 1000);
        }
    }
});

// ====== PERFORMANCE MONITORING ======
window.addEventListener('load', () => {
    // Log performance metrics
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
        console.log('🚀 App loaded in:', Math.round(perfData.loadEventEnd - perfData.fetchStart), 'ms');
    }
    
    // Check if all systems are operational
    setTimeout(() => {
        if (fragmentsApp && fragmentsApp.emotionalEcho) {
            const systemStatus = {
                app: '✅ Operational',
                echo: '✅ Active',
                vault: '✅ Online',
                whispers: fragmentsApp.emotionalEcho.soulMemory.isDeepMode ? '✅ Unlocked' : '🔒 Locked',
                soulLevel: fragmentsApp.emotionalEcho.soulMemory.currentLevel,
                totalVisits: fragmentsApp.emotionalEcho.vault.totalVisits
            };
            
            console.log('🔮 System Status:', systemStatus);
        }
    }, 2000);
});

// ====== EXPERIMENTAL FEATURES ======
// Soul Resonance Detection (experimental)
let lastInteractionTime = Date.now();
let interactionCount = 0;

document.addEventListener('click', () => {
    const now = Date.now();
    const timeSinceLastInteraction = now - lastInteractionTime;
    
    interactionCount++;
    lastInteractionTime = now;
    
    // Detect rapid interactions (possible emotional resonance)
    if (timeSinceLastInteraction < 500 && interactionCount > 5) {
        if (fragmentsApp && fragmentsApp.emotionalEcho) {
            fragmentsApp.emotionalEcho.updateEmotionalResonance(1);
            console.log('💫 Rapid interaction detected - emotional resonance increased');
        }
        interactionCount = 0;
    }
});

// Reset interaction count periodically
setInterval(() => {
    interactionCount = 0;
}, 10000);

// ====== DEBUG HELPERS (Development only) ======
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugFragments = {
        getSoulMemory: () => fragmentsApp?.emotionalEcho?.soulMemory,
        getVault: () => fragmentsApp?.emotionalEcho?.vault,
        getWhispers: () => fragmentsApp?.emotionalEcho?.whisperWall?.whispers,
        forceSoulEvolution: (level) => {
            if (fragmentsApp?.emotionalEcho) {
                const oldLevel = fragmentsApp.emotionalEcho.soulMemory.currentLevel;
                fragmentsApp.emotionalEcho.triggerSoulEvolution(oldLevel, level);
                fragmentsApp.emotionalEcho.soulMemory.currentLevel = level;
                fragmentsApp.emotionalEcho.saveSoulMemory();
            }
        },
        enableDeepMode: () => {
            if (fragmentsApp?.emotionalEcho) {
                fragmentsApp.emotionalEcho.soulMemory.isDeepMode = true;
                fragmentsApp.emotionalEcho.saveSoulMemory();
                fragmentsApp.setupWhisperWallTab();
                console.log('🌌 Deep Mode force-enabled');
            }
        },
        clearSoulData: () => {
            localStorage.removeItem('fragments_soul_memory');
            localStorage.removeItem('fragments_vault');
            localStorage.removeItem('fragments_whispers');
            console.log('🗑️ Soul data cleared - refresh to regenerate');
        },
        triggerTimePrompt: (type) => {
            if (fragmentsApp?.emotionalEcho) {
                const triggers = fragmentsApp.emotionalEcho.timeTriggers;
                if (triggers[type]) {
                    fragmentsApp.emotionalEcho.showTimeBasedPrompt(type, triggers[type]);
                }
            }
        }
    };
    
    console.log('🛠️ Debug helpers available: window.debugFragments');
}

// Export for module usage
export { FragmentsApp, initFragmentsApp };