import React, { useState, useEffect } from 'react';

import RacerStates from './RacerStates';

import ActiveRacer from './ActiveRacer';

import socket from './socket';

import './TypeRacer.css';

import confetti from 'canvas-confetti';

import RaceCanvas from './RaceCanvas';

const TypeRacer = ({ quote, onFinish, racerState, ...props }) => {
  console.log(racerState);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [players, setPlayers] = useState([]);
  const [fontSize, setFontSize] = useState(24);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [showPBNotification, setShowPBNotification] = useState(false);

  const increaseFontSize = () => {
    setFontSize((prevSize) => Math.min(prevSize + 4, 48));
  }

  const decreaseFontSize = () => {
    setFontSize((prevSize) => Math.max(prevSize - 4, 16));
  }

  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('personalBestWPM');
    return saved ? Number(saved) : 0;
  });

  useEffect (() => {
    if (!socket) return;

    socket.on('updatePlayers', (serverPlayers) => {
      setPlayers(serverPlayers);
    });

    socket.on('gameStart', (data) => {
      console.log('Game started:', data);
    })

    socket.on('gameOver', (data) => {
      console.log('Game over!, Winner:', data.winner);
    });

    return () => {
      socket.off('updatePlayers');
      socket.off('gameStart');
      socket.off('gameOver');
    };
  }, [socket]);


  function finishedRacing({ finalWpm, finalAccuracy}) {
    setWpm(finalWpm);
    setAccuracy(finalAccuracy);


    if (finalWpm > highScore) {
      setHighScore(finalWpm);
      setShowPBNotification(true);
      localStorage.setItem('personalBestWPM', finalWpm);

      setTimeout(() => {
        setShowPBNotification(false);
      }, 3000);
    }

    if (onFinish) {
      onFinish({ finalWpm, finalAccuracy});
    }
  }


  if (racerState === RacerStates.WAITING) {
    return (
      <h2>Please wait for game to start.</h2>
    );
  }

  if (racerState === RacerStates.IN_PROGRESS) {
    return (
      <div className="racer-container">
        <div className="font-controls" style={{ marginBottom: '10px', textAlign: 'center'}}>
          <button onClick={decreaseFontSize}>A-</button>
          <span style={{ margin: '0 10px' }}>{fontSize}px</span>
          <button onClick={increaseFontSize}>A+</button>
        </div>

        <ActiveRacer 
        quote={quote} onFinish={finishedRacing} players={players} highScore={highScore} fontSize={fontSize}  {...props} />
      </div>
    );
  }

  if (racerState === RacerStates.FINISHED) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    return (
      <div className="game-over">
        {showPBNotification && (
          <div style={{
            backgroundColor: '#07f33a',
            color: '#000',
            padding: '10px 15px',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
           🎉 New Personal Best
          </div>
        )}
        <h2>
          {`Race Over! Congrats, you typed ${wpm} words per minute and your accuracy was ${accuracy}%!`}
        </h2>
        {/* <p>Player {winnerplayerId} won the race!</p> */}
      </div>
    );
  }

  return (
    <h2>Unknown game state.</h2>
  );
};

export default TypeRacer;
