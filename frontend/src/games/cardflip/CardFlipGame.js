import { useEffect, useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  DialogTitle,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Typography,
  Divider,
  Box
} from "@mui/material";
import Card from "./card";
import "../../assets/sass/app.scss";
import pythonConceptsData from "../data/python_concepts.json";

import star from "../../assets/images/game-images/star_image.png";
import corn from "../../assets/images/game-images/9512682.jpg";
import chili from "../../assets/images/game-images/9512686.jpg";
import beatroot from "../../assets/images/game-images/9512694.jpg";
import ball from "../../assets/images/game-images/9512673.jpg";

// ------------------ CONFIG ------------------
const IMAGE_POOL = [corn, chili, beatroot, ball, star];
const DIFFICULTY_MAP = { easy: 4, medium: 6, hard: 8 };
const LEVELS = ["easy", "medium", "hard"];

// Speech helper
function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.speak(new SpeechSynthesisUtterance(text));
  } catch {}
}

const generateImage = () => IMAGE_POOL[Math.floor(Math.random() * IMAGE_POOL.length)];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickTerms(concepts, count) {
  const pool = shuffle(concepts);
  return pool.slice(0, count).map(c => c.term);
}

export default function CardFlipGame() {
  const allConcepts = pythonConceptsData?.concepts ?? [];

  const conceptMap = useMemo(() => {
    const m = {};
    allConcepts.forEach(c => (m[c.term] = { definition: c.definition, example: c.example }));
    return m;
  }, [allConcepts]);

  // Level & deck
  const [difficulty, setDifficulty] = useState("easy");
  const [numUnique, setNumUnique] = useState(DIFFICULTY_MAP["easy"]);

  const [cards, setCards] = useState([]);
  const [openCards, setOpenCards] = useState([]);
  const [clearedCards, setClearedCards] = useState({});
  const [shouldDisableAllCards, setShouldDisableAllCards] = useState(false);
  const [moves, setMoves] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [bestScore, setBestScore] = useState(
    JSON.parse(localStorage.getItem("bestScorePythonKids")) || Number.POSITIVE_INFINITY
  );
  const timeout = useRef(null);
  const [randomImage, setRandomImage] = useState(generateImage());
  const [lastLearn, setLastLearn] = useState(null);

  // timing & per-level results
  const levelStartRef = useRef(Date.now());
  const [levelResults, setLevelResults] = useState([]); // { level, moves, timeSec, pairs, marks }

  const buildDeck = (count) => {
    const chosenTerms = pickTerms(allConcepts, count);
    const deck = shuffle(chosenTerms.concat(chosenTerms)).map(term => ({ word: term }));
    setCards(deck);
  };

  useEffect(() => {
    setNumUnique(DIFFICULTY_MAP[difficulty]);
  }, [difficulty]);

  useEffect(() => {
    if (allConcepts.length) {
      buildDeck(numUnique);
    }
    levelStartRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allConcepts.length, numUnique]);

  const disable = () => setShouldDisableAllCards(true);
  const enable = () => setShouldDisableAllCards(false);

  const checkCompletion = () => {
    if (Object.keys(clearedCards).length === numUnique) {
      const timeSec = Math.max(0, Math.round((Date.now() - levelStartRef.current) / 1000));
      const pairs = numUnique;
      const marks = Math.max(0, Math.round((pairs / Math.max(1, moves)) * 100));

      const highScore = Math.min(moves, bestScore);
      setBestScore(highScore);
      localStorage.setItem("bestScorePythonKids", highScore);

      setLevelResults(prev => {
        const rest = prev.filter(r => r.level !== difficulty);
        return [...rest, { level: difficulty, moves, timeSec, pairs, marks }]
          .sort((a,b)=>LEVELS.indexOf(a.level)-LEVELS.indexOf(b.level));
      });

      setShowModal(true);
    }
  };

  const evaluate = () => {
    const [first, second] = openCards;
    enable();
    if (!cards[first] || !cards[second]) return;

    if (cards[first].word === cards[second].word) {
      const term = cards[first].word;
      setClearedCards((prev) => ({ ...prev, [term]: true }));
      setOpenCards([]);

      const info = conceptMap[term];
      if (info) {
        setLastLearn({ term, ...info });
        speak(`${term}. ${info.definition}`);
      }
    } else {
      timeout.current = setTimeout(() => setOpenCards([]), 600);
    }
  };

  const handleCardClick = (index) => {
    if (shouldDisableAllCards) return;
    if (openCards.includes(index)) return;

    if (openCards.length === 1) {
      setOpenCards(prev => [...prev, index]);
      setMoves(m => m + 1);
      disable();
    } else {
      clearTimeout(timeout.current);
      setOpenCards([index]);
    }
  };

  useEffect(() => {
    if (openCards.length === 2) {
      setTimeout(evaluate, 300);
    }
    return () => clearTimeout(timeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCards]);

  useEffect(() => {
    checkCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearedCards]);

  const checkIsFlipped = (i) => openCards.includes(i);
  const checkIsInactive = (card) => Boolean(clearedCards[card.word]);

  const resetForCurrentLevel = () => {
    setClearedCards({});
    setOpenCards([]);
    setShowModal(false);
    setMoves(0);
    setShouldDisableAllCards(false);
    setLastLearn(null);
    buildDeck(DIFFICULTY_MAP[difficulty]);
    levelStartRef.current = Date.now();
  };

  const handleRestart = () => {
    setDifficulty("easy");
    setLevelResults([]);
    setRandomImage(generateImage());
    resetForCurrentLevel();
  };

  const handleDifficultyChange = (_e, value) => {
    if (!value) return;
    setDifficulty(value);
    resetForCurrentLevel();
  };

  const advanceToNextLevel = () => {
    const idx = LEVELS.indexOf(difficulty);
    if (idx < LEVELS.length - 1) {
      setDifficulty(LEVELS[idx + 1]);
      resetForCurrentLevel();
    } else {
      setShowModal(false);
    }
  };

  const showRandomTip = () => {
    const unmatched = Array.from(new Set(cards.map(c => c.word))).filter(t => !clearedCards[t]);
    if (unmatched.length === 0) return;
    const term = unmatched[Math.floor(Math.random() * unmatched.length)];
    const info = conceptMap[term];
    if (info) {
      setLastLearn({ term, ...info });
      speak(`${term}. ${info.definition}`);
    }
  };

  const LevelRow = ({label, rec}) => (
    <tr>
      <td>{label}</td>
      <td className="pycm-text-end">{rec ? rec.pairs : "-"}</td>
      <td className="pycm-text-end">{rec ? rec.moves : "-"}</td>
      <td className="pycm-text-end">{rec ? `${rec.marks}%` : "-"}</td>
      <td className="pycm-text-end">{rec ? `${rec.timeSec}s` : "-"}</td>
    </tr>
  );

  const getRecord = lvl => levelResults.find(r => r.level === lvl);

  return (
    <div className="pycm-root">
      {/* Header */}
      <header className="pycm-header">
        <h2>🐍 Python Match (Grade 6)</h2>
        <p>
          Flip two matching <b>Python</b> words to learn! When you find a pair, a tip appears with a tiny code sample.
        </p>

        <Box className="pycm-toolbar">
          <ToggleButtonGroup
            exclusive
            value={difficulty}
            onChange={handleDifficultyChange}
            aria-label="difficulty"
            size="small"
          >
            <ToggleButton value="easy" aria-label="easy">Easy</ToggleButton>
            <ToggleButton value="medium" aria-label="medium">Medium</ToggleButton>
            <ToggleButton value="hard" aria-label="hard">Hard</ToggleButton>
          </ToggleButtonGroup>

          <Button variant="outlined" onClick={() => setRandomImage(generateImage())}>
            Change Card Image
          </Button>
          <Button variant="text" onClick={showRandomTip}>
            Hint / Tip
          </Button>
        </Box>
      </header>

      {/* Scoreboard */}
      <div className="pycm-scoreboard">
        <div className="pycm-table-wrap">
          <table className="pycm-table">
            <thead>
              <tr>
                <th>Level</th>
                <th className="pycm-text-end">Pairs</th>
                <th className="pycm-text-end">Moves</th>
                <th className="pycm-text-end">Marks</th>
                <th className="pycm-text-end">Time</th>
              </tr>
            </thead>
            <tbody>
              <LevelRow label="Easy"   rec={getRecord("easy")} />
              <LevelRow label="Medium" rec={getRecord("medium")} />
              <LevelRow label="Hard"   rec={getRecord("hard")} />
            </tbody>
          </table>
        </div>
        <div className="pycm-hint">
          Marks = <code>round(pairs / moves × 100)</code>. Perfect play is when each match takes exactly one move.
        </div>
      </div>

      {/* Learning panel */}
      {lastLearn && (
        <Paper elevation={2} sx={{ maxWidth: 720, margin: "0 auto 16px", padding: 2, background: "rgba(255,255,255,0.95)" }}>
          <Typography variant="subtitle1" gutterBottom>
            ⭐ Learn: <b>{lastLearn.term}</b>
          </Typography>
          <Typography variant="body2" gutterBottom>{lastLearn.definition}</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" sx={{ whiteSpace: "pre-wrap", display: "block" }}>
            <b>Example:</b>{`\n`}{lastLearn.example}
          </Typography>
          <Box sx={{ textAlign: "right", mt: 1 }}>
            <Button size="small" onClick={() => speak(`${lastLearn.term}. ${lastLearn.definition}`)}>
              🔊 Read Aloud
            </Button>
          </Box>
        </Paper>
      )}

      {/* Cards grid */}
      <div className="pycm-grid">
        {cards.map((card, index) => (
          <div className="pycm-card-cell" key={index}>
            <Card
              card={card}
              index={index}
              isDisabled={shouldDisableAllCards}
              isInactive={checkIsInactive(card)}
              isFlipped={checkIsFlipped(index)}
              onClick={handleCardClick}
              image={randomImage}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="pycm-footer">
        <div className="pycm-scoreline">
          <b>Level:</b> {difficulty.toUpperCase()} &nbsp; · &nbsp;
          <b>Moves:</b> {moves} &nbsp; · &nbsp;
          <b>Best Moves:</b> {bestScore === Number.POSITIVE_INFINITY ? "-" : bestScore}
        </div>
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mb: 2 }}>
          <Button onClick={handleRestart} variant="contained" color="primary">
            Restart from Easy
          </Button>
        </Box>
      </footer>

      {/* Win Modal */}
      <Dialog open={showModal} disableEscapeKeyDown>
        <DialogTitle>🎉 Level Complete!</DialogTitle>
        <DialogContent>
          {(() => {
            const rec = levelResults.find(r => r.level === difficulty);
            const marksText = rec ? `${rec.marks}%` : "-";
            const timeText = rec ? `${rec.timeSec}s` : "-";
            return (
              <>
                <DialogContentText sx={{ mb: 1 }}>
                  You matched all <b>{numUnique}</b> Python pairs on <b>{difficulty.toUpperCase()}</b>.
                </DialogContentText>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <div><b>Moves:</b> {moves}</div>
                  <div><b>Marks:</b> {marksText}</div>
                  <div><b>Time:</b> {timeText}</div>
                </Paper>
                <Typography variant="subtitle2" gutterBottom>What you practiced:</Typography>
                <ul style={{ marginTop: 0 }}>
                  {Object.keys(clearedCards).sort().map(t => (
                    <li key={t}><b>{t}</b> — {conceptMap[t]?.definition}</li>
                  ))}
                </ul>
              </>
            );
          })()}
        </DialogContent>
        <DialogActions>
          {difficulty !== "hard" ? (
            <Button onClick={advanceToNextLevel} color="primary" variant="contained">Next Level ▶</Button>
          ) : (
            <Button onClick={() => setShowModal(false)} color="primary" variant="contained">Close</Button>
          )}
          <Button onClick={handleRestart} color="secondary">Restart</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
