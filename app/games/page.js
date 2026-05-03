"use client";

import { useRouter } from "next/navigation";

export default function GameSelector() {
  const router = useRouter();

  const games = [
    { id: "quiz", name: "Quiz (MCQs)", icon: "🅰️", active: true, route: "/play/quiz", color: "var(--primary)" },
    { id: "true-false", name: "True or False", icon: "✅", active: true, route: "/play/true-false", color: "var(--secondary)" },
    { id: "tug", name: "Tug of War", icon: "🧵", active: true, route: "/play/tug", color: "#8A2BE2" },
    { id: "memory", name: "Memory Game", icon: "🎴", active: true, route: "/play/memory", color: "#FF8C00" },
    { id: "wheel", name: "Spin the Wheel", icon: "🎡", active: true, route: "/play/wheel", color: "#FF1493" },
    { id: "flashcards", name: "Flashcards", icon: "📇", active: true, route: "/play/flashcards", color: "#1E90FF" },
  ];

  const handleSelect = (game) => {
    if (game.active && game.route) {
      router.push(game.route);
    }
  };

  return (
    <main className="container center-flex" style={{ height: "100vh", padding: "2rem" }}>
      <h1 style={{ fontSize: "4rem", marginBottom: "3rem" }}>Choose a Game!</h1>
      
      <div className="games-grid">
        {games.map((game) => (
          <div 
            key={game.id} 
            className={`game-card ${!game.active ? "locked" : ""}`}
            style={{ "--card-color": game.color }}
            onClick={() => handleSelect(game)}
          >
            <div className="game-icon">{game.icon}</div>
            <div className="game-name">{game.name}</div>
            {!game.active && <div className="locked-badge">Coming Soon</div>}
          </div>
        ))}
      </div>
    </main>
  );
}
