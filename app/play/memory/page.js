"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MemoryGame() {
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = sessionStorage.getItem("eduplay_questions");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) {
        // Max 8 questions for Memory Game (16 cards)
        const gameQuestions = parsed.slice(0, 8);
        
        let deck = [];
        gameQuestions.forEach(q => {
          deck.push({ id: q.id, type: "q", text: q.question });
          deck.push({ id: q.id, type: "a", text: q.correctAnswer });
        });

        // Fisher-Yates Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        setCards(deck);
      } else {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const handleCardTap = (index) => {
    // Prevent interaction if 2 cards are already flipped and waiting
    if (flippedIndices.length === 2) return;
    // Prevent tapping an already flipped or matched card
    if (flippedIndices.includes(index) || matchedIds.includes(cards[index].id)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // If 2 cards are flipped, check for match
    if (newFlipped.length === 2) {
      const [idx1, idx2] = newFlipped;
      
      if (cards[idx1].id === cards[idx2].id) {
        // Match found!
        playTone(true);
        setMatchedIds([...matchedIds, cards[idx1].id]);
        setFlippedIndices([]);
      } else {
        // No match, wait 1.5s then flip back
        playTone(false);
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1500);
      }
    } else {
      // Play a neutral blip for the first flip
      playToneNeutral();
    }
  };

  const playToneNeutral = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  };

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
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      }
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) {}
  };

  const exitGame = () => {
    if (confirm("Are you sure you want to exit the game?")) {
      router.push("/games");
    }
  };

  if (!isClient || cards.length === 0) return null;

  const isGameOver = matchedIds.length === cards.length / 2;

  return (
    <>
      <div className="game-header">
        <button className="exit-btn" onClick={exitGame} title="Exit Game">🚪</button>
        <div className="question-counter">
          Matches: {matchedIds.length} / {cards.length / 2}
        </div>
      </div>

      <div className="game-content" style={{ padding: "1rem" }}>
        {isGameOver ? (
          <div className="center-flex">
            <h1 style={{ fontSize: "6rem", marginBottom: "2rem" }}>🎉 You Won! 🎉</h1>
            <button className="btn btn-primary" style={{ fontSize: "2rem" }} onClick={() => router.push("/games")}>
              Play Another Game
            </button>
          </div>
        ) : (
          <div className="memory-grid">
            {cards.map((card, idx) => {
              const isFlipped = flippedIndices.includes(idx) || matchedIds.includes(card.id);
              const isMatched = matchedIds.includes(card.id);

              return (
                <div 
                  key={idx} 
                  className={`memory-card ${isFlipped ? "flipped" : ""} ${isMatched ? "matched" : ""}`}
                  onClick={() => handleCardTap(idx)}
                >
                  <div className="memory-card-inner">
                    <div className="memory-card-front">
                      <span style={{ fontSize: "3rem" }}>❓</span>
                    </div>
                    <div className="memory-card-back">
                      <span className="memory-card-label">
                        {card.type === "q" ? "Q" : "A"}
                      </span>
                      <div className="memory-card-text">
                        {card.text}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
