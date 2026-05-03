"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WheelGame() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [isClient, setIsClient] = useState(false);
  
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedQ, setSelectedQ] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = sessionStorage.getItem("eduplay_questions");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) {
        // Max 12 slices for visual clarity
        setQuestions(parsed.slice(0, 12));
      } else {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const spinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setShowModal(false);
    setSelectedQ(null);

    // Play spinning sound
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 3);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 3);
    } catch(e) {}

    const slices = questions.length;
    const sliceAngle = 360 / slices;
    
    // Pick a random question index
    const winningIndex = Math.floor(Math.random() * slices);
    
    // Calculate rotation to land on the winning index
    // Note: The pointer is at the top (0 degrees). 
    // We add 5 extra full rotations (1800deg) for effect.
    const extraSpins = 360 * 5;
    // To land on winningIndex, the wheel needs to rotate such that the winning slice is at the top.
    const targetRotation = rotation + extraSpins + (360 - (winningIndex * sliceAngle));
    
    setRotation(targetRotation);

    // Wait for transition to finish (3 seconds)
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedQ(questions[winningIndex]);
      setShowModal(true);
      setShowAnswer(false);
      
      // Tada sound
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch(e) {}
    }, 3000);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const exitGame = () => {
    if (confirm("Are you sure you want to exit the game?")) {
      router.push("/games");
    }
  };

  if (!isClient || questions.length === 0) return null;

  return (
    <>
      <div className="game-header">
        <button className="exit-btn" onClick={exitGame} title="Exit Game">🚪</button>
        <div className="question-counter">
          Spin the Wheel!
        </div>
      </div>

      <div className="game-content center-flex">
        
        <div className="wheel-container">
          <div className="wheel-pointer">▼</div>
          <div 
            className="wheel" 
            style={{ 
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(
                var(--primary) 0 30deg, 
                var(--secondary) 30deg 60deg, 
                var(--accent) 60deg 90deg,
                #FF1493 90deg 120deg,
                #1E90FF 120deg 150deg,
                #8A2BE2 150deg 180deg,
                var(--primary) 180deg 210deg,
                var(--secondary) 210deg 240deg,
                var(--accent) 240deg 270deg,
                #FF1493 270deg 300deg,
                #1E90FF 300deg 330deg,
                #8A2BE2 330deg 360deg
              )`
            }}
          >
            {questions.map((q, idx) => {
              const sliceAngle = 360 / questions.length;
              const rotationAngle = (idx * sliceAngle) + (sliceAngle / 2);
              return (
                <div 
                  key={idx} 
                  className="wheel-number"
                  style={{ transform: `rotate(${rotationAngle}deg) translateY(-180px)` }}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
          
          <button 
            className="wheel-spin-btn" 
            onClick={spinWheel}
            disabled={isSpinning}
          >
            SPIN
          </button>
        </div>

      </div>

      {showModal && selectedQ && (
        <div className="wheel-modal-overlay">
          <div className="wheel-modal">
            <h2 style={{ fontSize: "3rem", marginBottom: "2rem", color: "var(--text-main)" }}>
              {selectedQ.question}
            </h2>
            
            {!showAnswer ? (
              <button className="btn btn-secondary" onClick={() => setShowAnswer(true)} style={{ fontSize: "2rem", marginBottom: "2rem" }}>
                Show Answer 👁️
              </button>
            ) : (
              <div style={{ fontSize: "2rem", color: "var(--success)", fontWeight: "bold", padding: "1rem 2rem", backgroundColor: "rgba(50,205,50,0.1)", borderRadius: "var(--radius-md)", marginBottom: "3rem", animation: "popIn 0.3s ease-out" }}>
                Answer: {selectedQ.correctAnswer}
              </div>
            )}

            {showAnswer && (
              <button className="btn btn-primary" onClick={closeModal} style={{ fontSize: "2rem" }}>
                Awesome!
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
