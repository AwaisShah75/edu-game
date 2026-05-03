"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HeadToHeadTug() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [isClient, setIsClient] = useState(false);
  
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  
  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(1);
  
  const [optionsA, setOptionsA] = useState([]);
  const [optionsB, setOptionsB] = useState([]);

  // Time limit logic
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes

  useEffect(() => {
    setIsClient(true);
    const stored = sessionStorage.getItem("eduplay_questions");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length >= 2) {
        setQuestions(parsed);
      } else {
        alert("Need at least 2 questions to play Head-to-Head Tug of War.");
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  // Timer countdown
  useEffect(() => {
    if (questions.length === 0 || scoreA >= 10 || scoreB >= 10 || timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [questions, scoreA, scoreB, timeLeft]);

  // Generate shuffled options for Team A
  useEffect(() => {
    if (questions.length > 0) {
      const q = questions[idxA];
      const opts = [{ text: q.correctAnswer, isCorrect: true }, ...q.wrongOptions.map(o => ({ text: o, isCorrect: false }))];
      setOptionsA(opts.sort(() => Math.random() - 0.5));
    }
  }, [idxA, questions]);

  // Generate shuffled options for Team B
  useEffect(() => {
    if (questions.length > 0) {
      const q = questions[idxB];
      const opts = [{ text: q.correctAnswer, isCorrect: true }, ...q.wrongOptions.map(o => ({ text: o, isCorrect: false }))];
      setOptionsB(opts.sort(() => Math.random() - 0.5));
    }
  }, [idxB, questions]);

  const WINNING_SCORE = 10;

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
    } catch(e) {}
  };

  const handleTapA = (isCorrect) => {
    if (isCorrect) {
      playTone(true);
      setScoreA(prev => prev + 1);
      setIdxA(prev => (prev + 2) % questions.length);
    } else {
      playTone(false);
    }
  };

  const handleTapB = (isCorrect) => {
    if (isCorrect) {
      playTone(true);
      setScoreB(prev => prev + 1);
      setIdxB(prev => (prev + 2) % questions.length);
    } else {
      playTone(false);
    }
  };

  const exitGame = () => {
    if (confirm("Are you sure you want to exit?")) router.push("/games");
  };

  if (!isClient || questions.length === 0) return null;

  const isGameOver = scoreA >= WINNING_SCORE || scoreB >= WINNING_SCORE || timeLeft <= 0;
  
  // Knot offset based on score difference (-50% center, moves left or right)
  const scoreDiff = scoreB - scoreA; 
  const knotOffset = scoreDiff * 5; // Each point = 5% of arena width

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="tug-3col-layout">
      
      {/* Team A (Blue) Panel */}
      <div className="tug-panel team-a-panel">
        <div className="panel-header" style={{ backgroundColor: '#0078d7' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '2.5rem' }}>Team 1</h2>
          <div className="team-score-bubble">{scoreA}</div>
        </div>
        
        {!isGameOver ? (
          <div className="panel-content">
            <h3 className="panel-question">{questions[idxA].question}</h3>
            <div className="panel-options-grid">
              {optionsA.map((opt, i) => (
                <button key={i} className="panel-option-btn" onClick={() => handleTapA(opt.isCorrect)}>
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="panel-content center-flex">
            <h1 style={{ color: 'var(--primary)', fontSize: '4rem' }}>{scoreA >= WINNING_SCORE ? "WINNER!" : ""}</h1>
          </div>
        )}
      </div>

      {/* Center Arena */}
      <div className="tug-arena-col">
        <div className="game-header" style={{ padding: '1rem', marginBottom: 0, justifyContent: 'center', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', color: '#FF5A5F' }}>
           <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900 }}>TUG OF WAR</h2>
        </div>
        
        <div className="arena-center-card">
          <div className="arena-stats">
            <div style={{ color: '#0078d7', fontWeight: 'bold' }}>Team 1<br/>{scoreA}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => setTimeLeft(prev => Math.max(0, prev - 30))} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer' }} title="Remove 30s">➖</button>
              <div className="arena-timer" style={{ minWidth: '100px' }}>⏱ {formatTime(timeLeft)}</div>
              <button onClick={() => setTimeLeft(prev => prev + 30)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer' }} title="Add 30s">➕</button>
            </div>
            <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Team 2<br/>{scoreB}</div>
          </div>

          <div className="tug-graphic-container">
            <div className="tug-dashed-line"></div>
            {/* Single SVG Scene Pulling Animation */}
            <div className={`tug-dynamic-wrapper ${!isGameOver ? 'anim-pull-single' : ''}`} style={{ transform: `translateX(${knotOffset}vw)` }}>
              <div className="single-svg-wrapper">
                <Image src="/kids.svg" alt="Kids playing tug of war" fill style={{ objectFit: 'contain' }} />
              </div>
            </div>
          </div>
        </div>
        
        <button className="exit-btn" onClick={exitGame} style={{ marginTop: 'auto', alignSelf: 'center' }}>🚪 Exit Game</button>
      </div>

      {/* Team B (Red) Panel */}
      <div className="tug-panel team-b-panel">
        <div className="panel-header" style={{ backgroundColor: '#d32f2f' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '2.5rem' }}>Team 2</h2>
          <div className="team-score-bubble">{scoreB}</div>
        </div>
        
        {!isGameOver ? (
          <div className="panel-content">
            <h3 className="panel-question" style={{ color: 'var(--danger)' }}>{questions[idxB].question}</h3>
            <div className="panel-options-grid">
              {optionsB.map((opt, i) => (
                <button key={i} className="panel-option-btn danger-btn" onClick={() => handleTapB(opt.isCorrect)}>
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="panel-content center-flex">
            <h1 style={{ color: 'var(--danger)', fontSize: '4rem' }}>{scoreB >= WINNING_SCORE ? "WINNER!" : ""}</h1>
          </div>
        )}
      </div>

    </div>
  );
}
