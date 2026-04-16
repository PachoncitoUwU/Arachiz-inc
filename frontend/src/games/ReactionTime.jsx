import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from './GameLayout';
import { fetchLB, saveGameScore, getCachedLB } from './gameUtils';

export default function ReactionTime({ onClose, currentUser }) {
  const [phase,   setPhase]   = useState('idle');   // idle | waiting | ready | result | dead
  const [ms,      setMs]      = useState(null);
  const [best,    setBest]    = useState(null);
  const [pos,     setPos]     = useState({ x:50, y:50 });
  const [lb,      setLb]      = useState(getCachedLB('reaction'));
  const timerRef  = useRef(null);
  const startRef  = useRef(null);
  const savedRef  = useRef(false);

  useEffect(() => { fetchLB('reaction').then(d => setLb(d)); }, []);

  const startRound = useCallback(() => {
    setPhase('waiting'); setMs(null);
    const delay = 1500 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setPos({ x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 });
      setPhase('ready');
      startRef.current = performance.now();
    }, delay);
  }, []);

  const handleTap = useCallback(() => {
    if (phase === 'idle' || phase === 'result') { startRound(); return; }
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      setPhase('dead'); return; // tocó demasiado pronto
    }
    if (phase === 'ready') {
      const elapsed = Math.round(performance.now() - startRef.current);
      setMs(elapsed);
      setBest(prev => prev === null ? elapsed : Math.min(prev, elapsed));
      setPhase('result');
      // Guardar si es mejor
      if (!savedRef.current || elapsed < (best || Infinity)) {
        savedRef.current = true;
        saveGameScore('reaction', elapsed).then(() => fetchLB('reaction').then(d => setLb(d)));
      }
    }
  }, [phase, best, startRound]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleTap(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timerRef.current); };
  }, [handleTap, onClose]);

  const BG = {
    idle:    'linear-gradient(135deg,#1e293b,#0f172a)',
    waiting: 'linear-gradient(135deg,#1e293b,#0f172a)',
    ready:   'linear-gradient(135deg,#14532d,#166534)',
    result:  'linear-gradient(135deg,#1e3a5f,#1e40af)',
    dead:    'linear-gradient(135deg,#7f1d1d,#991b1b)',
  };

  const MSG = {
    idle:    { emoji:'⚡', text:'Toca para empezar', sub:'Reacciona cuando aparezca el objetivo' },
    waiting: { emoji:'👀', text:'Espera...', sub:'No toques todavía' },
    ready:   { emoji:'🎯', text:'¡AHORA!', sub:'Toca lo más rápido que puedas' },
    result:  { emoji:'✅', text:`${ms} ms`, sub: ms < 200 ? '🏎️ Reflejos de F1!' : ms < 300 ? '⚡ Muy rápido' : ms < 500 ? '👍 Bien' : '🐢 Puedes mejorar' },
    dead:    { emoji:'❌', text:'¡Demasiado pronto!', sub:'Espera a que aparezca el objetivo' },
  };

  const info = MSG[phase] || MSG.idle;

  return (
    <GameLayout
      title="⚡ Reacción"
      score={best ?? 0}
      lb={lb}
      game="reaction"
      onClose={onClose}
    >
      <div
        onClick={e => { e.stopPropagation(); handleTap(); }}
        style={{
          width:300, height:300, borderRadius:20, cursor:'pointer',
          background: BG[phase], position:'relative', overflow:'hidden',
          border:'1.5px solid rgba(255,255,255,0.15)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:8, transition:'background 0.3s',
          userSelect:'none',
        }}
      >
        {/* Objetivo */}
        {phase === 'ready' && (
          <div style={{
            position:'absolute',
            left:`${pos.x}%`, top:`${pos.y}%`,
            transform:'translate(-50%,-50%)',
            width:60, height:60, borderRadius:'50%',
            background:'#22c55e',
            boxShadow:'0 0 30px #22c55e, 0 0 60px #22c55e55',
            animation:'pulse 0.3s ease-in-out infinite alternate',
          }}/>
        )}
        <style>{`@keyframes pulse{from{transform:translate(-50%,-50%) scale(1)}to{transform:translate(-50%,-50%) scale(1.15)}}`}</style>

        <span style={{ fontSize:48, zIndex:1 }}>{info.emoji}</span>
        <p style={{ color:'white', fontWeight:800, fontSize:22, margin:0, zIndex:1, letterSpacing:'-0.5px' }}>{info.text}</p>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, margin:0, zIndex:1 }}>{info.sub}</p>
        {best !== null && phase !== 'ready' && (
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, margin:0, zIndex:1 }}>Mejor: {best} ms</p>
        )}
      </div>
      <p style={{ color:'rgba(0,0,0,0.3)', fontSize:10, margin:0 }}>Espacio / Toca · ESC cierra</p>
    </GameLayout>
  );
}
