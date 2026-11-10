import React, { useState, useEffect } from 'react';

import socket from './socket';

import RaceCanvas from './RaceCanvas';

import useInterval from './useInterval';

import QuoteMap from './QuoteMap';

import ProgressBar from './ProgressBar';

import CheckedQuote from './CheckedQuote';
import CheckedInput from './CheckedInput';

import firstMismatchPosition from './firstMismatchPosition';
import createTypingIntervals from './createTypingIntervals';

const getOffsetMismatchPosition = (offset, word, input) => {
  const inputMismatchPosition = firstMismatchPosition(word, input);

  return offset + Math.min(input.length, inputMismatchPosition);
};

/**
 * FIXME: This component should be renderable even if we've typed everything.
 * Otherwise, we rely on the parent component to ensure we don't get rendered.
 *
 * It's not renderable because it relies on wordIndex to decide what to display,
 * but after the race has finished we can't increment wordIndex and re-render because
 * wordIndex will be beyond the end of the list of words.
 *
 * But if we don't increment it, it will render as if we have yet to type the last word.
 */
const ActiveRacer = ({ quote, onFinish, emit, playerId, players, playersPct, highScore, fontSize }) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [currentWpm, setCurrentWpm] = useState(0);
  const [pctTyped, setPctTyped] = useState(0);
  const [racerState, setRacerState] = useState('RacerStates.IN_PROGRESS');

  const quoteMap = QuoteMap({ quote });

  const currentWord = quoteMap.getWord(wordIndex);
  const currentOffset = quoteMap.getWordOffset(wordIndex);

  const cursorPosition = currentOffset + currentInput.length;

  const quoteMismatchPos = getOffsetMismatchPosition(currentOffset, currentWord.text, currentInput);

  const typingIntervals = createTypingIntervals(0, quoteMismatchPos, cursorPosition, quote.length);

  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [errors, setErrors] = useState(0);

  const [countdown, setCountDown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(true);

  const [darkMode, setDarkMode] = useState(false);

  const [streak, setStreak] = useState(0);

  const [showStats, setShowStats] = useState(true);
  
    const toggleDarkMode = () => {
      setDarkMode((prev) => !prev);
    }
  

  useEffect(() => {
    if (!isCountingDown) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountDown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsCountingDown(false);
    }
  }, [countdown, isCountingDown]);

  // const storageKey = `personalBestWPM_${playerId}`;

  // const [highScore, setHighScore] = useState(() => {
  //   if (!playerId) return 0;
  //   const saved = localStorage.getItem(storageKey);
  //   return saved ? Number(saved) : 0;
  // });

  // useEffect(() => {
  //   if (!playerId) {
  //     const saved = localStorage.getItem(storageKey);
  //     setHighScore(saved ? Number(saved) : 0);
  //   }
  // }, [playerId, storageKey]);

  // const handleFinishRacing = ({ finalWpm, finalAccuracy }) => {
  //   if (finalWpm > highScore) {
  //     setHighScore(finalWpm);
  //     if (playerId) {
  //       localStorage.setItem(storageKey, finalWpm);
  //     }
  //   }
  //   if (onFinish) {
  //     onFinish({ finalWpm, finalAccuracy });
  //   }
  // };

  useEffect(() => {
    if (!socket) return;
  
    socket.on('gameOver', (data) => {
      setRacerState(racerState.FINISHED);
    });

    return () => {
      socket.off('gameOver');
    };
  }, [socket]);

  useInterval((elapsed) => {
    const wordsTyped = wordIndex;
    const elapsedMin = elapsed / (60 * 1000);

    const wpm = wordsTyped > 0 ? wordsTyped / elapsedMin : 0;

    setCurrentWpm(Math.floor(wpm));
  }, 500);

  const accuracy = totalKeystrokes > 0 ? Math.max(0, Math.round(((totalKeystrokes - errors) / totalKeystrokes) * 100)) : 100;
  useEffect(() => {
    emit('game.player.pct', { id: playerId, pct: pctTyped });
  }, [pctTyped]);

  const handleMistake = () => {
    setErrors((prev) => prev + 1);
    setTotalKeystrokes((prev) => prev + 1);
    setStreak(0);
  };

  const handleCorrectKey = () => {
    setTotalKeystrokes((prev) => prev + 1);
  };

  const handleCorrectWord = () => {
    setStreak((prevStreak) => prevStreak + 1);
  };
 
  const getWPMcolor = (currentWpm) => {
    if (currentWpm >= 80) return 'rgb(247, 8, 8)'; // Super Fast
    if (currentWpm >= 60) return 'rgb(229, 155, 17)'; 
    if (currentWpm >= 40) return 'rgb(233, 229, 10)';
    return 'rgb(34, 6, 243)';
  } 

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#07f33a';
    if (accuracy >= 85) return '#fbae09';
    if (accuracy >= 75) return '#fd0808';
    return '#FFFF00';
   };

  const getWPMglow = (currentWpm) => {
     if (currentWpm >= 80) return '0 0 15px #f70a0a'; // Super Fast
    if (currentWpm >= 60) return '0 0 15px #eab308'; 
    if (currentWpm >= 40) return '0 0 15px #dff309';
    return 'none';
  }

  const getPersonalBestColor = (highScore) => {
    if (highScore >= 80) return '#07f33a';
    if (highScore >= 60) return '#fbae09';
    if (highScore >= 40) return '#fd0808';
    return '#ffffff';
  };

  const getStreakColor = (streak) => {
    if (streak >= 20) return '#fd0808';
    if (streak >= 10) return '#fbae09';
    if (streak >= 0) return '#dff309';
  }

  function onWordMatch() {
    setTotalKeystrokes((prev) => prev + 1);
    if (wordIndex < quoteMap.wordsCount() - 1) {
      setPctTyped((wordIndex + 1) / quoteMap.wordsCount());
      setWordIndex(wordIndex + 1);
    } else {
      setPctTyped(1);
      onFinish({ finalWpm: currentWpm, finalAccuracy: accuracy });
    }
  }

  return (
  <div className={darkMode ? "active-racer dark-mode" : "active-racer"}
    style={{
      boxShadow: getWPMglow(currentWpm),
      transition: 'box-shadow 0.4s ease',
      padding: '20px',
      borderRadius: '12px',
      overflow: 'visible'
    }}
  >
    <div style={{ textAlign: 'right', marginBottom: '10px' }}>
      <button
        type="button"
        onClick={toggleDarkMode}
        className="theme-toggle-btn"
        style={{ marginRight: '10px' }}
      >
        {darkMode ? '☀️Light Mode' : '🌙 Dark Mode'}
      </button>

      <button
        type="button"
        onClick={() => setShowStats(prev => !prev)}
        className="theme-toggle-btn"
      >
        {showStats ? '🫣 Hide Stats' : '👀 Show Stats'}
      </button>
    </div>

      <RaceCanvas players={players} playersPct={playersPct} />
      {isCountingDown ? (
        <div className="countdown-container" style={{ textAlign: 'center', margin: '15px 0' }}>
          <h2>Get Ready!</h2>
          <h1 style={{fontSize: '2.5rem', color: '#ff4757' }}>
            {countdown > 0 ? countdown : "GO!"}
          </h1>
        </div>
      ) : null}

      <form>
        <CheckedQuote
          quoteMap={quoteMap}
          currentWordIndex={wordIndex}
          currentInput={currentInput}
          cursorPosition={cursorPosition}
          typingIntervals={typingIntervals}
          fontSize={fontSize}
        />
        <CheckedInput
          expectedWord={currentWord}
          onInputChange={setCurrentInput}
          onWordMatch={onWordMatch}
          onMistake={handleMistake}
          onCorrectKey={handleCorrectKey}
          disabled={isCountingDown}
          countdown={countdown}
          onCorrectWord={handleCorrectWord}
        />
        {showStats && (<div>
          <strong>WPM: </strong>
          <span style={{ color: getWPMcolor(currentWpm), fontWeight: 'bold' }}>
          {currentWpm}
          </span>
          <strong style={{ marginLeft: '15px' }}>Accuracy: </strong>
          <span style={{ color: getAccuracyColor(accuracy), fontWeight: 'bold'}}>
          {accuracy}%
          </span>
          <strong style= {{ marginLeft: '15px' }}>Personal Best WPM: </strong>
          <span style={{ color: getPersonalBestColor(highScore), fontWeight: 'bold' }}>
          {highScore}
          </span>
          <strong style={{ marginLeft: '15px' }}>Accuracy Streak🔥: </strong>
          <span style={{ color: getStreakColor(streak), fontWeight: 'bold'}}>
          {streak}
          </span>
        </div>
      )}
      </form>
    </div>
  );
};

export default ActiveRacer;
