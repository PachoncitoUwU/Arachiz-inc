import React, { useState, useEffect, useRef, useCallback } from 'react';
import { glassLight, overlayStyle, MEDAL, TOP_COLORS } from './gameUtils';

const GAME_DURATION = 10;
const LS_KEY = (fichaId) => `arachiz_reaction_${fichaId || 'global'}_lb`;

const getLocalLB = (fichaId) => {
  try { return JSON.parse(localStorage.getItem(LS_KEY(fichaId))) || []; } catch { return []; }
};

const saveLocalScore = (score, userName, avatarUrl, fichaId) => {
  const lb = getLocalLB(fichaId);
  const idx = lb.findIndex(e => e.name === userName);
  const entry = { name: userName, avatar: avatarUrl || null, score, date: new Date().toLocaleDateString('es-CO') };
  if (idx >= 0) {
    if (score > lb[idx].score) lb[idx] = entry;
  } else {
    lb.push(entry);
  }
  lb.sort((a, b) => b.score - a.score);
  const top10 = lb.slice(0, 10);
  localStorage.setItem(LS_KEY(fichaId), JSON.stringify(top10));
  return top10;
};

// Guardar en backend sin bloquear (best-effort)
const trySaveBackend = (score) => {
  try {
    const token = localStorage.getItem('token');
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    fetch(`${API}/games/reaction/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score }),
    }).catch(() => {});
  } catch {}
};

// Traer ranking del backend filtrado por ficha
const fetchBackendLB = async (fichaId) => {
  try {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const params = fichaId ? `?fichaId=${fichaId}` : '';
    const res  = await fetch(`${API}/games/reaction/leaderboard${params}`);
    const data = await res.json();
    if (data.scores?.length) {
      const sorted = [...data.scores].sort((a, b) => b.score - a.score);
      localStorage.setItem(LS_KEY(fichaId), JSON.stringify(sorted));
      return sorted;
    }
  } catch {}
  return getLocalLB(fichaId);
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const randPos  = (w, h, r) => ({ x: r + Math.random() * (w - r * 2), y: r + Math.random() * (h - r * 2) });
const randR    = () => 22 + Math.floor(Math.random() * 22);
const COLORS   = ['#EA4335','#4285F4','#34A853','#FBBC05','#9C27B0','#FF5722','#00BCD4','#E91E63','#FF9800','#8BC34A'];
const randCol  = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// ── Ranking panel ─────────────────────────────────────────────────────────────
function RankingPanel({ lb, maxHeight = 380, hasFicha = true }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <span style={{ fontSize:15, fontWeight:800, color:'#1d1d1f' }}>Ranking</span>
        <span>🏆</span>
      </div>
      {!hasFicha ? (
        <div style={{ textAlign:'center', padding:'20px 0', color:'#6e6e73', fontSize:12 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🏫</div>Únete a una ficha para ver el ranking
        </div>
      ) : lb.length === 0 ? (
        <div style={{ textAlign:'center', padding:'20px 0', color:'#6e6e73', fontSize:12 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>💥</div>¡Sé el primero!
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:5, overflowY: lb.length > 10 ? 'auto' : 'visible', maxHeight: lb.length > 10 ? maxHeight : 'none' }}>
          {lb.map((e, i) => {
            const top = i < 3;
            const c   = top ? TOP_COLORS[i] : null;
            return (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:14,
                background: top ? c.bg : 'rgba(255,255,255,0.35)',
                border: top ? `1px solid ${c.glow}` : '1px solid rgba(255,255,255,0.5)',
                boxShadow: top ? `0 3px 12px ${c.glow}` : 'none',
              }}>
                <span style={{ fontSize: top?16:12, fontWeight:700, minWidth:22, textAlign:'center', color: top?c.text:'#6e6e73' }}>
                  {top ? MEDAL[i] : i+1}
                </span>
                {e.avatar
                  ? <img src={e.avatar} style={{ width:28, height:28, borderRadius:8, objectFit:'cover', flexShrink:0 }} alt=""/>
                  : <div style={{ width:28, height:28, borderRadius:8, background: top?c.text:'#007aff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>
                      {e.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()||'?'}
                    </div>
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:11, color: top?c.text:'#1d1d1f', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.name}</p>
                  <p style={{ margin:0, fontSize:9, color:'#6e6e73' }}>{e.date}</p>
                </div>
                <span style={{ fontWeight:800, fontSize: top?14:12, color: top?c.text:'#1d1d1f', whiteSpace:'nowrap' }}>{e.score} pts</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Juego ─────────────────────────────────────────────────────────────────────
export default function ReactionTime({ onClose, currentUser }) {
  const [phase,    setPhase]    = useState('idle');
  const [score,    setScore]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [circle,   setCircle]   = useState(null);
  const fichaId = currentUser?.fichaId || null;
  const [lb,       setLb]       = useState(() => getLocalLB(fichaId));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [showLB,   setShowLB]   = useState(false);

  const timerRef = useRef(null);
  const scoreRef = useRef(0);
  const circleId = useRef(0);

  const AREA_W = isMobile ? Math.min(window.innerWidth - 48, 340) : 420;
  const AREA_H = isMobile ? 300 : 380;

  useEffect(() => {
    // Al abrir, traer ranking del backend filtrado por ficha
    fetchBackendLB(fichaId).then(lb => setLb(lb));
    const f = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  const spawnCircle = useCallback(() => {
    const r = randR();
    circleId.current += 1;
    setCircle({ ...randPos(AREA_W, AREA_H, r), r, color: randCol(), id: circleId.current });
  }, [AREA_W, AREA_H]);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setPhase('playing');
    spawnCircle();
    let t = GAME_DURATION;
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) { clearInterval(timerRef.current); setPhase('done'); setCircle(null); }
    }, 1000);
  }, [spawnCircle]);

  useEffect(() => {
    if (phase === 'done' && scoreRef.current > 0) {
      const name   = currentUser?.fullName || 'Jugador';
      const avatar = currentUser?.avatarUrl || null;
      const updated = saveLocalScore(scoreRef.current, name, avatar, fichaId);
      setLb(updated);
      const localBest = updated.find(e => e.name === name);
      if (localBest && localBest.score === scoreRef.current) {
        trySaveBackend(scoreRef.current);
        setTimeout(() => fetchBackendLB(fichaId).then(lb => setLb(lb)), 1500);
      } else {
        setTimeout(() => fetchBackendLB(fichaId).then(lb => setLb(lb)), 500);
      }
    }
  }, [phase, currentUser]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleCircleClick = useCallback((e) => {
    e.stopPropagation();
    if (phase !== 'playing') return;
    scoreRef.current += 1;
    setScore(scoreRef.current);
    spawnCircle();
  }, [phase, spawnCircle]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { clearInterval(timerRef.current); onClose(); }
      if ((e.key === ' ' || e.key === 'Enter') && phase !== 'playing') { e.preventDefault(); startGame(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, phase, startGame]);

  const barColor = timeLeft > 5 ? '#34A853' : timeLeft > 2 ? '#FBBC05' : '#EA4335';
  const barPct   = (timeLeft / GAME_DURATION) * 100;

  return (
    <div style={{ ...overlayStyle }} onClick={e => e.stopPropagation()}>
      <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:12, alignItems:'flex-start', maxWidth:'98vw' }}>

        {!isMobile && (
          <div style={{ ...glassLight, padding:'18px 14px', minWidth:200 }}>
            <RankingPanel lb={lb} maxHeight={380} hasFicha={!!fichaId} />
          </div>
        )}

        <div style={{ ...glassLight, padding: isMobile ? '14px 14px 10px' : '20px 20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap: isMobile ? 10 : 14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <span style={{ fontSize: isMobile?16:20, fontWeight:800, color:'#1d1d1f', letterSpacing:'-0.5px' }}>💥 Revienta</span>
              <span style={{ fontSize: isMobile?13:15, fontWeight:700, color:'#007aff', background:'rgba(0,122,255,0.1)', padding:'2px 8px', borderRadius:20 }}>
                {score} pts
              </span>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {isMobile && (
                <button onClick={() => setShowLB(v => !v)}
                  style={{ background:'rgba(0,0,0,0.07)', border:'none', borderRadius:14, color:'#1d1d1f', padding:'5px 10px', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                  🏆 Top
                </button>
              )}
              <button onClick={() => { clearInterval(timerRef.current); onClose(); }}
                style={{ background:'rgba(0,0,0,0.07)', border:'none', borderRadius:14, color:'#1d1d1f', padding: isMobile?'5px 12px':'6px 14px', cursor:'pointer', fontSize: isMobile?12:13, fontWeight:600 }}>
                Done
              </button>
            </div>
          </div>

          {isMobile && showLB ? (
            <div style={{ width:'100%', maxWidth:360, maxHeight:260, overflowY:'auto' }}>
              <RankingPanel lb={lb} maxHeight={240} hasFicha={!!fichaId} />
            </div>
          ) : (
            <>
              {phase === 'playing' && (
                <div style={{ width:AREA_W, height:8, background:'rgba(0,0,0,0.1)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, width:`${barPct}%`, background:barColor, transition:'width 1s linear, background 0.3s' }}/>
                </div>
              )}

              <div style={{
                width:AREA_W, height:AREA_H,
                background:'linear-gradient(135deg,#1e293b,#0f172a)',
                borderRadius:20, position:'relative', overflow:'hidden',
                border:'1.5px solid rgba(255,255,255,0.12)',
                cursor: phase==='playing' ? 'crosshair' : 'default', userSelect:'none',
              }}>
                {phase === 'idle' && (
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                    <span style={{ fontSize:52 }}>💥</span>
                    <p style={{ color:'white', fontWeight:800, fontSize:20, margin:0 }}>Revienta círculos</p>
                    <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, margin:0, textAlign:'center', padding:'0 24px' }}>
                      Toca todos los círculos en {GAME_DURATION} segundos
                    </p>
                    <button onClick={startGame}
                      style={{ background:'#007aff', color:'white', border:'none', borderRadius:22, padding:'12px 32px', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(0,122,255,0.4)', marginTop:4 }}>
                      Iniciar
                    </button>
                  </div>
                )}

                {phase === 'done' && (
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
                    <span style={{ fontSize:48 }}>🎯</span>
                    <p style={{ color:'white', fontWeight:800, fontSize:22, margin:0 }}>{score} círculos</p>
                    <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, margin:0 }}>
                      {score>=20?'🔥 ¡Increíble!':score>=12?'⚡ Muy rápido':score>=7?'👍 Bien':'🐢 Sigue practicando'}
                    </p>
                    <button onClick={startGame}
                      style={{ background:'#007aff', color:'white', border:'none', borderRadius:22, padding:'10px 28px', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(0,122,255,0.4)', marginTop:4 }}>
                      ↻ Otra vez
                    </button>
                  </div>
                )}

                {phase === 'playing' && circle && (
                  <div key={circle.id} onClick={handleCircleClick} style={{
                    position:'absolute',
                    left: circle.x - circle.r, top: circle.y - circle.r,
                    width: circle.r*2, height: circle.r*2,
                    borderRadius:'50%', background: circle.color,
                    boxShadow:`0 0 20px ${circle.color}99, 0 0 40px ${circle.color}44`,
                    cursor:'pointer', animation:'popIn 0.12s ease-out',
                  }}/>
                )}

                {phase === 'playing' && (
                  <div style={{
                    position:'absolute', top:10, left:'50%', transform:'translateX(-50%)',
                    background:'rgba(0,0,0,0.45)', borderRadius:20, padding:'3px 14px',
                    color:barColor, fontWeight:800, fontSize:18, backdropFilter:'blur(8px)',
                  }}>
                    {timeLeft}s
                  </div>
                )}
              </div>

              <style>{`@keyframes popIn{from{transform:scale(0.3);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
              <p style={{ color:'rgba(0,0,0,0.3)', fontSize: isMobile?10:11, margin:0 }}>Toca los círculos · ESC cierra</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
