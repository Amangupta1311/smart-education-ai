# 🎓 Smart Education AI Platform

An AI-powered educational platform with quiz generation, study material summarization, and progress tracking.

## Features

- **AI Quiz Generator**: Create personalized quizzes on any topic
- **Smart Summarizer**: Get concise summaries of study materials
- **Progress Tracking**: Monitor your learning journey with detailed statistics
- **Personalized Learning**: AI-powered recommendations based on your performance

## Project Structure

```
smart-education-ai/
│
├── index.html          # Main HTML file
├── styles.css          # Styling
├── script.js           # Frontend JavaScript
├── app.py              # Python Flask backend
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Setup Instructions

### Step 1: Install Python Dependencies

Open your terminal in VS Code and run:

```bash
pip install -r requirements.txt
```

### Step 2: Start the Python Backend

Run the Flask server:

```bash
python app.py
```

You should see:
```
🎓 Smart Education AI Backend Starting...
📚 Server running on http://localhost:5000
✅ Ready to accept requests!
```

### Step 3: Open the Frontend

1. Right-click on `index.html` in VS Code
2. Select "Open with Live Server" (if you have the Live Server extension)
   
   OR
   
   Simply open `index.html` in your web browser

## Usage Guide

### AI Quiz Generator

1. Navigate to the "AI Quiz" tab
2. Enter a topic (e.g., "Python Programming", "World History")
3. Select difficulty level (Easy, Medium, Hard)
4. Choose number of questions (1-10)
5. Click "Generate Quiz"
6. Answer the questions and submit to see your results

### Smart Summarizer

1. Go to the "Summarizer" tab
2. Paste your study material in the text area
3. Click "Summarize"
4. Review the concise summary

### Progress Tracking

1. Check the "Progress" tab to see:
   - Total quizzes completed
   - Average score
   - Topics studied
   - Study time
   - Recent activity log

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python Flask
- **AI Features**: Custom quiz generation and text summarization algorithms
- **Storage**: Browser LocalStorage for progress tracking

## API Endpoints

### POST `/generate-quiz`
Generate quiz questions for a given topic

**Request Body:**
```json
{
  "topic": "Python Programming",
  "difficulty": "medium",
  "num_questions": 5
}
```

### POST `/summarize`
Summarize study material

**Request Body:**
```json
{
  "text": "Your long study material text here..."
}
```

### GET `/health`
Health check endpoint

## Customization

### Adding More Quiz Questions

Edit `app.py` and add questions to the `QUIZ_DATABASE` dictionary:

```python
QUIZ_DATABASE = {
    "your_topic": [
        {
            "question": "Your question?",
            "options": ["A", "B", "C", "D"],
            "correct_answer": 0,  # Index of correct answer
            "explanation": "Why this is correct"
        }
    ]
}
```

### Styling

Modify `styles.css` to change colors, layouts, and animations.

## Troubleshooting

**Problem**: Quiz generation fails
- **Solution**: Make sure the Python backend is running on port 5000

**Problem**: CORS errors
- **Solution**: Flask-CORS is installed and configured in app.py

**Problem**: Progress not saving
- **Solution**: Check if browser localStorage is enabled

## Future Enhancements

- Integration with OpenAI API for advanced AI features
- Video learning recommendations
- Collaborative study rooms
- Mobile app version
- Advanced analytics dashboard

## License

MIT License - Feel free to use and modify for your projects!

## Support

For issues or questions, please create an issue in the project repository.

---

Made with ❤️ for learners everywhere