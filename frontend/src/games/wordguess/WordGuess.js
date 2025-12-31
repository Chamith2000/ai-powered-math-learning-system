import "./WordGuess.css";
import Board from "../components/Board";
import Keyboard from "../components/Keyboard";
import { getboardDefault, generateWordSet } from "./Words";
import React, { useState, createContext, useEffect, useMemo } from "react";
import GameOver from "../components/GameOver";
import hintsRaw from "../data/word_hints.json";

export const AppContext = createContext();

function WordGuess() {
  const [board, setBoard] = useState(getboardDefault());
  const [showHintModal, setShowHintModal] = useState(false);
  const [currAttempt, setCurrAttempt] = useState({ attempt: 0, letter: 0 });
  const [wordSet, setWordSet] = useState(new Set());
  const [correctWord, setCorrectWord] = useState("");
  const [disabledLetters, setDisabledLetters] = useState([]);
  const [gameOver, setGameOver] = useState({ gameOver: false, guessedWord: false });
  const [learnCard, setLearnCard] = useState(null); // {word, definition, example}
  const [attemptsLeft, setAttemptsLeft] = useState(6);
  const [softMsg, setSoftMsg] = useState("");       // gentle inline warning
  const [firstLetterUsed, setFirstLetterUsed] = useState(false);

  const [hintStep, setHintStep] = useState(0);


  const hints = useMemo(() => {
    if (Array.isArray(hintsRaw)) return hintsRaw;
    if (Array.isArray(hintsRaw?.words)) return hintsRaw.words;
    return [];
  }, []);

  // quick lookup for the current word's info
  const hintMap = useMemo(() => {
    const map = {};
    hints.forEach(h => {
      const key = (h.word || "").toLowerCase().trim();
      if (key) map[key] = h;
    });
    return map;
  }, [hints]);

  // helper: TTS
  const speak = (text) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      const u = new SpeechSynthesisUtterance(text);
      synth.speak(u);
    } catch { /* ignore */ }
  };

  const loadRound = () => {
    setBoard(getboardDefault());
    generateWordSet().then((words) => {
      const allowed = new Set(
        hints.map(h => (h.word || "").toLowerCase().trim())
          .filter(w => w && words.wordSet.has(w))
      );

      const finalSet = allowed.size ? allowed : words.wordSet;

      const pool = Array.from(finalSet);
      const newWord = pool[Math.floor(Math.random() * pool.length)];

      setWordSet(finalSet);
      setCorrectWord(newWord);
      setCurrAttempt({ attempt: 0, letter: 0 });
      setDisabledLetters([]);
      setGameOver({ gameOver: false, guessedWord: false });
      setLearnCard(null);
      setAttemptsLeft(6);
      setSoftMsg("");
      setFirstLetterUsed(false);
      setHintStep(0);
    });
  };

  useEffect(() => {
    loadRound();
  }, []);

  const validLetters = useMemo(() => {
    const base = new Set((correctWord || "").toLowerCase().split(""));
    ["a", "e", "i", "o", "u"].forEach(v => base.add(v));
    return Array.from(base).sort();
  }, [correctWord]);

  const revealFirstLetter = () => {
    if (firstLetterUsed || gameOver.gameOver || !correctWord) return;
    const first = correctWord.charAt(0).toUpperCase();

    const newBoard = getboardDefault();
    newBoard[0][0] = first;
    setBoard(newBoard);
    setCurrAttempt({ attempt: 0, letter: 1 });
    setFirstLetterUsed(true);
    setSoftMsg("Great! The first letter is filled for you. 👍");
  };

  const revealWholeWord = () => {
    if (gameOver.gameOver || !correctWord) return;

    const upper = (correctWord || "").toUpperCase().slice(0, 5);
    const newBoard = getboardDefault();
    for (let i = 0; i < Math.min(5, upper.length); i++) {
      newBoard[0][i] = upper[i];
    }
    setBoard(newBoard);

    const info = hintMap[(correctWord || "").toLowerCase()];
    if (info) {
      setLearnCard({
        word: correctWord,
        definition: info.definition,
        example: info.example
      });
    }
    setGameOver({ gameOver: true, guessedWord: false });
    setAttemptsLeft(0);
    setSoftMsg("We revealed the word so you can learn it now.");
  };

  const handleWrongAttemptProgressHints = () => {
    setHintStep((prev) => Math.min(2, prev + 1)); 
  };

  const onEnter = () => {
    if (currAttempt.letter !== 5 || gameOver.gameOver) return;

    setSoftMsg("");

    let currWord = "";
    for (let i = 0; i < 5; i++) currWord += board[currAttempt.attempt][i];
    const guess = currWord.toLowerCase();

    if (!wordSet.has(guess)) {
      setSoftMsg("Hmm… That’s not one of today’s Maths words. Try a different guess!");
      return;
    }

    const newDisabled = [...disabledLetters];
    for (let i = 0; i < 5; i++) {
      const ch = guess[i];
      if (!correctWord.includes(ch) && !newDisabled.includes(ch)) {
        newDisabled.push(ch);
      }
    }
    setDisabledLetters(newDisabled);

    if (guess === (correctWord || "").toLowerCase()) {
      setGameOver({ gameOver: true, guessedWord: true });

      const info = hintMap[(correctWord || "").toLowerCase()];
      if (info) {
        setLearnCard({
          word: correctWord,
          definition: info.definition,
          example: info.example
        });
        speak(`${correctWord}. ${info.definition}`);
      }
      return;
    }

    const nextAttempt = currAttempt.attempt + 1;
    setCurrAttempt({ attempt: nextAttempt, letter: 0 });
    setAttemptsLeft((n) => Math.max(0, n - 1));

    handleWrongAttemptProgressHints();

    if (nextAttempt > 5) {
      setGameOver({ gameOver: true, guessedWord: false });
      const info = hintMap[(correctWord || "").toLowerCase()];
      if (info) {
        setLearnCard({
          word: correctWord,
          definition: info.definition,
          example: info.example
        });
      }
    }
  };

  const onDelete = () => {
    if (gameOver.gameOver) return;
    if (currAttempt.letter === 0) return;
    const newBoard = [...board];
    newBoard[currAttempt.attempt][currAttempt.letter - 1] = "";
    setBoard(newBoard);
    setCurrAttempt({ ...currAttempt, letter: currAttempt.letter - 1 });
  };

  const onSelectLetter = (key) => {
    if (gameOver.gameOver) return;
    if (currAttempt.letter > 4) return;
    const newBoard = [...board];
    newBoard[currAttempt.attempt][currAttempt.letter] = key;
    setBoard(newBoard);
    setCurrAttempt({
      attempt: currAttempt.attempt,
      letter: currAttempt.letter + 1,
    });
  };

  const restartGame = () => {
    loadRound();
  };

  const currentHint = hintMap[(correctWord || "").toLowerCase()];

  const renderStepHints = () => {
    if (!currentHint) return null;

    return (
      <div className="wg-hints">
        <div className="wg-hints__row">
          <span className="wg-hints__badge">1</span>
          <span><b>What it means:</b> {currentHint.definition}</span>
        </div>

        {hintStep >= 1 && (
          <div className="wg-hints__row">
            <span className="wg-hints__badge">2</span>
            <div className="wg-code">
              <div className="wg-code__title">Tiny example</div>
              <pre>{currentHint.example}</pre>
            </div>
          </div>
        )}

        {hintStep >= 2 && (
          <div className="wg-hints__row">
            <span className="wg-hints__badge">3</span>
            <span>
              <b>Starts with:</b> {(correctWord || "").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="wg-root">
      <header className="wg-header">
        <h2>🐍 Maths Word Guess (Grade 6)</h2>
        <p>Guess the 5-letter Maths word. We’ll help with gentle hints each try.</p>

        <div className="wg-toolbar">
          <button className="wg-btn" onClick={() => setShowHintModal(true)}>💡 Show Hints</button>
          <button className="wg-btn" onClick={restartGame}>🔄 New Word</button>
          <button
            className="wg-btn"
            onClick={() =>
              speak(
                `${correctWord}. ${currentHint?.definition || ""}. ${
                  currentHint?.example ? "Example: " + currentHint.example : ""
                }`
              )
            }
            disabled={!currentHint}
            title="Read this aloud"
          >
            🔊 Read Aloud
          </button>
          <button
            className="wg-btn"
            onClick={revealFirstLetter}
            disabled={firstLetterUsed || gameOver.gameOver}
            title="Use once per round"
          >
            ✨ Reveal First Letter
          </button>
          <button
            className="wg-btn wg-btn-danger"
            onClick={revealWholeWord}
            disabled={gameOver.gameOver || !correctWord}
            title="Show the answer and end this round"
          >
            👀 Reveal Word
          </button>
        </div>

        <div className="wg-meta">
          <div><b>Attempts Left:</b> {attemptsLeft}</div>
          <div className="wg-valids">
            <span className="wg-valids__label">Valid letters today:</span>
            {validLetters.map(ch => (
              <span className="wg-pill" key={ch}>{ch.toUpperCase()}</span>
            ))}
          </div>
        </div>

        {softMsg && <div className="wg-softmsg">{softMsg}</div>}
      </header>

      {learnCard && (
        <div className="wg-learn">
          <div className="wg-learn__title">
            ⭐ Learn: <span className="wg-word">{learnCard.word}</span>
          </div>
          <div className="wg-learn__def">{learnCard.definition}</div>
          <pre className="wg-learn__code">{learnCard.example}</pre>
          <div className="wg-learn__actions">
            <button className="wg-btn" onClick={() => speak(`${learnCard.word}. ${learnCard.definition}`)}>
              🔊 Read Aloud
            </button>
          </div>
        </div>
      )}

      <AppContext.Provider
        value={{
          board,
          setBoard,
          currAttempt,
          setCurrAttempt,
          correctWord,
          onSelectLetter,
          onDelete,
          onEnter,
          setDisabledLetters,
          disabledLetters,
          gameOver,
        }}
      >
        <div className="game">
          <Board />
          {gameOver.gameOver ? <GameOver /> : <Keyboard />}
        </div>

        {showHintModal && (
          <div className="wg-modal">
            <div className="wg-modal__card">
              <div className="wg-modal__header">
                <b>Helpful Hints</b>
                <button className="wg-close" onClick={() => setShowHintModal(false)}>×</button>
              </div>
              <div className="wg-modal__body">
                {renderStepHints()}
              </div>
              <div className="wg-modal__footer">
                <button className="wg-btn" onClick={() => setShowHintModal(false)}>Got it</button>
              </div>
            </div>
          </div>
        )}
      </AppContext.Provider>
    </div>
  );
}

export default WordGuess;
