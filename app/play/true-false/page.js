"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TrueFalseGame() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // State for the generated True/False scenario
  const [statementIsActuallyTrue, setStatementIsActuallyTrue] = useState(true);
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  
  // State for interaction
  const [selectedAnswer, setSelectedAnswer] = useState(null); // 'true' or 'false'
  const [revealState, setRevealState] = useState(false);
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

  // Generate T/F scenario for current question
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const q = questions[currentIndex];
      
      // 50/50 chance to be true or false
      const isTrue = Math.random() > 0.5;
      setStatementIsActuallyTrue(isTrue);
      
      if (isTrue) {
        setDisplayedAnswer(q.correctAnswer);
      } else {
        // Pick a random wrong option
        const randomWrong = q.wrongOptions[Math.floor(Math.random() * q.wrongOptions.length)];
        setDisplayedAnswer(randomWrong);
      }
      
      setSelectedAnswer(null);
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

  const handleTap = (pickedTrue) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(pickedTrue);
    
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
    
    // 1.5s delay before reveal
    setTimeout(() => {
      setRevealState(true);
      const isCorrectChoice = pickedTrue === statementIsActuallyTrue;
      playTone(isCorrectChoice);
    }, 1500);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
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
  const isFinished = selectedAnswer !== null && revealState === true;
  
  // Determine button styles based on state
  const getBtnClass = (isTrueBtn) => {
    let base = `tf-btn ${isTrueBtn ? "true-btn" : "false-btn"}`;
    
    if (selectedAnswer === null) return base; // Initial state
    
    const isSelected = selectedAnswer === isTrueBtn;
    const isCorrectChoice = isTrueBtn === statementIsActuallyTrue;
    
    if (!revealState) {
      // Waiting phase
      if (isSelected) return base + " selected-waiting";
      return base + " dimmed";
    }
    
    // Reveal phase
    if (isCorrectChoice) {
      return base + " correct-reveal"; // from globals.css animation
    } else if (isSelected && !isCorrectChoice) {
      return base + " wrong-reveal"; // they picked the wrong one
    } else {
      return base + " dimmed"; // the incorrect option they didn't pick
    }
  };

  return (
    <>
      <div className="game-header">
        <button className="exit-btn" onClick={exitGame} title="Exit Game">🚪</button>
        <div className="question-counter">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="game-content">
        <h1 className="huge-question mb-2" style={{ color: "var(--text-light)", fontSize: "3rem" }}>
          {currentQ.question}
        </h1>
        
        <div className="huge-question" style={{ fontSize: "3.5rem", color: "var(--primary)" }}>
          {displayedAnswer}
        </div>

        <div className="tf-container">
          <button 
            className={getBtnClass(true)} 
            onClick={() => handleTap(true)}
            disabled={selectedAnswer !== null}
          >
            {revealState && selectedAnswer === true ? (
              true === statementIsActuallyTrue ? "✅ TRUE" : "❌ TRUE"
            ) : "TRUE"}
          </button>
          <button 
            className={getBtnClass(false)} 
            onClick={() => handleTap(false)}
            disabled={selectedAnswer !== null}
          >
            {revealState && selectedAnswer === false ? (
              false === statementIsActuallyTrue ? "✅ FALSE" : "❌ FALSE"
            ) : "FALSE"}
          </button>
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
