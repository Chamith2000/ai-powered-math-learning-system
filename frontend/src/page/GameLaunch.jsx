import { useState } from "react";
import "../assets/sass/app.scss";
import CardFlipGame from "../games/cardflip/CardFlipGame";
import WordGuess from "../games/wordguess/WordGuess";
import StoryViewer from "../games/storytelling/Story";
import Header from "../component/layout/header";

export default function GameLaunch() {
  const [selectedGame, setSelectedGame] = useState("story");

  const renderGame = () => {
    switch (selectedGame) {
      case "card":
        return <CardFlipGame />;
      case "word":
        return <WordGuess />;
      case "story":
      default:
        return <StoryViewer />;
    }
  };

  return (
    <>
      <Header />
      <main
        className="app-container"
        role="main"
        style={{
          minHeight: "100vh",
          backgroundImage: "url('/images/background/bg1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          paddingBottom: 32
        }}
      >
        <section className="hero">
          <h1 className="hero__title">Let’s Play & Learn!</h1>
          <p className="hero__subtitle">Pick a game to start your adventure 🎮</p>
        </section>

        <nav className="game-selector" aria-label="Choose a game">
          <button
            className={`pill ${selectedGame === "card" ? "active" : ""}`}
            onClick={() => setSelectedGame("card")}
            aria-pressed={selectedGame === "card"}
          >
            🐍 Card Match
          </button>
          <button
            className={`pill ${selectedGame === "word" ? "active" : ""}`}
            onClick={() => setSelectedGame("word")}
            aria-pressed={selectedGame === "word"}
          >
            🔤 Word Guess
          </button>
          <button
            className={`pill ${selectedGame === "story" ? "active" : ""}`}
            onClick={() => setSelectedGame("story")}
            aria-pressed={selectedGame === "story"}
          >
            📖 Story Viewer
          </button>
        </nav>

        <section className="game-view" aria-live="polite">
          <div
            className="game-card"
            style={{
              // card gets the same bg image
              backgroundImage: "url('/images/background/bg1.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              // translucent white layer to make content readable but see-through
              backgroundColor: "rgba(255,255,255,0.65)",
              // blend, radius, shadow for “card” feel
              backgroundBlendMode: "lighten",
              borderRadius: 16,
              boxShadow: "0 16px 30px rgba(0,0,0,0.15)",
              padding: 16
            }}
          >
            {renderGame()}
          </div>
        </section>
      </main>
    </>
  );
}
