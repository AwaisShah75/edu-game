"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function QuizGame() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  
  // States for interaction
  const [selectedOption, setSelectedOption] = useState(null);
  const [revealState, setRevealState] = useState(false); // true when the 1s delay is over
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

  // Setup current question options (shuffle them)
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const q = questions[currentIndex];
      const allOptions = [
        { text: q.correctAnswer, isCorrect: true },
        ...q.wrongOptions.map(opt => ({ text: opt, isCorrect: false }))
      ];
      // Shuffle using Fisher-Yates
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }
      setOptions(allOptions);
      setSelectedOption(null);
      setRevealState(false);
    }
  }, [currentIndex, questions]);

  const playTone = (isCorrect) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (isCorrect) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      }
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) {
      console.log("Audio not supported");
    }
  };

  const handleOptionTap = (optIndex) => {
    if (selectedOption !== null) return; // Prevent double taps

    setSelectedOption(optIndex);
    
    // Play a tiny neutral blip on click (initializes audio context)
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
    
    // 1-second delay before reveal
    setTimeout(() => {
      setRevealState(true);
      const isCorrectChoice = options[optIndex].isCorrect;
      playTone(isCorrectChoice);
    }, 1500); // 1.5 seconds builds great suspense!
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // End of game
      alert("Game Over! Great job class!");
      router.push("/games");
    }
  };

  const exitGame = () => {
    if (confirm("Are you sure you want to exit the game?")) {
      router.push("/games");
    }
  };

  if (!isClient || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const isFinished = selectedOption !== null && revealState === true;

  return (
    <>
      <div className="game-header">
        <button className="exit-btn" onClick={exitGame} title="Exit Game">🚪</button>
        <div className="question-counter">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="game-content">
        <h1 className="huge-question">{currentQ.question}</h1>

        <div className="quiz-options">
          {options.map((opt, idx) => {
            let btnClass = "quiz-btn";
            
            if (selectedOption === idx) {
              if (!revealState) {
                btnClass += " selected-waiting"; // Yellow waiting state
              } else {
                btnClass += opt.isCorrect ? " correct-reveal" : " wrong-reveal";
              }
            } else if (revealState && opt.isCorrect) {
              // Highlight the correct answer even if they picked wrong
              btnClass += " correct-reveal";
            }

            return (
              <button
                key={idx}
                className={btnClass}
                onClick={() => handleOptionTap(idx)}
                disabled={selectedOption !== null} // Disable all after one tap
              >
                {revealState && (selectedOption === idx || opt.isCorrect) ? (
                  opt.isCorrect ? "✅ " + opt.text : "❌ " + opt.text
                ) : opt.text}
              </button>
            );
          })}
        </div>

        <div className="next-action-container">
          {isFinished && (
            <button className="btn btn-secondary" style={{ fontSize: '2rem' }} onClick={nextQuestion}>
              {currentIndex < questions.length - 1 ? "Next Question ➡️" : "Finish Game 🏆"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
