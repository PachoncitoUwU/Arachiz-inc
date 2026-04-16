import React, { useRef, useState, useEffect, useCallback } from 'react';
import GameLayout from './GameLayout';
import { fetchLB, saveGameScore, getCachedLB } from './gameUtils';

const W = 300, H = 420, BASE_W = 180, BLOCK_H = 22, SPEED_INIT = 2.5;

export default function TowerStack({ onClose, currentUser }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const savedRef  = useRef(false);
  const [score,   setScore]   = useState(0);
  const [dead,    setDead]    = useState(false);
  const [lb,      setLb]      = useState(getCachedLB('tower'));
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => { fetchLB('tower').then(d => setLb(d)); }, []);

  useEffect(() => {
    if (dead && !savedRef.current && score > 0) {
      savedRef.current = true;
      saveGameScore('tower', score).then(() => fetchLB('tower').then(d => setLb(d)));
    }
  }, [dead, score]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Estado del juego
    let blocks = [{ x: (W - BASE_W) / 2, y: H - BLOCK_H, w: BASE_W }]; // base fija
    let current = { x: 0, y: H - BLOCK_H * 2, w: BASE_W, dir: 1 };
    let speed = SPEED_INIT;
    let sc = 0;
    let isDead = false;
    let req;

    const COLORS = ['#4285F4','#34A853','#FBBC05','#EA4335','#8b5cf6','#ec4899','#06b6d4'];

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Fondo degradado
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#1e293b');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Bloques apilados
      blocks.forEach((b, i) => {
        const col = COLORS[i % COLORS.length];
        ctx.fillStyle = col;
        ctx.shadowColor = col; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(b.x, b.y, b.w, BLOCK_H, 4) : ctx.rect(b.x, b.y, b.w, BLOCK_H);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Bloque en movimiento
      if (!isDead) {
        const col = COLORS[blocks.length % COLORS.length];
        ctx.fillStyle = col;
        ctx.shadowColor = col; ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(current.x, current.y, current.w, BLOCK_H, 4) : ctx.rect(current.x, current.y, current.w, BLOCK_H);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Score
      ctx.fillStyle = 'white'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(sc, W / 2, 36);

      // Instrucción inicial
      if (sc === 0 && !isDead) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '13px system-ui';
        ctx.fillText('Espacio / Toca para apilar', W / 2, H / 2);
      }
    };

    const tick = () => {
      if (isDead) return;
      current.x += speed * current.dir;
      if (current.x + current.w > W) { current.x = W - current.w; current.dir = -1; }
      if (current.x < 0) { current.x = 0; current.dir = 1; }
      draw();
      req = requestAnimationFrame(tick);
    };

    const place = () => {
      if (isDead) return;
      const top = blocks[blocks.length - 1];

      // Calcular solapamiento
      const left  = Math.max(current.x, top.x);
      const right = Math.min(current.x + current.w, top.x + top.w);
      const overlap = right - left;

      if (overlap <= 0) {
        // Fallo total
        isDead = true; setDead(true); draw(); return;
      }

      // Recortar bloque
      const newBlock = { x: left, y: current.y, w: overlap };
      blocks.push(newBlock);
      sc++; setScore(sc);

      // Subir todos los bloques
      blocks = blocks.map(b => ({ ...b, y: b.y + BLOCK_H }));

      // Siguiente bloque
      speed = Math.min(8, SPEED_INIT + sc * 0.15);
      current = { x: sc % 2 === 0 ? 0 : W - newBlock.w, y: blocks[blocks.length - 1].y - BLOCK_H, w: newBlock.w, dir: sc % 2 === 0 ? 1 : -1 };
    };

    // Exponer place al exterior
    canvas._place = place;

    req = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(req);
  }, [restartKey]);

  const handleAction = useCallback(() => {
    if (dead) { savedRef.current = false; setScore(0); setDead(false); setRestartKey(k => k + 1); return; }
    canvasRef.current?._place?.();
  }, [dead]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); handleAction(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAction, onClose]);

  const btn = { width:60, height:60, background:'rgba(255,255,255,0.6)', border:'1.5px solid rgba(255,255,255,0.9)', borderRadius:16, color:'#1d1d1f', fontSize:22, fontWeight:700, cursor:'pointer', backdropFilter:'blur(10px)', transition:'transform 0.1s', display:'flex', alignItems:'center', justifyContent:'center' };

  return (
    <GameLayout title="🏗️ Tower Stack" score={score} lb={lb} game="tower" onClose={onClose}>
      <div key={restartKey} style={{ position:'relative', borderRadius:16, overflow:'hidden', border:'1.5px solid rgba(255,255,255,0.2)', cursor:'pointer' }}
        onClick={e => { e.stopPropagation(); handleAction(); }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ display:'block' }}/>
        {dead && (
          <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.85)', backdropFilter:'blur(16px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, borderRadius:14 }}>
            <span style={{ fontSize:44 }}>💥</span>
            <p style={{ color:'white', fontWeight:800, fontSize:20, margin:0 }}>Game Over</p>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:0 }}>{score} bloques 🏆</p>
            <button onClick={e => { e.stopPropagation(); handleAction(); }}
              style={{ background:'#007aff', color:'white', border:'none', borderRadius:22, padding:'10px 28px', fontSize:14, fontWeight:700, cursor:'pointer', marginTop:4 }}>
              Try Again
            </button>
          </div>
        )}
      </div>
      <button style={btn} onClick={e => { e.stopPropagation(); handleAction(); }}
        onMouseDown={e => e.currentTarget.style.transform='scale(0.93)'}
        onMouseUp={e => e.currentTarget.style.transform='scale(1)'}>
        📦
      </button>
      <p style={{ color:'rgba(0,0,0,0.3)', fontSize:10, margin:0 }}>Espacio / W / Toca · ESC cierra</p>
    </GameLayout>
  );
}
