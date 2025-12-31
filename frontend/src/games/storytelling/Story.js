// src/games/storytelling/Story.jsx
import React, { useMemo, useState } from "react";
import storiesData from "../data/coding_stories.json";
import "./Story.css";

const StoryViewer = () => {
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [history, setHistory] = useState([]); // stack of visited node ids for Back

  const story = useMemo(
    () => storiesData.stories.find((s) => s.id === selectedStoryId),
    [selectedStoryId]
  );
  const currentNode = useMemo(
    () => story?.nodes.find((n) => n.id === currentNodeId),
    [story, currentNodeId]
  );

  const handleSelectStory = (id) => {
    const s = storiesData.stories.find((x) => x.id === id);
    setSelectedStoryId(id);
    setCurrentNodeId(s.startNodeId);
    setHistory([s.startNodeId]);
  };

  const handleChoiceClick = (nextId) => {
    setCurrentNodeId(nextId);
    setHistory((h) => [...h, nextId]);
  };

  const handleBack = () => {
    if (history.length <= 1) return;
    const newHist = history.slice(0, history.length - 1);
    setHistory(newHist);
    setCurrentNodeId(newHist[newHist.length - 1]);
  };

  const handleRestart = () => {
    if (!story) return;
    setCurrentNodeId(story.startNodeId);
    setHistory([story.startNodeId]);
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Code copied to clipboard!");
    } catch {
      alert("Could not copy code on this browser.");
    }
  };

  const step = Math.max(1, history.length);
  const hasChoices = currentNode?.choices && currentNode.choices.length > 0;

  return (
    <div className="story-page">
      <div className="story-container">
        {!selectedStoryId ? (
          <>
            <h2 className="story-title">Choose a Maths Adventure</h2>
            {storiesData.stories.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectStory(s.id)}
                className="story-button"
                style={{ marginRight: "20px" }}
              >
                {s.title}
              </button>
            ))}
          </>
        ) : (
          <>
            <div className="story-header">
              <h2 className="story-title">{story.title}</h2>
              <div className="story-actions">
                <button className="story-secondary" onClick={handleBack} disabled={history.length <= 1}>
                  ← Back
                </button>
                <button className="story-secondary" onClick={handleRestart}>
                  ↻ Restart
                </button>
                <button className="story-secondary" onClick={() => setSelectedStoryId(null)}>
                  ⟵ Story List
                </button>
              </div>
            </div>

            <div className="story-progress">Step {step}</div>

            {currentNode?.image && (
              <img
                src={currentNode.image}
                alt=""
                className="story-image"
                style={{ maxHeight: "420px", width: "auto" }}
              />
            )}

            <p className="story-text">{currentNode?.text}</p>

            {currentNode?.tips?.length > 0 && (
              <div className="story-tips">
                {currentNode.tips.map((t, i) => (
                  <div key={i} className="tip-chip">
                    {t}
                  </div>
                ))}
              </div>
            )}

            {currentNode?.code && (
              <div className="story-code">
                <div className="story-code-bar">
                  <span className="lang">{currentNode.language || "code"}</span>
                  <button className="copy-btn" onClick={() => copyCode(currentNode.code)}>
                    Copy
                  </button>
                </div>
                <pre>
                  <code>{currentNode.code}</code>
                </pre>
              </div>
            )}

            {hasChoices ? (
              <div className="choices">
                {currentNode.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoiceClick(choice.nextId)}
                    className="story-button"
                    style={{ marginRight: "20px" }}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <p className="the-end">THE END</p>
                <button className="story-button" onClick={handleRestart}>
                  Play Again
                </button>
                <button className="story-button" onClick={() => setSelectedStoryId(null)}>
                  Back to Story List
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
