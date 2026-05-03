"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FlashcardsGame() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = sessionStorage.getItem("eduplay_questions");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) {
        setQuestions(parsed);
      } else {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const handleCardTap = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentIndex < questions.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150); // Small delay for animation
    } else {
      alert("All cards reviewed! Great job!");
      router.push("/games");
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 150);
    }
  };

  const exitGame = () => {
    if (confirm("Are you sure you want to exit the game?")) {
      router.push("/games");
    }
  };

  if (!isClient || questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  return (
    <>
      <div className="game-header">
        <button className="exit-btn" onClick={exitGame} title="Exit Game">🚪</button>
        <div className="question-counter">
          Card {currentIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="game-content" style={{ perspective: "1000px" }}>
        
        <div 
          className={`flashcard ${isFlipped ? "flipped" : ""}`} 
          onClick={handleCardTap}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <span className="flashcard-label">QUESTION</span>
              <h2 className="flashcard-text">{currentQ.question}</h2>
              <div className="tap-hint">Tap to flip 🔄</div>
            </div>
            
            <div className="flashcard-back">
              <span className="flashcard-label">ANSWER</span>
              <h2 className="flashcard-text correct-color">{currentQ.correctAnswer}</h2>
              <div className="tap-hint">Tap to flip back 🔄</div>
            </div>
          </div>
        </div>

        <div className="flashcard-controls">
          <button 
            className="btn btn-secondary" 
            onClick={prevCard} 
            disabled={currentIndex === 0}
            style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
          >
            ⬅️ Previous
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={nextCard}
          >
            {currentIndex < questions.length - 1 ? "Next Card ➡️" : "Finish 🏆"}
          </button>
        </div>

      </div>
    </>
  );
}
