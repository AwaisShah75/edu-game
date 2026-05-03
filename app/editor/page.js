"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Editor() {
  const [questions, setQuestions] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const stored = sessionStorage.getItem("eduplay_questions");
    if (stored) {
      setQuestions(JSON.parse(stored));
    } else {
      // If no questions, redirect home
      router.push("/");
    }
  }, [router]);

  const deleteQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateWrongOption = (id, index, value) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const newWrongOptions = [...q.wrongOptions];
          newWrongOptions[index] = value;
          return { ...q, wrongOptions: newWrongOptions };
        }
        return q;
      })
    );
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      question: "New custom question",
      correctAnswer: "Correct answer",
      wrongOptions: ["Wrong 1", "Wrong 2", "Wrong 3"],
    };
    setQuestions([...questions, newQuestion]);
  };

  const proceedToGame = () => {
    sessionStorage.setItem("eduplay_questions", JSON.stringify(questions));
    router.push("/games");
  };

  if (!isClient) return null;

  return (
    <main className="editor-container">
      <div className="editor-header">
        <h2>Review {questions.length} Questions</h2>
        <button className="btn btn-secondary" onClick={proceedToGame}>
          Choose Game 🎮
        </button>
      </div>

      <div className="mb-4">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="question-card">
            <div className="question-row">
              <input
                className="input-field question-text"
                value={q.question}
                onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
              />
              <div className="question-actions">
                <button
                  className="action-btn delete"
                  onClick={() => deleteQuestion(q.id)}
                  title="Delete Question"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="options-grid">
              <div className="option-item correct">
                <span className="mr-2">✅</span>
                <input
                  className="input-field"
                  style={{ marginBottom: 0, border: "none", background: "transparent" }}
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(q.id, "correctAnswer", e.target.value)}
                />
              </div>

              {q.wrongOptions.map((opt, i) => (
                <div key={i} className="option-item wrong">
                  <span className="mr-2">❌</span>
                  <input
                    className="input-field"
                    style={{ marginBottom: 0, border: "none", background: "transparent" }}
                    value={opt}
                    onChange={(e) => updateWrongOption(q.id, i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button className="btn btn-accent mb-4" onClick={addQuestion}>
          ➕ Add Question
        </button>
      </div>
    </main>
  );
}
