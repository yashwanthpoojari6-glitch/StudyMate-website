// services/geminiService.js — Google Gemini AI wrapper service
// Centralizes all AI interactions with consistent prompting and error handling.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini client once (singleton pattern for efficiency)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-1.5-flash for cost-efficiency with high throughput
const getModel = () => genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ── Shared system persona — injected into every prompt ────────────────────────
const SYSTEM_PERSONA = `You are StudyMate AI — an empathetic, razor-sharp Academic Copilot 
for college students. You are concise, encouraging, and academically rigorous. 
You format all responses in clean Markdown. Never include disclaimers or unnecessary fluff.`;

// ── Summarize note content ─────────────────────────────────────────────────────
const summarizeNote = async (noteContent, noteTitle) => {
  const model = getModel();
  const prompt = `${SYSTEM_PERSONA}

Summarize the following study note titled "${noteTitle}" into a concise, structured summary.
Use bullet points for key takeaways. Include a "Key Concepts" section at the end.

Note content:
---
${noteContent}
---`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ── Extract key terms from note ───────────────────────────────────────────────
const extractKeyTerms = async (noteContent, noteTitle) => {
  const model = getModel();
  const prompt = `${SYSTEM_PERSONA}

From the study note titled "${noteTitle}", extract all important key terms, concepts, formulas, 
and definitions. Format as a Markdown table with columns: | Term | Brief Definition |

Note content:
---
${noteContent}
---`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ── Generate flashcard deck from note content ──────────────────────────────────
const generateFlashcards = async (noteContent, noteTitle, count = 10) => {
  const model = getModel();
  const prompt = `${SYSTEM_PERSONA}

Generate exactly ${count} high-quality flashcard Q&A pairs from this study note titled "${noteTitle}".

IMPORTANT: Respond ONLY with a valid JSON array. No markdown, no explanation, no backticks.
Format: [{"question": "...", "answer": "..."}, ...]

Cover a mix of: definitions, formulas, conceptual understanding, and application questions.

Note content:
---
${noteContent}
---`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip any accidental markdown code fences
  const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned malformed flashcard data. Please try again.');
  }
};

// ── Chat with AI about a topic ────────────────────────────────────────────────
const chatWithAI = async (messages, context = '') => {
  const model = getModel();

  // Build conversation history for multi-turn context
  const chatHistory = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content || msg.text || '' }],
  }));

  const chat = model.startChat({
    history: chatHistory,
    systemInstruction: SYSTEM_PERSONA + (context ? `\n\nContext: ${context}` : ''),
  });

  const lastMessage = messages[messages.length - 1];
  const lastContent = lastMessage.content || lastMessage.text || '';
  const result = await chat.sendMessage(lastContent);
  return result.response.text();
};

// ── Generate practice quiz questions from note content ────────────────────────
const generateQuiz = async (noteContent, noteTitle, count = 5) => {
  const model = getModel();
  const prompt = `${SYSTEM_PERSONA}

Generate a practice quiz with exactly ${count} multiple-choice questions based on the study note titled "${noteTitle}".

IMPORTANT: Respond ONLY with a valid JSON array. No markdown fences, no explanatory text.
Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Clear explanation of why this answer is correct."
  }
]

Note content:
---
${noteContent}
---`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned malformed quiz data. Please try again.');
  }
};

// ── Generate a study plan for an exam ────────────────────────────────────────
const generateStudyPlan = async (subjectTitle, chapters, daysUntilExam) => {
  const model = getModel();
  const chapterList = chapters.map((c, i) => `${i + 1}. ${c.name}${c.isCompleted ? ' ✅' : ''}`).join('\n');

  const prompt = `${SYSTEM_PERSONA}

Create a structured ${daysUntilExam}-day study plan for the subject "${subjectTitle}".
The exam is in ${daysUntilExam} days.

Chapters to cover (✅ = already completed):
${chapterList}

Provide a day-by-day Markdown plan. For completed chapters, schedule quick revision sessions only.
Include daily time estimates and study tips.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = {
  summarizeNote,
  extractKeyTerms,
  generateFlashcards,
  generateQuiz,
  chatWithAI,
  generateStudyPlan,
};
