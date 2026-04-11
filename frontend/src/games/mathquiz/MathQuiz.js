import React, { useState, useEffect, useCallback } from 'react';
import './MathQuiz.css';

const GAME_TIME = 30; // 30 seconds to answer as many as possible

export default function MathQuiz() {
    const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameover'
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_TIME);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [shake, setShake] = useState(false);

    // Generate a random math problem
    const generateQuestion = useCallback(() => {
        const operators = ['+', '-', '*'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        let num1, num2, answer;

        switch (operator) {
            case '+':
                num1 = Math.floor(Math.random() * 50) + 1;
                num2 = Math.floor(Math.random() * 50) + 1;
                answer = num1 + num2;
                break;
            case '-':
                num1 = Math.floor(Math.random() * 50) + 20;
                num2 = Math.floor(Math.random() * num1); // Ensure positive result
                answer = num1 - num2;
                break;
            case '*':
                num1 = Math.floor(Math.random() * 12) + 1;
                num2 = Math.floor(Math.random() * 12) + 1;
                answer = num1 * num2;
                break;
            default:
                num1 = 1; num2 = 1; answer = 2;
        }

        // Generate 3 random wrong answers close to the real answer
        const options = new Set([answer]);
        while (options.size < 4) {
            const offset = Math.floor(Math.random() * 10) - 5;
            const wrongAnswer = answer + offset;
            if (wrongAnswer !== answer && wrongAnswer >= 0) {
                options.add(wrongAnswer);
            }
        }

        // Shuffle options
        const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

        setCurrentQuestion({
            text: `${num1} ${operator} ${num2}`,
            answer,
            options: shuffledOptions
        });
    }, []);

    const startGame = () => {
        setScore(0);
        setTimeLeft(GAME_TIME);
        setGameState('playing');
        generateQuestion();
    };

    // Timer logic
    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameState === 'playing') {
            setGameState('gameover');
        }
        return () => clearInterval(timer);
    }, [timeLeft, gameState]);

    // Handle Answer Selection
    const handleAnswer = (selectedOption) => {
        if (selectedOption === currentQuestion.answer) {
            setScore((prev) => prev + 1);
            // Small time bonus for correct answers
            setTimeLeft((prev) => Math.min(prev + 2, GAME_TIME));
            generateQuestion();
        } else {
            // Wrong answer
            setShake(true);
            setTimeout(() => setShake(false), 400);
            setTimeLeft((prev) => Math.max(prev - 3, 0)); // Time penalty
        }
    };

    return (
        <div className="mathquiz-container">
            <div className={`mathquiz-board ${shake ? 'mathquiz-shake' : ''}`}>

                {gameState === 'start' && (
                    <div className="mathquiz-gameover">
                        <h2>Math Quiz 🧮</h2>
                        <p>Answer as many questions as you can in {GAME_TIME}s!</p>
                        <p style={{ fontSize: '1rem', color: '#888' }}>(+2s for correct, -3s penalty for wrong)</p>
                        <button className="mathquiz-action-btn" onClick={startGame}>Start Game</button>
                    </div>
                )}

                {gameState === 'playing' && currentQuestion && (
                    <>
                        <div className="mathquiz-header">
                            <div className="mathquiz-score">Score: {score}</div>
                            <div className="mathquiz-timer">⏱️ {timeLeft}s</div>
                        </div>

                        <div className="mathquiz-question">
                            {currentQuestion.text} = ?
                        </div>

                        <div className="mathquiz-options">
                            {currentQuestion.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className="mathquiz-option-btn"
                                    onClick={() => handleAnswer(opt)}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {gameState === 'gameover' && (
                    <div className="mathquiz-gameover">
                        <h2>Time's Up! ⏰</h2>
                        <p>You scored: <strong>{score}</strong> points!</p>
                        <button className="mathquiz-action-btn" onClick={startGame}>Play Again</button>
                    </div>
                )}

            </div>
        </div>
    );
}
