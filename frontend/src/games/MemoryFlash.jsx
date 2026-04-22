import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from './GameLayout';
import { fetchLB, saveGameScore, getCachedLB } from './gameUtils';

const COLORS = [
  { id:0, bg:'#EA4335', light:'#ff6b6b', freq:261 },
  { id:1, bg:'#4285F4', light:'#74a9ff', freq:329 },
  { id:2, bg:'#34A853', light:'#5dd87a', freq:392 },
  { id:3, bg:'#FBBC05', light:'#ffd740', freq:523 },
  { id:4, bg:'#9C27B0', light:'#ce93d8', freq:587 },
  { id:5, bg:'#FF5722', light:'#ff8a65', freq:659 },
  { id:6, bg:'#00BCD4', light:'#4dd0e1', freq:698 },
  { id:7, bg:'#8BC34A', light:'#aed581', freq:784 },
  { id:8, bg:'#E91E63', light:'#f48fb1', freq:830 },
  { id:9, bg:'#FF9800', light:'#ffb74d', freq:880 },
  { id:10, bg:'#009688', light:'#4db6ac', freq:932 },
  { id:11, bg:'#673AB7', light:'#9575cd', freq:988 },
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
  const fichaId = currentUser?.fichaId || null;
  const [lb,        setLb]        = useState(getCachedLB('memory', fichaId));
  const savedRef = useRef(false);

  useEffect(() => { fetchLB('memory', fichaId).then(d => setLb(d)); }, [fichaId]);

  useEffect(() => {
    if (phase === 'dead' && !savedRef.current && score > 0) {
      savedRef.current = true;
      saveGameScore('memory', score).then(() => fetchLB('memory', fichaId).then(d => setLb(d)));
    }
  }, [phase, score]);

  const showSequence = useCallback(async (seq) => {
    setPhase('showing');
    const delay = Math.max(200, 400 - seq.length * 15); // Más rápido
    for (const id of seq) {
      await new Promise(r => setTimeout(r, delay));
      setActive(id); playTone(COLORS[id % COLORS.length].freq, delay * 0.7);
      await new Promise(r => setTimeout(r, delay * 0.7));
      setActive(null);
      await new Promise(r => setTimeout(r, delay * 0.15));
    }
    setPhase('input');
  }, []);

  const startGame = useCallback(() => {
    savedRef.current = false;
    const first = [Math.floor(Math.random() * COLORS.length)];
    setSequence(first); setUserSeq([]); setScore(0);
    showSequence(first);
  }, [showSequence]);

  const handlePress = useCallback((id) => {
    if (phase !== 'input') return;
    playTone(COLORS[id % COLORS.length].freq, 200);
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
      const next = [...sequence, Math.floor(Math.random() * COLORS.length)];
      setSequence(next);
      setTimeout(() => showSequence(next), 600);
    } else {
      setUserSeq(newUserSeq);
    }
  }, [phase, userSeq, sequence, showSequence]);

  useEffect(() => {
    const onKey = (e) => { 
      if (e.key === 'Escape') {
        onClose();
      } else if (phase === 'dead' || phase === 'idle') {
        // Cualquier tecla reinicia el juego cuando está muerto o idle
        if (e.key === ' ' || e.key === 'Enter' || e.key.startsWith('Arrow') || 
            ['w','a','s','d','W','A','S','D'].includes(e.key)) {
          e.preventDefault();
          startGame();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, phase, startGame]);

  const btnStyle = (color, isActive) => {
    const isMobile = window.innerWidth < 700;
    return {
      width: isMobile ? 80 : 100, 
      height: isMobile ? 80 : 100, 
      borderRadius: 16, 
      border: 'none', 
      cursor: 'pointer',
      background: isActive ? color.light : color.bg,
      boxShadow: isActive
        ? `0 0 40px ${color.light}, 0 0 80px ${color.light}55`
        : `0 4px 16px ${color.bg}55`,
      filter: isActive ? 'brightness(1.8) saturate(1.5)' : 'none',
      transform: isActive ? 'scale(1.08)' : 'scale(1)',
      transition: 'all 0.12s ease',
      opacity: phase === 'showing' && active !== color.id ? 0.6 : 1,
    };
  };

  return (
    <GameLayout title="🧠 Memory Flash" score={score} lb={lb} game="memory" onClose={onClose} hasFicha={!!fichaId}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'8px 0', width:'100%', maxWidth:'min(450px, 95vw)' }}>
        {phase === 'idle' && (
          <button onClick={startGame}
            style={{ background:'#007aff', color:'white', border:'none', borderRadius:22, padding:'12px 32px', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(0,122,255,0.4)' }}>
            Iniciar
          </button>
        )}

        {phase === 'dead' && (
          <button onClick={startGame}
            style={{ background:'#007aff', color:'white', border:'none', borderRadius:22, padding:'12px 32px', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(0,122,255,0.4)' }}>
            ↻ Reiniciar
          </button>
        )}

        {(phase === 'showing' || phase === 'input') && (
          <p style={{ color:'#6e6e73', fontSize:12, margin:0 }}>
            {phase === 'showing' ? '👀 Memoriza la secuencia...' : '👆 Oprimir varias veces'}
          </p>
        )}

        {/* Grid 2x4 en móvil, 3x4 en desktop (12 colores) - Responsive */}
        <div style={{ 
          display:'grid', 
          gridTemplateColumns: window.innerWidth < 700 ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)', 
          gridTemplateRows: window.innerWidth < 700 ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: window.innerWidth < 700 ? 10 : 12,
          width:'100%',
          maxWidth: window.innerWidth < 700 ? '360px' : '460px'
        }}>
          {COLORS.map(color => (
            <button key={color.id}
              style={btnStyle(color, active === color.id)}
              onClick={() => handlePress(color.id)}
              disabled={phase !== 'input'}
            />
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
