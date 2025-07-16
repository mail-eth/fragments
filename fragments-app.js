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
        this.init();
    }

    // ====== INITIALIZATION ======
    init() {
        this.setupEventListeners();
        this.setupFirebaseListeners();
        this.loadUserData();
        this.initializeAnimations();
        console.log('🚀 Fragments App Initialized');
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

        // Easter egg
        this.setupEasterEgg();

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

    setupEasterEgg() {
        const secretGift = document.getElementById('secret-gift');
        if (secretGift) {
            secretGift.addEventListener('click', () => this.triggerEasterEgg());
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
            // Check for easter eggs
            this.checkEasterEgg(content);

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
            this.checkEasterEgg(message);

            const chatData = {
                user: username,
                message: message,
                timestamp: Date.now()
            };

            await push(ref(database, 'chats'), chatData);
            messageInput.value = '';
            
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

    // ====== EASTER EGG SYSTEM ======
    checkEasterEgg(content) {
        const secretCodes = [
            "lost", "help", "why", "here", "empty", "alone", "dark", "rest", "peace",
            "fragments", "soul", "dream", "hope", "love", "fear", "void", "echo",
            "tersesat", "tolong", "kenapa", "kosong", "sendiri", "gelap", "damai",
            "lelah", "sepi", "takdir", "percaya", "sunyi", "jiwa", "mimpi"
        ];

        const text = content.toLowerCase().trim();
        
        if (secretCodes.some(code => text.includes(code)) && !localStorage.getItem('eggFound')) {
            this.triggerEasterEgg();
        }
    }

    triggerEasterEgg() {
        if (localStorage.getItem('eggFound')) {
            this.showToast('You already found the easter egg! 🎉', 'info');
            return;
        }

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: "🎉 Hidden Fragment Discovered!",
                html: `
                    <div style="text-align: center; padding: 1rem;">
                        <p style="margin-bottom: 1rem;">You've unlocked a piece of the hidden story...</p>
                        <p style="margin-bottom: 1rem;">Your words have power. Your story matters.</p>
                        <p style="margin-bottom: 1.5rem;">Take this moment to reflect on your journey.</p>
                        <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
                            <strong style="color: white;">DM 'FRAGMENTS' to @xoxim on any platform to claim your reward! 🎁</strong>
                        </div>
                    </div>
                `,
                icon: "success",
                confirmButtonText: "Beautiful ✨",
                confirmButtonColor: "#8B5CF6"
            });
        } else {
            this.showToast('🎉 Hidden Fragment Discovered! DM "FRAGMENTS" to @xoxim for your reward!', 'success');
        }

        localStorage.setItem('eggFound', 'true');
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

// ====== ADDITIONAL STYLES FOR TOAST NOTIFICATIONS ======
const toastStyles = `
<style>
.toast {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    z-index: 1001;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    box-shadow: 0 10px 30px var(--shadow);
    backdrop-filter: blur(10px);
    max-width: 350px;
}

.toast.show {
    transform: translateX(0);
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.toast-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
}

.toast-message {
    color: var(--text);
    font-weight: 500;
    line-height: 1.4;
}

.toast-success {
    border-left: 4px solid var(--accent);
}

.toast-danger {
    border-left: 4px solid var(--danger);
}

.toast-warning {
    border-left: 4px solid var(--warning);
}

.toast-info {
    border-left: 4px solid var(--primary);
}

.empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: var(--text-muted);
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.7;
}

.empty-state h3 {
    font-size: 1.5rem;
    color: var(--text);
    margin-bottom: 1rem;
    font-weight: 600;
}

.empty-state p {
    margin-bottom: 2rem;
    line-height: 1.6;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

.empty-message {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
    font-style: italic;
}

@media (max-width: 768px) {
    .toast {
        top: 1rem;
        right: 1rem;
        left: 1rem;
        transform: translateY(-100px);
        max-width: none;
    }
    
    .toast.show {
        transform: translateY(0);
    }
}
</style>
`;

// Inject toast styles safely
if (!document.querySelector('#toast-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'toast-styles';
    styleElement.innerHTML = toastStyles;
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

// ====== ERROR HANDLING ======
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

// Export for module usage
export { FragmentsApp, initFragmentsApp };