/**import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;*/

/**
 * Word Puzzle Game — Main Application
 * ============================================================
 * A word unscrambling game with 3 difficulty levels and bonus rounds.
 * 
 * Features:
 * - Unlimited dynamic words via API
 * - 3 difficulty levels (Easy, Medium, Hard)
 * - Bonus round every 10 levels (hidden phrase puzzles)
 * - Subscription prompt (R20/month)
 * - Supabase leaderboard (National/Global)
 * - Country detection via IP
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabase/supabase';
import { fetchMultipleWords } from './api';
import { bonusPhrases } from './bonusPhrases';

// ============================================================
// HELPERS
// ============================================================

const getFlagEmoji = (code) => {
  if (!code) return '🌍';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0))
  );
};

const shuffleWord = (word) => {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
};

// ============================================================
// MAIN APP
// ============================================================

function App() {
  // --- UI State ---
  const [page, setPage] = useState('menu');

  // --- Game State ---
  const [level, setLevel] = useState('easy');
  const [wordBank, setWordBank] = useState({
    easy: [],
    medium: [],
    hard: [],
  });
  const [currentWord, setCurrentWord] = useState(null);
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [correctWord, setCorrectWord] = useState('');
  const [message, setMessage] = useState('');
  const [usedWords, setUsedWords] = useState([]);
  const [levelCount, setLevelCount] = useState(0);
  const [isLoadingWords, setIsLoadingWords] = useState(false);

  // --- Bonus Round State ---
  const [isBonusRound, setIsBonusRound] = useState(false);
  const [bonusPhrase, setBonusPhrase] = useState(null);
  const [bonusInput, setBonusInput] = useState('');
  const [bonusAttempts, setBonusAttempts] = useState(0);
  const [bonusMessage, setBonusMessage] = useState('');
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // --- Leaderboard State ---
  const [scores, setScores] = useState({
    easy: { national: [], global: [] },
    medium: { national: [], global: [] },
    hard: { national: [], global: [] },
  });

  // --- Score Submission State ---
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerCountry, setPlayerCountry] = useState('ZA');
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    fetchCountry();
    fetchAllScores();
  }, []);

  // Load words when level changes
  useEffect(() => {
    if (page === 'game' && wordBank[level].length === 0 && !isLoadingWords) {
      loadWordsForLevel(level);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, level, wordBank]);

  // ============================================================
  // COUNTRY DETECTION
  // ============================================================

  const fetchCountry = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      setPlayerCountry(data.country_code || 'ZA');
    } catch (error) {
      setPlayerCountry('ZA');
    }
  };

  // ============================================================
  // SUPABASE — LEADERBOARD
  // ============================================================

  const fetchAllScores = async () => {
    const levels = ['easy', 'medium', 'hard'];
    const categories = ['national', 'global'];
    const newScores = {
      easy: { national: [], global: [] },
      medium: { national: [], global: [] },
      hard: { national: [], global: [] },
    };

    for (const lvl of levels) {
      for (const cat of categories) {
        const { data, error } = await supabase
          .from('scores')
          .select('name, score, country')
          .eq('level', lvl)
          .eq('category', cat)
          .order('score', { ascending: false })
          .limit(10);

        if (!error && data) {
          newScores[lvl][cat] = data;
        }
      }
    }
    setScores(newScores);
  };

  // ============================================================
  // API — LOAD WORDS
  // ============================================================

  const loadWordsForLevel = async (currentLevel) => {
    setIsLoadingWords(true);
    const count = currentLevel === 'easy' ? 20 : currentLevel === 'medium' ? 25 : 30;
    const words = await fetchMultipleWords(count);
    setWordBank((prev) => ({
      ...prev,
      [currentLevel]: words,
    }));
    setIsLoadingWords(false);
  };

  // ============================================================
  // BONUS ROUND
  // ============================================================

  const startBonusRound = () => {
    const randomIndex = Math.floor(Math.random() * bonusPhrases.length);
    const phrase = bonusPhrases[randomIndex];
    setBonusPhrase(phrase);
    setBonusInput('');
    setBonusAttempts(0);
    setBonusMessage('');
    setIsBonusRound(true);
    setShowSubscriptionPrompt(false);
  };

  const handleBonusSubmit = (e) => {
    e.preventDefault();
    if (!bonusPhrase) return;
    const newAttempts = bonusAttempts + 1;
    setBonusAttempts(newAttempts);

    if (bonusInput.toLowerCase().trim() === bonusPhrase.answer.toLowerCase()) {
      setBonusMessage('🎉 Correct! You solved the bonus puzzle!');
      if (isPremium) {
        setTimeout(() => {
          setIsBonusRound(false);
          setBonusMessage('');
          nextWord(level, [...usedWords]);
        }, 1500);
      } else {
        setTimeout(() => {
          setShowSubscriptionPrompt(true);
        }, 1500);
      }
    } else {
      if (newAttempts >= 3) {
        setBonusMessage(`❌ The answer was: "${bonusPhrase.answer}"`);
        setTimeout(() => {
          setShowSubscriptionPrompt(true);
        }, 2000);
      } else {
        setBonusMessage(`❌ Wrong. ${3 - newAttempts} attempts left.`);
        setBonusInput('');
      }
    }
  };

  const handleSubscribe = () => {
    setIsPremium(true);
    setShowSubscriptionPrompt(false);
    setBonusMessage('🎉 You are now a premium player! Enjoy unlimited bonus levels!');
    setTimeout(() => {
      setIsBonusRound(false);
      setBonusMessage('');
      setShowSubscriptionPrompt(false);
      nextWord(level, [...usedWords]);
    }, 2000);
  };

  // ============================================================
  // GAME LOGIC
  // ============================================================

  const startGame = (selectedLevel) => {
    setLevel(selectedLevel);
    setScore(0);
    setStreak(0);
    setUsedWords([]);
    setMessage('');
    setAttempts(0);
    setGameOver(false);
    setShowNameEntry(false);
    setCorrectWord('');
    setLevelCount(0);
    setIsBonusRound(false);
    setShowSubscriptionPrompt(false);
    setIsPremium(false);
    setPage('game');
  };

  const nextWord = (currentLevel, used) => {
    // Check for bonus round (every 10 levels)
    if (levelCount > 0 && levelCount % 10 === 0 && !isBonusRound && !showSubscriptionPrompt) {
      startBonusRound();
      return;
    }

    const bank = wordBank[currentLevel] || [];
    const available = bank.filter((word) => !used.includes(word));

    if (available.length === 0) {
      loadWordsForLevel(currentLevel);
      setMessage('🎉 Loading more words...');
      return;
    }

    const randomWord = available[Math.floor(Math.random() * available.length)];
    setCurrentWord(randomWord);
    setScrambled(shuffleWord(randomWord));
    setInput('');
    setAttempts(0);
    setUsedWords([...used, randomWord]);
  };

  const endGame = () => {
    setGameOver(true);
    const allScores = [...scores[level].national, ...scores[level].global];
    const lowestTopScore = allScores.length > 0
      ? Math.min(...allScores.map((s) => s.score))
      : 0;

    if (score > 0 && (allScores.length < 10 || score > lowestTopScore)) {
      setShowNameEntry(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentWord || gameOver || isBonusRound) return;

    if (input.toUpperCase() === currentWord) {
      setScore(score + 1);
      setStreak(streak + 1);
      setLevelCount(levelCount + 1);
      setMessage('✅ Correct!');
      setTimeout(() => {
        setMessage('');
        nextWord(level, [...usedWords, currentWord]);
      }, 500);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setStreak(0);

      if (newAttempts >= 6) {
        setCorrectWord(currentWord);
        setMessage(`❌ Game Over — The word was: ${currentWord}`);
        endGame();
      } else {
        setMessage(`❌ Wrong. ${6 - newAttempts} attempts left.`);
        setInput('');
      }
    }
  };

  // ============================================================
  // SUPABASE — SAVE SCORE
  // ============================================================

  const saveScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setIsLoading(true);

    try {
      const category = playerCountry === 'ZA' ? 'national' : 'global';
      const { error } = await supabase
        .from('scores')
        .insert([
          {
            name: playerName.trim().slice(0, 20),
            score: score,
            level: level,
            country: playerCountry,
            category: category,
          }
        ]);

      if (error) {
        console.error('Supabase error:', error);
        alert('Failed to save score. Please try again.');
      } else {
        await fetchAllScores();
        setShowNameEntry(false);
        setPage('scores');
      }
    } catch (error) {
      console.error('Error saving score:', error);
      alert('Failed to save score. Please try again.');
    }
    setIsLoading(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  // --- Menu ---
  if (page === 'menu') {
    return (
      <div className="container menu">
        <h1>🔤 Word Puzzle</h1>
        <button onClick={() => setPage('help')}>HELP</button>
        <button onClick={() => setPage('levelSelect')} className="play">PLAY</button>
        <button onClick={() => setPage('scores')} className="scores">🏆 HIGHEST SCORES</button>
      </div>
    );
  }

  // --- Level Selection ---
  if (page === 'levelSelect') {
    return (
      <div className="container menu">
        <h2>Select Difficulty</h2>
        <button onClick={() => startGame('easy')} className="easy">🟢 Easy</button>
        <button onClick={() => startGame('medium')} className="medium">🟡 Medium</button>
        <button onClick={() => startGame('hard')} className="hard">🔴 Hard</button>
        <button onClick={() => setPage('menu')}>⬅ Back</button>
      </div>
    );
  }

  // --- Help ---
  if (page === 'help') {
    return (
      <div className="container help">
        <h2>How to Play</h2>
        <p>Unscramble the letters to form the correct word.</p>
        <p>Choose <strong>Easy, Medium, or Hard</strong> difficulty.</p>
        <p>You have <strong>6 attempts</strong> per word.</p>
        <p>Every <strong>10th level</strong> is a <strong>bonus round</strong>!</p>
        <p>Subscribe for <strong>R20/month</strong> to unlock unlimited bonus levels!</p>
        <button onClick={() => setPage('menu')}>⬅ Back</button>
      </div>
    );
  }

  // --- Scores ---
  if (page === 'scores') {
    const levels = ['easy', 'medium', 'hard'];
    const labels = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' };

    return (
      <div className="container scores">
        <h2>🏆 Highest Scores</h2>
        {levels.map((lvl) => (
          <div key={lvl} className="level-board">
            <h3>{labels[lvl]}</h3>
            <div className="leaderboard">
              <div className="board-column">
                <h4>🇿🇦 National</h4>
                {scores[lvl]?.national?.length === 0 ? (
                  <p className="no-scores">No scores yet.</p>
                ) : (
                  <ol>
                    {scores[lvl]?.national?.map((s, i) => (
                      <li key={i}>{s.name} — {s.score} pts</li>
                    ))}
                  </ol>
                )}
              </div>
              <div className="board-column">
                <h4>🌍 Global</h4>
                {scores[lvl]?.global?.length === 0 ? (
                  <p className="no-scores">No scores yet.</p>
                ) : (
                  <ol>
                    {scores[lvl]?.global?.map((s, i) => (
                      <li key={i}>{getFlagEmoji(s.country)} {s.name} — {s.score} pts</li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        ))}
        <button onClick={() => setPage('menu')}>⬅ Back</button>
      </div>
    );
  }

  // --- Name Entry ---
  if (showNameEntry) {
    return (
      <div className="container name-entry">
        <h2>🏅 New High Score!</h2>
        <p>You scored <strong>{score}</strong> points on <strong>{level}</strong>!</p>
        <form onSubmit={saveScore}>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name (max 20 chars)"
            maxLength={20}
            required
            autoFocus
            disabled={isLoading}
          />
          <p>Country: {playerCountry}</p>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Score'}
          </button>
        </form>
        <button onClick={() => { setShowNameEntry(false); setPage('menu'); }}>Skip</button>
      </div>
    );
  }

  // --- Subscription Prompt ---
  if (showSubscriptionPrompt) {
    return (
      <div className="container subscription-prompt">
        <h2>🌟 Unlock Unlimited Bonus Levels!</h2>
        <p>You've just experienced a bonus round!</p>
        <p>Subscribe now to get:</p>
        <ul style={{ textAlign: 'left', margin: '10px auto', maxWidth: '300px' }}>
          <li>✅ Unlimited bonus levels</li>
          <li>✅ Ad-free experience</li>
          <li>✅ Extra hints</li>
        </ul>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
          R20/month
        </p>
        <button onClick={handleSubscribe} className="subscribe-btn">
          🚀 Subscribe Now
        </button>
        <button 
          onClick={() => {
            setShowSubscriptionPrompt(false);
            setIsBonusRound(false);
            setBonusMessage('');
            nextWord(level, [...usedWords]);
          }} 
          className="skip-btn"
        >
          Skip for now
        </button>
      </div>
    );
  }

  // --- Bonus Round ---
  if (isBonusRound) {
    return (
      <div className="container game bonus-round">
        <h2>🎯 Bonus Round!</h2>
        <p style={{ fontSize: '1.1rem' }}>{bonusPhrase?.hint || 'Can you guess the hidden phrase?'}</p>
        <div style={{ fontSize: '3rem', letterSpacing: '10px', padding: '20px', background: '#f1f5f9', borderRadius: '16px', margin: '10px 0' }}>
          {bonusPhrase?.image || '🔍'}
        </div>
        <form onSubmit={handleBonusSubmit}>
          <input
            type="text"
            value={bonusInput}
            onChange={(e) => setBonusInput(e.target.value)}
            placeholder="Type the phrase..."
            autoFocus
            disabled={bonusMessage.includes('Correct')}
          />
          <button type="submit" disabled={bonusMessage.includes('Correct')}>Submit</button>
        </form>
        {bonusMessage && <p className="message">{bonusMessage}</p>}
        <button onClick={() => { if (!isPremium) { setShowSubscriptionPrompt(true); setIsBonusRound(false); } }} className="exit">
          Exit Bonus
        </button>
      </div>
    );
  }

  // --- Game Screen ---
  return (
    <div className="container game">
      <h2>Word Puzzle — {level.charAt(0).toUpperCase() + level.slice(1)}</h2>

      <div className="stats">
        <span>⭐ Score: {score}</span>
        <span>🔥 Streak: {streak}</span>
        <span>💪 Attempts: {attempts}/6</span>
        <span>🎯 Level: {levelCount + 1}</span>
      </div>

      {isLoadingWords ? (
        <p>Loading words...</p>
      ) : !gameOver && currentWord ? (
        <>
          <div className="word-display">{scrambled}</div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type the word..."
              autoFocus
              disabled={gameOver}
            />
            <button type="submit" disabled={gameOver}>Submit</button>
          </form>
          {message && <p className="message">{message}</p>}
        </>
      ) : (
        <div>
          <p className="message">{message}</p>
          {correctWord && (
            <p className="correct-word">The word was: <strong>{correctWord}</strong></p>
          )}
          <button onClick={() => startGame(level)} className="play-again">Play Again</button>
        </div>
      )}

      {gameOver && !showNameEntry && (
        <button onClick={() => startGame(level)} className="play-again">Play Again</button>
      )}

      <button onClick={() => setPage('menu')} className="exit">Exit</button>
    </div>
  );
}

export default App;
