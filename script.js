// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
    });
});

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// Progress tracking
let userProgress = {
    quizzesCompleted: 0,
    totalScore: 0,
    topicsStudied: new Set(),
    activities: [],
    studyTime: 0
};

// Load progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('smartEducationProgress');
    if (saved) {
        const parsed = JSON.parse(saved);
        userProgress = {
            ...parsed,
            topicsStudied: new Set(parsed.topicsStudied)
        };
        updateProgressDisplay();
    }
}

function saveProgress() {
    const toSave = {
        ...userProgress,
        topicsStudied: Array.from(userProgress.topicsStudied)
    };
    localStorage.setItem('smartEducationProgress', JSON.stringify(toSave));
}

function updateProgressDisplay() {
    document.getElementById('quizzes-completed').textContent = userProgress.quizzesCompleted;
    const avgScore = userProgress.quizzesCompleted > 0 
        ? Math.round(userProgress.totalScore / userProgress.quizzesCompleted) 
        : 0;
    document.getElementById('avg-score').textContent = avgScore + '%';
    document.getElementById('topics-studied').textContent = userProgress.topicsStudied.size;
    document.getElementById('study-time').textContent = Math.round(userProgress.studyTime / 60) + 'h';
    
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = userProgress.activities.slice(-5).reverse().map(activity => 
        `<div class="activity-item">${activity}</div>`
    ).join('') || '<p>No recent activity</p>';
}

function addActivity(activity) {
    const timestamp = new Date().toLocaleString();
    userProgress.activities.push(`${timestamp}: ${activity}`);
    saveProgress();
    updateProgressDisplay();
}

// Quiz Generator
const generateQuizBtn = document.getElementById('generate-quiz');
const quizContainer = document.getElementById('quiz-container');
const quizQuestions = document.getElementById('quiz-questions');
const submitQuizBtn = document.getElementById('submit-quiz');
const quizResults = document.getElementById('quiz-results');

let currentQuiz = [];

generateQuizBtn.addEventListener('click', async () => {
    const topic = document.getElementById('topic').value.trim();
    const difficulty = document.getElementById('difficulty').value;
    const numQuestions = parseInt(document.getElementById('num-questions').value);

    if (!topic) {
        alert('Please enter a topic');
        return;
    }

    showLoading(true);
    
    try {
        const response = await fetch('http://localhost:5001/generate-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, difficulty, num_questions: numQuestions })
        });

        const data = await response.json();
        currentQuiz = data.questions;
        
        displayQuiz(currentQuiz);
        quizContainer.classList.remove('hidden');
        quizResults.classList.add('hidden');
        
        userProgress.topicsStudied.add(topic);
        addActivity(`Generated quiz on ${topic} (${difficulty})`);
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating quiz. Make sure the Python server is running.');
    } finally {
        showLoading(false);
    }
});

function displayQuiz(questions) {
    quizQuestions.innerHTML = questions.map((q, index) => `
        <div class="quiz-question" data-index="${index}">
            <h4>Question ${index + 1}: ${q.question}</h4>
            ${q.options.map((option, optIndex) => `
                <label class="quiz-option">
                    <input type="radio" name="q${index}" value="${optIndex}">
                    ${option}
                </label>
            `).join('')}
        </div>
    `).join('');
}

submitQuizBtn.addEventListener('click', () => {
    let score = 0;
    const answers = [];
    
    currentQuiz.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected) {
            const userAnswer = parseInt(selected.value);
            answers.push(userAnswer);
            if (userAnswer === q.correct_answer) {
                score++;
            }
        } else {
            answers.push(-1);
        }
    });

    const percentage = Math.round((score / currentQuiz.length) * 100);
    
    userProgress.quizzesCompleted++;
    userProgress.totalScore += percentage;
    userProgress.studyTime += 10; // Add 10 minutes per quiz
    saveProgress();
    updateProgressDisplay();
    
    addActivity(`Completed quiz - Score: ${percentage}%`);
    
    quizResults.innerHTML = `
        <h3>Quiz Results</h3>
        <p style="font-size: 1.5rem; color: #667eea; font-weight: bold;">
            Score: ${score}/${currentQuiz.length} (${percentage}%)
        </p>
        <div style="margin-top: 1rem;">
            ${currentQuiz.map((q, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === q.correct_answer;
                return `
                    <div style="padding: 1rem; margin-bottom: 1rem; background: ${isCorrect ? '#e6ffed' : '#ffe6e6'}; border-radius: 5px;">
                        <strong>Q${index + 1}:</strong> ${q.question}<br>
                        <strong>Your answer:</strong> ${userAnswer >= 0 ? q.options[userAnswer] : 'Not answered'}<br>
                        <strong>Correct answer:</strong> ${q.options[q.correct_answer]}<br>
                        ${!isCorrect ? `<strong>Explanation:</strong> ${q.explanation}` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    quizResults.classList.remove('hidden');
});

// Summarizer
const summarizeBtn = document.getElementById('summarize-btn');
const textInput = document.getElementById('text-input');
const summaryResult = document.getElementById('summary-result');
const summaryContent = document.getElementById('summary-content');

summarizeBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    
    if (!text) {
        alert('Please paste some text to summarize');
        return;
    }

    showLoading(true);
    
    try {
        const response = await fetch('http://localhost:5001/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        
        summaryContent.innerHTML = `<p>${data.summary}</p>`;
        summaryResult.classList.remove('hidden');
        
        userProgress.studyTime += 5; // Add 5 minutes for summarizing
        addActivity('Summarized study material');
        saveProgress();
        updateProgressDisplay();
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating summary. Make sure the Python server is running.');
    } finally {
        showLoading(false);
    }
});

// Loading indicator
function showLoading(show) {
    document.getElementById('loading').classList.toggle('hidden', !show);
}

// Initialize
loadProgress();
updateProgressDisplay();

// Flashcard Generator
const generateFlashcardsBtn = document.getElementById('generate-flashcards');
const flashcardDisplay = document.getElementById('flashcard-display');
const flipCardBtn = document.getElementById('flip-card');
const prevCardBtn = document.getElementById('prev-card');
const nextCardBtn = document.getElementById('next-card');

let flashcards = [];
let currentCardIndex = 0;

generateFlashcardsBtn.addEventListener('click', async () => {
    const topic = document.getElementById('flashcard-topic').value.trim();
    const content = document.getElementById('flashcard-content').value.trim();
    const numCards = parseInt(document.getElementById('num-flashcards').value);

    if (!topic) {
        alert('Please enter a topic');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('http://localhost:5001/generate-flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, content, num_cards: numCards })
        });

        const data = await response.json();
        flashcards = data.flashcards;
        currentCardIndex = 0;

        displayFlashcard();
        flashcardDisplay.classList.remove('hidden');
        
        addActivity(`Generated ${numCards} flashcards on ${topic}`);
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating flashcards. Make sure the server is running.');
    } finally {
        showLoading(false);
    }
});

function displayFlashcard() {
    if (flashcards.length === 0) return;

    const card = flashcards[currentCardIndex];
    document.getElementById('flashcard-question').textContent = card.question;
    document.getElementById('flashcard-answer').textContent = card.answer;
    document.getElementById('card-counter').textContent = `${currentCardIndex + 1} / ${flashcards.length}`;
    
    // Reset to front
    document.querySelector('.flashcard-front').classList.remove('hidden');
    document.querySelector('.flashcard-back').classList.add('hidden');
}

flipCardBtn.addEventListener('click', () => {
    document.querySelector('.flashcard-front').classList.toggle('hidden');
    document.querySelector('.flashcard-back').classList.toggle('hidden');
});

prevCardBtn.addEventListener('click', () => {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        displayFlashcard();
    }
});

nextCardBtn.addEventListener('click', () => {
    if (currentCardIndex < flashcards.length - 1) {
        currentCardIndex++;
        displayFlashcard();
    }
});

// AI Tutor Chat
const tutorInput = document.getElementById('tutor-input');
const sendQuestionBtn = document.getElementById('send-question');
const chatHistory = document.getElementById('chat-history');

sendQuestionBtn.addEventListener('click', sendMessage);
tutorInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
    const question = tutorInput.value.trim();
    
    if (!question) return;

    // Display user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user-message';
    userMsg.innerHTML = `<strong>You:</strong> ${question}`;
    chatHistory.appendChild(userMsg);
    
    tutorInput.value = '';
    chatHistory.scrollTop = chatHistory.scrollHeight;

    showLoading(true);

    try {
        const response = await fetch('http://localhost:5001/tutor-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });

        const data = await response.json();

        // Display bot response
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-message bot-message';
        botMsg.innerHTML = `<strong>AI Tutor:</strong> ${data.answer}`;
        chatHistory.appendChild(botMsg);
        
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        addActivity('Asked AI Tutor a question');
    } catch (error) {
        console.error('Error:', error);
        alert('Error contacting AI Tutor. Make sure the server is running.');
    } finally {
        showLoading(false);
    }
}

// Study Planner
const generatePlanBtn = document.getElementById('generate-plan');
const studyPlanResult = document.getElementById('study-plan-result');
const planContent = document.getElementById('plan-content');

generatePlanBtn.addEventListener('click', async () => {
    const examDate = document.getElementById('exam-date').value;
    const subjects = document.getElementById('subjects').value.trim();
    const studyHours = parseInt(document.getElementById('study-hours').value);

    if (!examDate || !subjects) {
        alert('Please fill in exam date and subjects');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('http://localhost:5001/generate-study-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exam_date: examDate, subjects, daily_hours: studyHours })
        });

        const data = await response.json();

        planContent.innerHTML = data.plan.map(day => `
            <div class="plan-day">
                <h4>${day.day}</h4>
                ${day.tasks.map(task => `<div class="plan-task">• ${task}</div>`).join('')}
            </div>
        `).join('');

        studyPlanResult.classList.remove('hidden');
        
        addActivity('Generated study plan');
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating study plan. Make sure the server is running.');
    } finally {
        showLoading(false);
    }
});

// Vocabulary Builder
const extractVocabBtn = document.getElementById('extract-vocab');
const vocabResult = document.getElementById('vocab-result');
const vocabList = document.getElementById('vocab-list');

extractVocabBtn.addEventListener('click', async () => {
    const text = document.getElementById('vocab-text').value.trim();
    const difficulty = document.getElementById('difficulty-level').value;

    if (!text) {
        alert('Please paste some text');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('http://localhost:5001/extract-vocabulary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, difficulty })
        });

        const data = await response.json();

        vocabList.innerHTML = data.vocabulary.map(item => `
            <div class="vocab-item">
                <div class="vocab-word">${item.word}</div>
                <div class="vocab-definition">${item.definition}</div>
            </div>
        `).join('');

        vocabResult.classList.remove('hidden');
        
        addActivity('Extracted vocabulary from text');
    } catch (error) {
        console.error('Error:', error);
        alert('Error extracting vocabulary. Make sure the server is running.');
    } finally {
        showLoading(false);
    }
});