from flask import Flask, request, jsonify
import random
import re

app = Flask(__name__)

# Enable CORS manually without flask-cors
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# Quiz database with sample questions for different topics
QUIZ_DATABASE = {
    "python": [
        {
            "question": "What is the output of print(type([]))?",
            "options": ["<class 'list'>", "<class 'dict'>", "<class 'tuple'>", "<class 'set'>"],
            "correct_answer": 0,
            "explanation": "[] represents an empty list in Python, so type([]) returns <class 'list'>"
        },
        {
            "question": "Which keyword is used to create a function in Python?",
            "options": ["function", "def", "func", "define"],
            "correct_answer": 1,
            "explanation": "The 'def' keyword is used to define a function in Python"
        },
        {
            "question": "What does the len() function do?",
            "options": ["Returns length of object", "Deletes an object", "Creates a list", "Sorts items"],
            "correct_answer": 0,
            "explanation": "len() returns the number of items in an object like strings, lists, or tuples"
        }
    ],
    "mathematics": [
        {
            "question": "What is the value of π (pi) approximately?",
            "options": ["2.14", "3.14", "4.14", "5.14"],
            "correct_answer": 1,
            "explanation": "π (pi) is approximately 3.14159, commonly rounded to 3.14"
        },
        {
            "question": "What is 15% of 200?",
            "options": ["20", "25", "30", "35"],
            "correct_answer": 2,
            "explanation": "15% of 200 = (15/100) × 200 = 30"
        }
    ],
    "science": [
        {
            "question": "What is the chemical symbol for water?",
            "options": ["O2", "H2O", "CO2", "H2O2"],
            "correct_answer": 1,
            "explanation": "Water consists of 2 hydrogen atoms and 1 oxygen atom, hence H2O"
        },
        {
            "question": "What is the speed of light?",
            "options": ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
            "correct_answer": 0,
            "explanation": "Light travels at approximately 300,000 kilometers per second in a vacuum"
        }
    ]
}

def generate_ai_quiz(topic, difficulty, num_questions):
    """Generate quiz questions based on topic and difficulty"""
    # Normalize topic for database lookup
    topic_lower = topic.lower()
    
    # Check if we have questions for this topic
    questions = []
    
    # Find matching topics in database
    for key in QUIZ_DATABASE.keys():
        if key in topic_lower or topic_lower in key:
            questions.extend(QUIZ_DATABASE[key])
    
    # If no specific questions found, generate generic ones
    if not questions:
        questions = generate_generic_questions(topic, difficulty, num_questions)
    else:
        # Randomly select questions
        questions = random.sample(questions, min(num_questions, len(questions)))
        
        # If we need more questions, generate additional ones
        if len(questions) < num_questions:
            questions.extend(generate_generic_questions(topic, difficulty, num_questions - len(questions)))
    
    return questions[:num_questions]

def generate_generic_questions(topic, difficulty, num_questions):
    """Generate generic questions for any topic"""
    question_templates = [
        f"What is the main concept of {topic}?",
        f"Which of the following is true about {topic}?",
        f"What is an important application of {topic}?",
        f"What should you know about {topic}?",
        f"Which statement best describes {topic}?"
    ]
    
    questions = []
    for i in range(num_questions):
        template = random.choice(question_templates)
        questions.append({
            "question": template,
            "options": [
                f"Option A related to {topic}",
                f"Option B related to {topic}",
                f"Option C related to {topic}",
                f"Option D related to {topic}"
            ],
            "correct_answer": random.randint(0, 3),
            "explanation": f"This is a general question about {topic}. The correct answer demonstrates understanding of the core concepts."
        })
    
    return questions

def summarize_text(text):
    """Simple text summarization using extractive method"""
    # Split into sentences
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) <= 3:
        return text
    
    # Simple scoring: prefer sentences with more words (but not too long)
    scored_sentences = []
    for sentence in sentences:
        word_count = len(sentence.split())
        # Prefer sentences with 10-25 words
        if 10 <= word_count <= 25:
            score = word_count
        else:
            score = word_count * 0.5
        scored_sentences.append((sentence, score))
    
    # Sort by score and take top sentences
    scored_sentences.sort(key=lambda x: x[1], reverse=True)
    num_sentences = max(3, len(sentences) // 3)
    top_sentences = scored_sentences[:num_sentences]
    
    # Reorder by original appearance
    summary_sentences = []
    for sentence in sentences:
        if any(sentence == s[0] for s in top_sentences):
            summary_sentences.append(sentence)
    
    return '. '.join(summary_sentences) + '.'

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    """API endpoint to generate quiz"""
    data = request.json
    topic = data.get('topic', '')
    difficulty = data.get('difficulty', 'medium')
    num_questions = data.get('num_questions', 5)
    
    if not topic:
        return jsonify({'error': 'Topic is required'}), 400
    
    questions = generate_ai_quiz(topic, difficulty, num_questions)
    
    return jsonify({
        'questions': questions,
        'topic': topic,
        'difficulty': difficulty
    })

@app.route('/summarize', methods=['POST'])
def summarize():
    """API endpoint to summarize text"""
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    summary = summarize_text(text)
    
    return jsonify({
        'summary': summary,
        'original_length': len(text),
        'summary_length': len(summary)
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Smart Education AI API is running'})

@app.route('/generate-flashcards', methods=['POST'])
def generate_flashcards():
    """API endpoint to generate flashcards"""
    data = request.json
    topic = data.get('topic', '')
    content = data.get('content', '')
    num_cards = data.get('num_cards', 5)
    
    if not topic:
        return jsonify({'error': 'Topic is required'}), 400
    
    flashcards = []
    
    if content:
        # Generate from content
        sentences = re.split(r'[.!?]+', content)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        for i in range(min(num_cards, len(sentences))):
            sentence = sentences[i]
            words = sentence.split()
            if len(words) > 5:
                # Create question by removing key word
                key_word = random.choice([w for w in words if len(w) > 4])
                question = sentence.replace(key_word, '____')
                flashcards.append({
                    'question': question,
                    'answer': key_word
                })
    else:
        # Generate generic flashcards for topic
        question_templates = [
            f"What is the definition of {topic}?",
            f"What are the key concepts in {topic}?",
            f"How does {topic} work?",
            f"What are the applications of {topic}?",
            f"What should you remember about {topic}?"
        ]
        
        for i in range(num_cards):
            flashcards.append({
                'question': question_templates[i % len(question_templates)],
                'answer': f"Key concept {i+1} related to {topic}"
            })
    
    return jsonify({'flashcards': flashcards, 'topic': topic})

@app.route('/tutor-chat', methods=['POST'])
def tutor_chat():
    """AI Tutor chat endpoint"""
    data = request.json
    question = data.get('question', '')
    
    if not question:
        return jsonify({'error': 'Question is required'}), 400
    
    # Simple response generation
    question_lower = question.lower()
    
    if any(word in question_lower for word in ['what is', 'define', 'meaning']):
        answer = f"That's a great question! Based on your query, let me explain: This concept is fundamental to understanding the subject. I recommend breaking it down into smaller parts and studying each component individually."
    elif any(word in question_lower for word in ['how', 'explain']):
        answer = f"Good question! Let me walk you through this step by step: First, understand the basic principle. Then, look at practical examples. Finally, practice applying it to different scenarios."
    elif any(word in question_lower for word in ['why', 'reason']):
        answer = f"Excellent question! The reasoning behind this is important. This happens because of several factors working together. Understanding the 'why' helps you remember the 'what' more effectively."
    elif any(word in question_lower for word in ['help', 'stuck', 'difficult']):
        answer = f"Don't worry, everyone struggles sometimes! Here's my advice: Take a break, then come back fresh. Try explaining the concept to someone else or writing it down in your own words. Sometimes a different perspective helps!"
    else:
        answer = f"That's an interesting question! To answer it properly, I'd need to consider the context and break it down. Start by reviewing the fundamental concepts, then build up to more complex ideas. Would you like me to explain any specific part?"
    
    return jsonify({'answer': answer})

@app.route('/generate-study-plan', methods=['POST'])
def generate_study_plan():
    """Generate a personalized study plan"""
    data = request.json
    exam_date = data.get('exam_date', '')
    subjects = data.get('subjects', '')
    daily_hours = data.get('daily_hours', 3)
    
    if not exam_date or not subjects:
        return jsonify({'error': 'Exam date and subjects are required'}), 400
    
    from datetime import datetime
    
    try:
        exam = datetime.strptime(exam_date, '%Y-%m-%d')
        today = datetime.now()
        days_until_exam = (exam - today).days
    except:
        days_until_exam = 7
    
    subject_list = [s.strip() for s in subjects.split(',')]
    
    plan = []
    activities = ['Review notes', 'Practice problems', 'Watch video lectures', 'Make flashcards', 
                  'Take practice quiz', 'Group study', 'Review mistakes', 'Teach concept to someone']
    
    days_to_plan = min(days_until_exam, 14)  # Plan for up to 2 weeks
    
    for i in range(days_to_plan):
        day_num = i + 1
        subject = subject_list[i % len(subject_list)]
        
        num_tasks = min(int(daily_hours), len(activities))
        day_activities = random.sample(activities, num_tasks)
        
        tasks = [f"{subject}: {activity} ({daily_hours // num_tasks}h)" for activity in day_activities[:num_tasks]]
        
        plan.append({
            'day': f'Day {day_num} ({subject})',
            'tasks': tasks
        })
    
    return jsonify({'plan': plan, 'total_days': days_to_plan})

@app.route('/extract-vocabulary', methods=['POST'])
def extract_vocabulary():
    """Extract vocabulary from text"""
    data = request.json
    text = data.get('text', '')
    difficulty = data.get('difficulty', 'all')
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    # Extract words
    words = re.findall(r'\b[a-zA-Z]{5,}\b', text)
    unique_words = list(set(words))
    
    # Filter by difficulty (simple heuristic: word length)
    if difficulty == 'intermediate':
        filtered_words = [w for w in unique_words if 6 <= len(w) <= 10]
    elif difficulty == 'advanced':
        filtered_words = [w for w in unique_words if len(w) > 10]
    else:
        filtered_words = unique_words
    
    # Sort and take top words
    filtered_words.sort(key=len, reverse=True)
    top_words = filtered_words[:20]
    
    # Generate simple definitions
    vocabulary = []
    for word in top_words:
        vocabulary.append({
            'word': word.capitalize(),
            'definition': f'A key term related to the subject. Review this concept and understand its meaning in context.'
        })
    
    return jsonify({'vocabulary': vocabulary, 'total_words': len(vocabulary)})

if __name__ == '__main__':
    print("🎓 Smart Education AI Backend Starting...")
    print("📚 Server running on http://localhost:5001")
    print("✅ Ready to accept requests!")
    app.run(debug=True, port=5001)