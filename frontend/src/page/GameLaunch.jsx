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
        .game-launch-container {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 34%),
            radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 30%),
            #f6f9ff;
          background-size: 32px 32px;
          padding-top: 50px;
          padding-bottom: 72px;
          font-family: 'Nunito', sans-serif;
        }
        .game-launch-hero {
          max-width: 820px;
          margin: 0 auto 24px;
          padding: 24px;
          border-radius: 18px;
          background: linear-gradient(135deg, #eef2ff 0%, #ffffff 55%, #ecfeff 100%);
          border: 1px solid #dbeafe;
          box-shadow: 0 14px 34px rgba(30, 41, 59, 0.08);
        }
        .game-launch-hero h1 {
          color: #24306b !important;
          font-family: 'Baloo 2', sans-serif;
          font-weight: 900;
          margin-bottom: 6px;
        }
        .game-launch-hero p {
          color: #64748b !important;
          font-weight: 800;
          margin-bottom: 0;
        }
        .game-nav {
          margin-bottom: 28px;
        }
        .game-nav-btn {
          color: #495057 !important;
          min-width: 148px;
          border: 1px solid #dbeafe !important;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08) !important;
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
        .game-screen-card {
          background-color: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 22px;
          min-height: 60vh;
          position: relative;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(31, 41, 55, 0.11);
        }
      `}</style>
      <main
        className="game-launch-container"
        role="main"
      >
        <div className="container">
          {/* Header Section */}
          <section className="text-center game-launch-hero">
            <h1 className="display-5">
              Let’s Play & Learn!
            </h1>
            <p className="fs-5">Pick a game and start learning through play.</p>
          </section>

          {/* Game Selector Menu */}
          <nav className="game-nav d-flex justify-content-center flex-wrap gap-3" aria-label="Choose a game">
            {[
              { id: "story", icon: "icofont-book-alt", title: "Story Time", bg: "#4F46E5" },
              { id: "math", icon: "icofont-calculator", title: "Math Quiz", bg: "#22C55E" },
              { id: "word", icon: "icofont-abc", title: "Word Guess", bg: "#F59E0B" },
              { id: "card", icon: "icofont-card", title: "Card Match", bg: "#EF4444" }
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
                <span className="fs-3 d-block mb-1"><i className={game.icon}></i></span>
                {game.title}
              </button>
            ))}
          </nav>

          {/* Game Screen wrapper */}
          <section className="row justify-content-center" aria-live="polite">
            <div className="col-12 col-xl-10">
              <div
                className="game-card game-screen-card p-2 p-md-4"
              >
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
