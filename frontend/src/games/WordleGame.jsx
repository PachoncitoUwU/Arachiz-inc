import React, { useState, useEffect, useCallback } from 'react';
import GameLayout from './GameLayout';
import { fetchLB, saveGameScore, getCachedLB } from './gameUtils';

// ── Palabra configurable sin rediseñar el juego ──────────────────────────────
// Cambiar aquí o en variable de entorno VITE_WORDLE_WORD
const WORD = (import.meta.env.VITE_WORDLE_WORD || 'FICHA').toUpperCase().slice(0, 5);
const MAX_ATTEMPTS = 6;

// Teclado QWERTY en español
const KEYBOARD = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L','Ñ'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

const evaluate = (guess, word) =>
  guess.split('').map((l, i) => ({
    letter: l,
    state: l === word[i] ? 'correct' : word.includes(l) ? 'present' : 'absent',
  }));

const STATE_COLORS = {
  correct: { bg:'#34A853', text:'white' },
  present: { bg:'#FBBC05', text:'white' },
  absent:  { bg:'#374151', text:'white' },
  empty:   { bg:'rgba(255,255,255,0.15)', text:'#1d1d1f' },
  active:  { bg:'rgba(255,255,255,0.4)', text:'#1d1d1f' },
};

export default function WordleGame({ onClose, currentUser }) {
  const [guesses,  setGuesses]  = useState([]); // [{letter,state}[]]
  const [current,  setCurrent]  = useState('');
  const [phase,    setPhase]    = useState('playing'); // playing | won | lost
  const [lb,       setLb]       = useState(getCachedLB('wordle'));
  const [shake,    setShake]    = useState(false);
  const savedRef = React.useRef(false);

  useEffect(() => { fetchLB('wordle').then(d => setLb(d)); }, []);

  useEffect(() => {
    if (phase === 'won' && !savedRef.current) {
      savedRef.current = true;
      const attempts = guesses.length;
      saveGameScore('wordle', attempts).then(() => fetchLB('wordle').then(d => setLb(d)));
    }
  }, [phase, guesses]);

  const submit = useCallback(() => {
    if (current.length !== 5) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    const result = evaluate(current, WORD);
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);
    setCurrent('');
    if (current === WORD) { setPhase('won'); return; }
    if (newGuesses.length >= MAX_ATTEMPTS) setPhase('lost');
  }, [current, guesses]);

  const pressKey = useCallback((key) => {
    if (phase !== 'playing') return;
    if (key === '⌫' || key === 'Backspace') { setCurrent(p => p.slice(0, -1)); return; }
    if (key === 'ENTER' || key === 'Enter') { submit(); return; }
    if (/^[A-ZÑ]$/.test(key) && current.length < 5) setCurrent(p => p + key);
  }, [phase, current, submit]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      pressKey(e.key === 'Backspace' ? '⌫' : e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pressKey, onClose]);

  // Mapa de colores por letra para el teclado
  const letterStates = {};
  guesses.flat().forEach(({ letter, state }) => {
    if (!letterStates[letter] || state === 'correct') letterStates[letter] = state;
  });

  const restart = () => {
    savedRef.current = false;
    setGuesses([]); setCurrent(''); setPhase('playing');
  };

  const score = phase === 'won' ? guesses.length : 0;

  return (
    <GameLayout title="📝 Wordle" score={score} lb={lb} game="wordle" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>

        {/* Grid de intentos */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {Array.from({ length: MAX_ATTEMPTS }).map((_, row) => {
            const guess = guesses[row];
            const isActive = row === guesses.length && phase === 'playing';
            const letters = isActive ? current.padEnd(5, ' ').split('') : (guess ? guess.map(g => g.letter) : Array(5).fill(' '));
            const states  = guess ? guess.map(g => g.state) : Array(5).fill(isActive ? 'active' : 'empty');

            return (
              <div key={row} style={{ display:'flex', gap:4, animation: isActive && shake ? 'shake 0.4s ease' : 'none' }}>
                {letters.map((l, col) => {
                  const s = STATE_COLORS[states[col]] || STATE_COLORS.empty;
                  return (
                    <div key={col} style={{
                      width:44, height:44, borderRadius:8,
                      background: s.bg, color: s.text,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:18, fontWeight:800, letterSpacing:0,
                      border: states[col] === 'empty' || states[col] === 'active' ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
                      transition:'background 0.2s',
                    }}>
                      {l.trim()}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Resultado */}
        {phase !== 'playing' && (
          <div style={{ textAlign:'center' }}>
            {phase === 'won'
              ? <p style={{ color:'#34A853', fontWeight:800, fontSize:16, margin:'4px 0' }}>🎉 ¡Correcto en {guesses.length} intentos!</p>
              : <p style={{ color:'#EA4335', fontWeight:800, fontSize:16, margin:'4px 0' }}>La palabra era: <strong>{WORD}</strong></p>
            }
            <button onClick={restart}
              style={{ background:'#007aff', color:'white', border:'none', borderRadius:18, padding:'8px 22px', fontSize:13, fontWeight:700, cursor:'pointer', marginTop:4 }}>
              Jugar de nuevo
            </button>
          </div>
        )}

        {/* Teclado */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {KEYBOARD.map((row, ri) => (
            <div key={ri} style={{ display:'flex', gap:3, justifyContent:'center' }}>
              {row.map(key => {
                const st = letterStates[key];
                const col = st ? STATE_COLORS[st] : { bg:'rgba(255,255,255,0.55)', text:'#1d1d1f' };
                const isWide = key === 'ENTER' || key === '⌫';
                return (
                  <button key={key} onClick={() => pressKey(key)}
                    style={{
                      width: isWide ? 52 : 32, height:36, borderRadius:7, border:'none',
                      background: col.bg, color: col.text,
                      fontSize: isWide ? 10 : 13, fontWeight:700, cursor:'pointer',
                      backdropFilter:'blur(8px)', transition:'background 0.2s',
                    }}>
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <p style={{ color:'rgba(0,0,0,0.3)', fontSize:10, margin:0 }}>Teclado físico o virtual · ESC cierra</p>
      </div>
    </GameLayout>
  );
}
