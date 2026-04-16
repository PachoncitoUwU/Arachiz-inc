import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from './GameLayout';
import { fetchLB, saveGameScore, getCachedLB } from './gameUtils';

const COLORS = [
  { id:0, bg:'#EA4335', light:'#ff6b6b', freq:261 },
  { id:1, bg:'#4285F4', light:'#74a9ff', freq:329 },
  { id:2, bg:'#34A853', light:'#5dd87a', freq:392 },
  { id:3, bg:'#FBBC05', light:'#ffd740', freq:523 },
];

const playTone = (freq, duration = 300) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(); osc.stop(ctx.currentTime + duration / 1000);
  } catch {}
};

export default function MemoryFlash({ onClose, currentUser }) {
  const [sequence,  setSequence]  = useState([]);
  const [userSeq,   setUserSeq]   = useState([]);
  const [phase,     setPhase]     = useState('idle'); // idle | showing | input | dead
  const [active,    setActive]    = useState(null);
  const [score,     setScore]     = useState(0);
  const [lb,        setLb]        = useState(getCachedLB('memory'));
  const savedRef = useRef(false);

  useEffect(() => { fetchLB('memory').then(d => setLb(d)); }, []);

  useEffect(() => {
    if (phase === 'dead' && !savedRef.current && score > 0) {
      savedRef.current = true;
      saveGameScore('memory', score).then(() => fetchLB('memory').then(d => setLb(d)));
    }
  }, [phase, score]);

  const showSequence = useCallback(async (seq) => {
    setPhase('showing');
    const delay = Math.max(300, 600 - seq.length * 20);
    for (const id of seq) {
      await new Promise(r => setTimeout(r, delay));
      setActive(id); playTone(COLORS[id].freq, delay * 0.8);
      await new Promise(r => setTimeout(r, delay * 0.8));
      setActive(null);
      await new Promise(r => setTimeout(r, delay * 0.2));
    }
    setPhase('input');
  }, []);

  const startGame = useCallback(() => {
    savedRef.current = false;
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first); setUserSeq([]); setScore(0);
    showSequence(first);
  }, [showSequence]);

  const handlePress = useCallback((id) => {
    if (phase !== 'input') return;
    playTone(COLORS[id].freq, 200);
    setActive(id);
    setTimeout(() => setActive(null), 200);

    const newUserSeq = [...userSeq, id];
    const pos = newUserSeq.length - 1;

    if (newUserSeq[pos] !== sequence[pos]) {
      setPhase('dead'); return;
    }

    if (newUserSeq.length === sequence.length) {
      const newScore = sequence.length;
      setScore(newScore);
      setUserSeq([]);
      const next = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(next);
      setTimeout(() => showSequence(next), 600);
    } else {
      setUserSeq(newUserSeq);
    }
  }, [phase, userSeq, sequence, showSequence]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const btnStyle = (color, isActive) => ({
    width: 120, height: 120, borderRadius: 20, border: 'none', cursor: 'pointer',
    background: isActive ? color.light : color.bg,
    boxShadow: isActive ? `0 0 30px ${color.light}` : `0 4px 16px ${color.bg}55`,
    transform: isActive ? 'scale(1.08)' : 'scale(1)',
    transition: 'all 0.12s ease',
    opacity: phase === 'showing' ? 0.7 : 1,
  });

  return (
    <GameLayout title="🧠 Memory Flash" score={score} lb={lb} game="memory" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'8px 0' }}>
        {phase === 'idle' && (
          <button onClick={startGame}
            style={{ background:'#007aff', color:'white', border:'none', borderRadius:22, padding:'12px 32px', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(0,122,255,0.4)' }}>
            Iniciar
          </button>
        )}

        {phase === 'dead' && (
          <div style={{ textAlign:'center' }}>
            <p style={{ color:'#EA4335', fontWeight:800, fontSize:18, margin:'0 0 8px' }}>¡Fallaste!</p>
            <p style={{ color:'#6e6e73', fontSize:13, margin:'0 0 12px' }}>{score} rondas completadas</p>
            <button onClick={startGame}
              style={{ background:'#007aff', color:'white', border:'none', borderRadius:20, padding:'10px 24px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Try Again
            </button>
          </div>
        )}

        {(phase === 'showing' || phase === 'input') && (
          <p style={{ color:'#6e6e73', fontSize:12, margin:0 }}>
            {phase === 'showing' ? '👀 Memoriza la secuencia...' : '👆 Tu turno'}
          </p>
        )}

        {/* Grid 2x2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {COLORS.map(color => (
            <button key={color.id}
              style={btnStyle(color, active === color.id)}
              onClick={() => handlePress(color.id)}
              disabled={phase !== 'input'}
            />
          ))}
        </div>

        {phase !== 'idle' && phase !== 'dead' && (
          <p style={{ color:'rgba(0,0,0,0.3)', fontSize:10, margin:0 }}>
            Ronda {sequence.length} · ESC cierra
          </p>
        )}
      </div>
    </GameLayout>
  );
}
