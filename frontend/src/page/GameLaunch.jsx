import { useState } from "react";
import "../assets/sass/app.scss";
import CardFlipGame from "../games/cardflip/CardFlipGame";
import WordGuess from "../games/wordguess/WordGuess";
import StoryViewer from "../games/storytelling/Story";
import MathQuiz from "../games/mathquiz/MathQuiz";
import Header from "../component/layout/header";

export default function GameLaunch() {
  const [selectedGame, setSelectedGame] = useState("story");

  const renderGame = () => {
    switch (selectedGame) {
      case "card":
        return <CardFlipGame />;
      case "word":
        return <WordGuess />;
      case "math":
        return <MathQuiz />;
      case "story":
      default:
        return <StoryViewer />;
    }
  };

  return (
    <>
      <Header />
      <style>{`
        .game-nav-btn {
          color: #495057 !important;
        }
        .game-nav-btn.active-game {
          color: #fff !important;
        }
        .game-nav-btn:hover {
          color: #495057 !important;
        }
        .game-nav-btn.active-game:hover {
          color: #fff !important;
        }
      `}</style>
      <main
        className="game-launch-container"
        role="main"
        style={{
          minHeight: "100vh",
          backgroundColor: "#F9FAFB",
          backgroundImage: "radial-gradient(#E0E7FF 2px, transparent 2px)",
          backgroundSize: "32px 32px",
          paddingTop: "180px",
          paddingBottom: "80px",
          fontFamily: "'Nunito', sans-serif"
        }}
      >
        <div className="container">
          {/* Header Section */}
          <section className="text-center mb-5 mt-4">
            <h1 className="display-4 fw-bold" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif", textShadow: "2px 2px 4px rgba(79, 70, 229, 0.2)" }}>
              Let’s Play & Learn!
            </h1>
            <p className="fs-4 text-secondary fw-bold mt-2">Pick a game to start your exciting adventure</p>
          </section>

          {/* Game Selector Menu */}
          <nav className="d-flex justify-content-center flex-wrap gap-3 mb-5" aria-label="Choose a game">
            {[
              { id: "story", icon: "📖", title: "Story Time", bg: "#4F46E5" },
              { id: "math", icon: "🧮", title: "Math Quiz", bg: "#22C55E" },
              { id: "word", icon: "🔤", title: "Word Guess", bg: "#F59E0B" },
              { id: "card", icon: "🃏", title: "Card Match", bg: "#EF4444" }
            ].map(game => (
              <button
                key={game.id}
                className={`btn btn-lg rounded-pill fw-bold border-0 shadow-sm px-4 py-3 game-nav-btn ${selectedGame === game.id ? 'active-game' : ''}`}
                onClick={() => setSelectedGame(game.id)}
                aria-pressed={selectedGame === game.id}
                style={{
                  backgroundColor: selectedGame === game.id ? game.bg : "#ffffff",
                  color: selectedGame === game.id ? "#fff" : "#495057",
                  transform: selectedGame === game.id ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  boxShadow: selectedGame === game.id ? `0 10px 20px ${game.bg}80` : "0 4px 6px rgba(0,0,0,0.05)",
                  border: `3px solid ${selectedGame === game.id ? "#fff" : "#e9ecef"}`
                }}
                onMouseEnter={(e) => {
                  if (selectedGame !== game.id) {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 8px 15px rgba(0,0,0,0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedGame !== game.id) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                  }
                }}
              >
                <span className="fs-3 d-block mb-1">{game.icon}</span>
                {game.title}
              </button>
            ))}
          </nav>

          {/* Game Screen wrapper */}
          <section className="row justify-content-center" aria-live="polite">
            <div className="col-12 col-xl-10">
              <div
                className="game-card p-2 p-md-4 rounded-4 shadow-lg"
                style={{
                  backgroundColor: "#ffffff",
                  border: "4px solid #E0E7FF",
                  borderBottomWidth: "8px",
                  borderRadius: "32px",
                  minHeight: "60vh",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 10px 40px rgba(79, 70, 229, 0.15)"
                }}
              >
                {/* Decorative dots in corners */}
                <div style={{ position: "absolute", top: 15, left: 15, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#F59E0B" }}></div>
                <div style={{ position: "absolute", top: 15, right: 15, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#EF4444" }}></div>
                <div style={{ position: "absolute", bottom: 15, left: 15, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#22C55E" }}></div>
                <div style={{ position: "absolute", bottom: 15, right: 15, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#4F46E5" }}></div>

                <div className="h-100" style={{ position: "relative", zIndex: 1 }}>
                  {renderGame()}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
