// ============================================
// FLASHCARD APP - VANILLA JAVASCRIPT
// ============================================

// ============================================
// STATE MANAGEMENT
// ============================================

class FlashcardApp {
    constructor() {
        this.flashcards = [];
        this.currentIndex = 0;
        this.isFlipped = false;
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.filteredCards = [];
        this.currentFilter = 'all';
        this.categories = new Set();

        this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
        this.loadFromLocalStorage();
        this.cacheElements();
        this.attachEventListeners();
        this.updateUI();
        this.updateCategoryFilter();
    }

    cacheElements() {
        // Form elements
        this.addCardForm = document.getElementById('addCardForm');
        this.questionInput = document.getElementById('question');
        this.answerInput = document.getElementById('answer');
        this.categoryInput = document.getElementById('category');

        // Display elements
        this.emptyState = document.getElementById('emptyState');
        this.cardContainer = document.getElementById('cardContainer');
        this.flashcard = document.getElementById('flashcard');
        this.questionText = document.getElementById('questionText');
        this.answerText = document.getElementById('answerText');
        this.cardNumber = document.getElementById('cardNumber');
        this.cardCategory = document.getElementById('cardCategory');

        // Button elements
        this.flipBtn = document.getElementById('flipBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.knownBtn = document.getElementById('knownBtn');
        this.unknownBtn = document.getElementById('unknownBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.clearDataBtn = document.getElementById('clearDataBtn');
        this.resetScoreBtn = document.getElementById('resetScoreBtn');

        // Stats elements
        this.totalCards = document.getElementById('totalCards');
        this.correctCountElement = document.getElementById('correctCount');
        this.incorrectCountElement = document.getElementById('incorrectCount');

        // Filter elements
        this.categoryFilter = document.getElementById('categoryFilter');
    }

    attachEventListeners() {
        // Form submission
        this.addCardForm.addEventListener('submit', (e) => this.handleAddCard(e));

        // Flip card
        this.flipBtn.addEventListener('click', () => this.toggleFlip());
        this.flashcard.addEventListener('click', () => this.toggleFlip());

        // Navigation
        this.prevBtn.addEventListener('click', () => this.previousCard());
        this.nextBtn.addEventListener('click', () => this.nextCard());

        // Mark cards
        this.knownBtn.addEventListener('click', () => this.markAsKnown());
        this.unknownBtn.addEventListener('click', () => this.markAsUnknown());

        // Actions
        this.shuffleBtn.addEventListener('click', () => this.shuffle());
        this.clearDataBtn.addEventListener('click', () => this.clearAllData());
        this.resetScoreBtn.addEventListener('click', () => this.resetScore());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    // ============================================
    // FLASHCARD OPERATIONS
    // ============================================

    handleAddCard(e) {
        e.preventDefault();

        const question = this.questionInput.value.trim();
        const answer = this.answerInput.value.trim();
        const category = this.categoryInput.value.trim() || 'Uncategorized';

        if (!question || !answer) {
            alert('Please fill in both question and answer');
            return;
        }

        const card = {
            id: Date.now(),
            question,
            answer,
            category,
            isKnown: false,
            createdAt: new Date().toISOString()
        };

        this.flashcards.push(card);
        this.categories.add(category);

        // Reset form
        this.addCardForm.reset();

        // Update UI
        this.filterCards('all');
        this.currentFilter = 'all';
        this.currentIndex = this.filteredCards.length - 1;
        this.isFlipped = false;
        this.updateUI();
        this.updateCategoryFilter();
        this.saveToLocalStorage();

        // Success feedback
        this.showSuccessMessage('Flashcard added successfully!');
    }

    deleteCard(id) {
        const index = this.flashcards.findIndex(card => card.id === id);
        if (index > -1) {
            this.flashcards.splice(index, 1);
            this.filterCards(this.currentFilter);

            if (this.currentIndex >= this.filteredCards.length && this.currentIndex > 0) {
                this.currentIndex--;
            }

            this.isFlipped = false;
            this.updateUI();
            this.saveToLocalStorage();
        }
    }

    // ============================================
    // NAVIGATION
    // ============================================

    nextCard() {
        if (this.filteredCards.length === 0) return;

        this.currentIndex = (this.currentIndex + 1) % this.filteredCards.length;
        this.isFlipped = false;
        this.updateCardDisplay();
    }

    previousCard() {
        if (this.filteredCards.length === 0) return;

        this.currentIndex = (this.currentIndex - 1 + this.filteredCards.length) % this.filteredCards.length;
        this.isFlipped = false;
        this.updateCardDisplay();
    }

    // ============================================
    // FLIP ANIMATION
    // ============================================

    toggleFlip() {
        this.isFlipped = !this.isFlipped;
        this.flashcard.classList.toggle('flipped');
    }

    // ============================================
    // SCORE TRACKING
    // ============================================

    markAsKnown() {
        if (this.filteredCards.length === 0) return;

        const currentCard = this.filteredCards[this.currentIndex];
        if (!currentCard.isKnown) {
            currentCard.isKnown = true;
            this.correctCount++;
            this.updateStats();
            this.showFeedback('✓ Great! Moving to next card...', 'success');
            setTimeout(() => this.nextCard(), 500);
        }
    }

    markAsUnknown() {
        if (this.filteredCards.length === 0) return;

        const currentCard = this.filteredCards[this.currentIndex];
        if (!currentCard.isKnown) {
            currentCard.isKnown = false;
            this.incorrectCount++;
            this.updateStats();
            this.showFeedback('✗ Keep practicing! Moving to next card...', 'warning');
            setTimeout(() => this.nextCard(), 500);
        }
    }

    resetScore() {
        if (confirm('Reset score? This will not delete your flashcards.')) {
            this.correctCount = 0;
            this.incorrectCount = 0;
            this.flashcards.forEach(card => card.isKnown = false);
            this.updateStats();
            this.saveToLocalStorage();
        }
    }

    // ============================================
    // SHUFFLE
    // ============================================

    shuffle() {
        for (let i = this.filteredCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.filteredCards[i], this.filteredCards[j]] = [this.filteredCards[j], this.filteredCards[i]];
        }

        this.currentIndex = 0;
        this.isFlipped = false;
        this.updateCardDisplay();
        this.showFeedback('🔀 Cards shuffled!', 'info');
    }

    // ============================================
    // FILTERING
    // ============================================

    filterCards(category) {
        this.currentFilter = category;

        if (category === 'all') {
            this.filteredCards = [...this.flashcards];
        } else {
            this.filteredCards = this.flashcards.filter(card => card.category === category);
        }

        this.currentIndex = 0;
        this.isFlipped = false;

        // Update category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-category') === category) {
                btn.classList.add('active');
            }
        });

        this.updateUI();
    }

    updateCategoryFilter() {
        const filterContainer = this.categoryFilter;
        filterContainer.innerHTML = '';

        // Add "All" button
        const allBtn = document.createElement('button');
        allBtn.className = 'category-btn active';
        allBtn.setAttribute('data-category', 'all');
        allBtn.textContent = 'All';
        allBtn.addEventListener('click', () => this.filterCards('all'));
        filterContainer.appendChild(allBtn);

        // Add category buttons
        const sortedCategories = Array.from(this.categories).sort();
        sortedCategories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.setAttribute('data-category', category);
            btn.textContent = `${category} (${this.flashcards.filter(c => c.category === category).length})`;
            btn.addEventListener('click', () => this.filterCards(category));
            filterContainer.appendChild(btn);
        });
    }

    // ============================================
    // UI UPDATES
    // ============================================

    updateUI() {
        if (this.filteredCards.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.cardContainer.classList.add('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            this.cardContainer.classList.remove('hidden');
            this.updateCardDisplay();
        }

        this.updateStats();
        this.updateNavigationButtons();
    }

    updateCardDisplay() {
        if (this.filteredCards.length === 0) return;

        const card = this.filteredCards[this.currentIndex];

        this.questionText.textContent = card.question;
        this.answerText.textContent = card.answer;
        this.cardNumber.textContent = `${this.currentIndex + 1} / ${this.filteredCards.length}`;
        this.cardCategory.textContent = card.category;

        // Reset flip state
        this.flashcard.classList.remove('flipped');
        this.isFlipped = false;
    }

    updateStats() {
        this.totalCards.textContent = this.flashcards.length;
        this.correctCountElement.textContent = this.correctCount;
        this.incorrectCountElement.textContent = this.incorrectCount;
    }

    updateNavigationButtons() {
        const hasCards = this.filteredCards.length > 0;

        this.prevBtn.disabled = !hasCards;
        this.nextBtn.disabled = !hasCards;
        this.flipBtn.disabled = !hasCards;
        this.knownBtn.disabled = !hasCards;
        this.unknownBtn.disabled = !hasCards;
    }

    // ============================================
    // LOCAL STORAGE
    // ============================================

    saveToLocalStorage() {
        const data = {
            flashcards: this.flashcards,
            correctCount: this.correctCount,
            incorrectCount: this.incorrectCount
        };

        localStorage.setItem('flashcardAppData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('flashcardAppData');

        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.flashcards = parsed.flashcards || [];
                this.correctCount = parsed.correctCount || 0;
                this.incorrectCount = parsed.incorrectCount || 0;

                // Rebuild categories
                this.flashcards.forEach(card => {
                    this.categories.add(card.category);
                });

                // Initialize filtered cards
                this.filterCards('all');
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                this.flashcards = [];
            }
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to delete all flashcards and reset the score? This cannot be undone.')) {
            this.flashcards = [];
            this.filteredCards = [];
            this.categories.clear();
            this.currentIndex = 0;
            this.correctCount = 0;
            this.incorrectCount = 0;
            this.isFlipped = false;
            this.currentFilter = 'all';

            this.updateUI();
            this.updateCategoryFilter();
            this.saveToLocalStorage();
            this.showFeedback('All data cleared!', 'warning');
        }
    }

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================

    handleKeyboardShortcuts(e) {
        if (this.filteredCards.length === 0) return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.toggleFlip();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextCard();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousCard();
                break;
            case 'Enter':
                e.preventDefault();
                this.markAsKnown();
                break;
            case 'Backspace':
                e.preventDefault();
                this.markAsUnknown();
                break;
        }
    }

    // ============================================
    // FEEDBACK MESSAGES
    // ============================================

    showSuccessMessage(message) {
        this.showFeedback(message, 'success');
    }

    showFeedback(message, type = 'info') {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;

        const colors = {
            success: { bg: '#28a745', text: 'white' },
            warning: { bg: '#ffc107', text: '#333' },
            info: { bg: '#17a2b8', text: 'white' }
        };

        const color = colors[type] || colors.info;
        feedback.style.backgroundColor = color.bg;
        feedback.style.color = color.text;
        feedback.textContent = message;

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }
}

// ============================================
// INITIALIZE APP
// ============================================

let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new FlashcardApp();

    // Display keyboard shortcuts info (optional)
    console.log('Keyboard Shortcuts:');
    console.log('Space: Flip card');
    console.log('→: Next card');
    console.log('←: Previous card');
    console.log('Enter: Mark as Known');
    console.log('Backspace: Mark as Unknown');
});
