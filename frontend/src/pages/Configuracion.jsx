import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import SerialConnect from '../components/SerialConnect';
import { Moon, Sun, Globe, Bell, User, Shield, Palette, Save, Camera, Loader, Lock, Eye, EyeOff } from 'lucide-react';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-[#4285F4]' : 'bg-gray-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function Section({ icon: Icon, title, children, onTitleClick }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-[#4285F4]" />
        </div>
        <h2 className="font-bold text-gray-900 cursor-default select-none" onClick={onTitleClick}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── JUEGO SECRETO 2: Breakout / Arkanoid ─────────────────────────────────────
function BreakoutGame({ onClose }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let x = canvas.width / 2;
    let y = canvas.height - 30;
    let dx = 2;
    let dy = -2;
    const ballRadius = 6;
    const paddleHeight = 10;
    const paddleWidth = 75;
    let paddleX = (canvas.width - paddleWidth) / 2;
    let rightPressed = false;
    let leftPressed = false;

    const brickRowCount = 5;
    const brickColumnCount = 6;
    const brickWidth = 47;
    const brickHeight = 15;
    const brickPadding = 6;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 15;
    let currentScore = 0;

    const bricks = [];
    for(let c=0; c<brickColumnCount; c++) {
      bricks[c] = [];
      for(let r=0; r<brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1, c: `hsl(${Math.random()*360}, 70%, 50%)` };
      }
    }

    const keyDownHandler = (e) => {
      if(e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true;
      else if(e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true;
      if(e.key === 'Escape') onClose();
    };
    const keyUpHandler = (e) => {
      if(e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
      else if(e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false;
    };
    const mouseMoveHandler = (e) => {
      const relativeX = e.clientX - canvas.getBoundingClientRect().left;
      if(relativeX > 0 && relativeX < canvas.width) paddleX = relativeX - paddleWidth/2;
    };
    const touchMoveHandler = (e) => {
      if (e.touches.length > 0) {
        const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
        if(relativeX > 0 && relativeX < canvas.width) paddleX = relativeX - paddleWidth/2;
      }
    }

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);
    canvas.addEventListener("mousemove", mouseMoveHandler);
    canvas.addEventListener("touchmove", touchMoveHandler);

    function collisionDetection() {
      for(let c=0; c<brickColumnCount; c++) {
        for(let r=0; r<brickRowCount; r++) {
          let b = bricks[c][r];
          if(b.status === 1) {
            if(x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
              dy = -dy; b.status = 0;
              currentScore++; setScore(currentScore);
              
              if (Math.abs(dy) < 6) dy *= 1.03;
              if (Math.abs(dx) < 6) dx *= 1.03;

              if(currentScore === brickRowCount*brickColumnCount) {
                // Restart
                for(let c2=0; c2<brickColumnCount; c2++) {
                  for(let r2=0; r2<brickRowCount; r2++) bricks[c2][r2].status = 1;
                }
                currentScore = 0; setScore(0); dy = -Math.abs(dy) - 0.5;
              }
            }
          }
        }
      }
    }

    let req;
    function draw() {
      if (dead) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw Bricks
      for(let c=0; c<brickColumnCount; c++) {
        for(let r=0; r<brickRowCount; r++) {
          if(bricks[c][r].status === 1) {
            let bX = (c*(brickWidth+brickPadding))+brickOffsetLeft;
            let bY = (r*(brickHeight+brickPadding))+brickOffsetTop;
            bricks[c][r].x = bX; bricks[c][r].y = bY;
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bX, bY, brickWidth, brickHeight, 4) : ctx.rect(bX, bY, brickWidth, brickHeight);
            ctx.fillStyle = bricks[c][r].c; ctx.fill(); ctx.closePath();
          }
        }
      }
      // Draw Ball
      ctx.beginPath(); ctx.arc(x, y, ballRadius, 0, Math.PI*2); ctx.fillStyle = "#EA4335"; ctx.fill(); ctx.closePath();
      // Draw Paddle
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(paddleX, canvas.height-paddleHeight, paddleWidth, paddleHeight, 4) : ctx.rect(paddleX, canvas.height-paddleHeight, paddleWidth, paddleHeight);
      ctx.fillStyle = "#4285F4"; ctx.fill(); ctx.closePath();

      collisionDetection();

      if(x + dx > canvas.width-ballRadius || x + dx < ballRadius) dx = -dx;
      if(y + dy < ballRadius) dy = -dy;
      else if(y + dy > canvas.height-ballRadius) {
        if(x > paddleX && x < paddleX + paddleWidth) {
          dy = -dy; dx = dx + (x - (paddleX + paddleWidth/2)) * 0.15;
          if (Math.abs(dy) < 6) dy *= 1.05;
          if (Math.abs(dx) < 6) dx *= 1.05;
        } else {
          setDead(true);
        }
      }
      if(rightPressed && paddleX < canvas.width-paddleWidth) paddleX += 5;
      else if(leftPressed && paddleX > 0) paddleX -= 5;
      x += dx; y += dy;
      req = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
      canvas.removeEventListener("mousemove", mouseMoveHandler);
      canvas.removeEventListener("touchmove", touchMoveHandler);
      cancelAnimationFrame(req);
    };
  }, [onClose, dead]);

  const reset = () => {
    setScore(0);
    setDead(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200]" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
        padding: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
          <h3 style={{ fontWeight:700, color:'white', fontSize:16, textShadow:'0 1px 4px rgba(0,0,0,0.3)' }}>🧱 Breakout — {score} pts</h3>
          <button onClick={onClose} style={{ color:'rgba(255,255,255,0.7)', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>✕ Cerrar</button>
        </div>
        <div style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:12, position:'relative', overflow:'hidden', touchAction:'none' }}>
           <canvas ref={canvasRef} width={340} height={260} />
           {dead && (
             <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, borderRadius:10 }}>
               <p style={{ color:'white', fontWeight:700, fontSize:18, textShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>Game Over — {score} pts</p>
               <button onClick={reset} style={{ background:'rgba(66,133,244,0.9)', color:'white', border:'1px solid rgba(255,255,255,0.3)', borderRadius:10, padding:'8px 20px', fontWeight:600, cursor:'pointer', backdropFilter:'blur(10px)' }}>Reintentar</button>
             </div>
           )}
        </div>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>Desliza tu dedo o usa el ratón/teclado</p>
      </div>
    </div>
  );
}

// ─── JUEGO SECRETO: Snake (Liquid Glass Edition) ──────────────────────────────
const COLS = 15, ROWS = 12, CELL = 22;
const DIR = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };

function SnakeGame({ onClose }) {
  const [snake, setSnake]   = useState([[7,6],[6,6],[5,6]]);
  const [food, setFood]     = useState([10,4]);
  const [dir, setDir]       = useState([1,0]);
  const [score, setScore]   = useState(0);
  const [dead, setDead]     = useState(false);
  const dirRef              = useRef([1,0]);
  const lastMovedDirRef     = useRef([1,0]);

  const randFood = (s) => {
    let f;
    do { f = [Math.floor(Math.random()*COLS), Math.floor(Math.random()*ROWS)]; }
    while (s.some(c => c[0]===f[0] && c[1]===f[1]));
    return f;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (DIR[e.key]) { 
        e.preventDefault(); 
        const nextDir = DIR[e.key];
        const currDir = lastMovedDirRef.current;
        if (currDir[0] !== 0 && nextDir[0] === -currDir[0]) return;
        if (currDir[1] !== 0 && nextDir[1] === -currDir[1]) return;
        dirRef.current = nextDir; 
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (dead) return;
    const iv = setInterval(() => {
      setSnake(prev => {
        const [dx,dy] = dirRef.current;
        lastMovedDirRef.current = [dx,dy];
        const head = [prev[0][0]+dx, prev[0][1]+dy];
        if (head[0]<0||head[0]>=COLS||head[1]<0||head[1]>=ROWS||prev.some(c=>c[0]===head[0]&&c[1]===head[1])) {
          setDead(true); return prev;
        }
        const ate = head[0]===food[0] && head[1]===food[1];
        const next = [head, ...prev.slice(0, ate ? undefined : -1)];
        if (ate) { setScore(s=>s+10); setFood(randFood(next)); }
        return next;
      });
    }, 130);
    return () => clearInterval(iv);
  }, [dead, food]);

  const reset = () => {
    const s = [[7,6],[6,6],[5,6]];
    setSnake(s); setFood(randFood(s)); dirRef.current=[1,0]; lastMovedDirRef.current=[1,0]; setDir([1,0]); setScore(0); setDead(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200]" onClick={onClose}
      style={{ background: 'var(--color-overlay, rgba(15, 23, 42, 0.4))', backdropFilter: 'blur(8px)' }}>
      {/* Contenedor Liquid Glass */}
      <div onClick={e=>e.stopPropagation()} style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '30px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2), inset 0 2px 2px rgba(255,255,255,0.7)',
        padding: '24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
        maxWidth: '100%',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
          <h3 style={{ fontWeight:800, color:'#0F172A', fontSize:'1.2rem', margin:0, textShadow:'0 2px 10px rgba(255,255,255,0.7)', letterSpacing:'-0.5px' }}>
            🐍 Snake <span style={{ color:'#4285F4' }}>Liquid</span> — {score} pts
          </h3>
          <button onClick={onClose} style={{ color:'#64748b', background:'rgba(255,255,255,0.3)', border:'1px solid rgba(255,255,255,0.5)', cursor:'pointer', fontSize:'0.9rem', padding:'6px 14px', borderRadius:'100px', fontWeight:600, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>✕</button>
        </div>
        
        {/* Board */}
        <div style={{ 
            width: COLS*CELL, height: ROWS*CELL, 
            background:'rgba(255,255,255,0.2)', 
            border:'1px solid rgba(255,255,255,0.6)', 
            borderRadius:'20px', position:'relative', overflow:'hidden',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {/* Trazado de celdas sutil */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize:`${CELL}px ${CELL}px` }} />
          
          {/* Snake */}
          {snake.map(([x,y],i) => (
            <div key={i} style={{ 
              position:'absolute', left:x*CELL + 1, top:y*CELL + 1, width:CELL-2, height:CELL-2, 
              background: i===0 ? 'linear-gradient(135deg, #4285F4, #2b5db0)' : 'linear-gradient(135deg, #34A853, #1e7033)', 
              borderRadius: i===0 ? '8px' : '4px', 
              transition:'left 0.13s linear, top 0.13s linear', 
              boxShadow: i===0 ? '0 4px 12px rgba(66,133,244,0.6), inset 0 2px 4px rgba(255,255,255,0.5)' : 'inset 0 1px 2px rgba(255,255,255,0.4)',
              zIndex: i===0 ? 10 : 5
            }}/>
          ))}
          {/* Food */}
          <div style={{ 
            position:'absolute', left:food[0]*CELL+3, top:food[1]*CELL+3, width:CELL-6, height:CELL-6, 
            background:'linear-gradient(135deg, #FF6B6B, #EA4335)', borderRadius:'50%', 
            boxShadow:'0 4px 12px rgba(234,67,53,0.6), inset 0 2px 4px rgba(255,255,255,0.6)' 
          }}/>
          
          {/* Game Over Overlay */}
          {dead && (
            <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.4)', backdropFilter:'blur(6px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, borderRadius:'18px', zIndex:20 }}>
              <p style={{ color:'#1e293b', fontWeight:900, fontSize:'1.5rem', textShadow:'0 4px 12px rgba(255,255,255,0.8)' }}>¡Game Over!</p>
              <button onClick={reset} style={{ 
                background:'linear-gradient(135deg, #4285F4, #3367d6)', color:'white', 
                border:'1px solid rgba(255,255,255,0.5)', borderRadius:'14px', 
                padding:'12px 28px', fontSize:'1.1rem', fontWeight:700, cursor:'pointer', 
                boxShadow:'0 8px 24px rgba(66,133,244,0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                transition:'transform 0.2s',
              }}
              onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'}
              onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>Reintentar</button>
            </div>
          )}
        </div>
        
        {/* Controles táctiles gigantes para móvil */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', marginTop:'10px' }}>
          <button onClick={() => { dirRef.current = DIR['ArrowUp']; }}
            style={{ width:'70px', height:'70px', background:'rgba(255,255,255,0.4)', border:'2px solid rgba(255,255,255,0.6)', borderRadius:'20px', color:'#1e293b', fontSize:'2rem', fontWeight:800, cursor:'pointer', boxShadow:'0 8px 16px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.8)' }}>↑</button>
          <div style={{ display:'flex', gap:'10px' }}>
            {['ArrowLeft','ArrowDown','ArrowRight'].map((k,i) => (
              <button key={k} onClick={() => { dirRef.current = DIR[k]; }}
                style={{ width:'70px', height:'70px', background:'rgba(255,255,255,0.4)', border:'2px solid rgba(255,255,255,0.6)', borderRadius:'20px', color:'#1e293b', fontSize:'2rem', fontWeight:800, cursor:'pointer', boxShadow:'0 8px 16px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.8)' }}>
                {['←','↓','→'][i]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Configuracion() {
  const { user, updateUser } = useContext(AuthContext);
  const { settings, updateSetting, toggleDark } = useSettings();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [fullName, setFullName]           = useState(user?.fullName || '');
  const formatAvatarUrl = (url) => url ? (url.startsWith('http') ? url : `${API_BASE}${url}`) : null;
  const [avatarPreview, setAvatarPreview] = useState(formatAvatarUrl(user?.avatarUrl));
  const [avatarFile, setAvatarFile]       = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Juego secreto 2 — Arkanoid
  const [arkClicks, setArkClicks] = useState(0);
  const [showArk, setShowArk]   = useState(false);
  const arkTimer = useRef(null);

  const handleArkClick = () => {
    setArkClicks(n => {
      const next = n + 1;
      if (next >= 7) { setShowArk(true); return 0; }
      clearTimeout(arkTimer.current);
      arkTimer.current = setTimeout(() => setArkClicks(0), 2000);
      return next;
    });
  };

  // Juego secreto — se activa con 7 clicks en "Seguridad"
  const [secClicks, setSecClicks] = useState(0);
  const [showGame, setShowGame]   = useState(false);
  const secTimer = useRef(null);

  const handleSecClick = () => {
    setSecClicks(n => {
      const next = n + 1;
      if (next >= 7) { setShowGame(true); return 0; }
      clearTimeout(secTimer.current);
      secTimer.current = setTimeout(() => setSecClicks(0), 2000);
      return next;
    });
  };

  // Botón oculto del instructor para borrar sensor
  const [instClickCount, setInstClickCount] = useState(0);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const instTimer = useRef(null);

  const handleInstClick = () => {
    if (user?.userType !== 'instructor') return;
    setInstClickCount(n => {
      const next = n + 1;
      if (next >= 10) { setShowDevOptions(true); return 0; }
      clearTimeout(instTimer.current);
      instTimer.current = setTimeout(() => setInstClickCount(0), 2000);
      return next;
    });
  };

  const handleClearFingerprints = async () => {
    const confirmDelete = window.confirm('¿Deseas borrar TODA la base de datos local de tu sensor de huellas?');
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${API_BASE}/api/serial/clear-fingerprints`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message || 'Comando de borrado enviado', 'success');
      setShowDevOptions(false);
    } catch (err) {
      showToast(err.message || 'Error al enviar el comando', 'error');
    }
  };

  const initials  = user?.fullName ? user.fullName.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : '?';
  const roleColor = user?.userType === 'instructor' ? 'bg-[#4285F4]' : 'bg-[#34A853]';

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { showToast('La imagen no puede superar 5MB','error'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setSavingProfile(true);
    try {
      const body = new FormData();
      if (fullName.trim() && fullName !== user?.fullName) body.append('fullName', fullName.trim());
      if (avatarFile) body.append('avatar', avatarFile);
      const d    = await fetch(`${API_BASE}/api/auth/profile`, { method:'PUT', headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` }, body });
      const json = await d.json();
      if (!d.ok) throw new Error(json.error || 'Error al guardar');
      if (updateUser) updateUser(json.user);
      setAvatarFile(null);
      showToast('Perfil actualizado','success');
    } catch(err) { showToast(err.message,'error'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirm) return showToast('Las contraseñas no coinciden','error');
    if (passForm.newPass.length < 6) return showToast('Mínimo 6 caracteres','error');
    setSavingPass(true);
    try {
      // Endpoint de cambio de contraseña (se agrega al backend)
      const d    = await fetch(`${API_BASE}/api/auth/change-password`, {
        method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.newPass })
      });
      const json = await d.json();
      if (!d.ok) throw new Error(json.error || 'Error');
      setPassForm({ current:'', newPass:'', confirm:'' });
      showToast('Contraseña actualizada','success');
    } catch(err) { showToast(err.message,'error'); }
    finally { setSavingPass(false); }
  };

  const LANGUAGES = [
    { code:'es', label:'Español', flag:'🇨🇴' },
    { code:'en', label:'English', flag:'🇺🇸' },
  ];

  return (
    <div className="animate-fade-in space-y-5 max-w-2xl">
      {showGame && <SnakeGame onClose={() => setShowGame(false)} />}
      {showArk && <BreakoutGame onClose={() => setShowArk(false)} />}

      <PageHeader title="Configuración" subtitle="Personaliza tu experiencia en Arachiz" />

      {/* Perfil */}
      <Section icon={User} title="Perfil">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-5 mb-2">
            <div className="relative group">
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover shadow-md"/>
                : <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-md ${roleColor}`}><User size={36}/></div>
              }
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white"/>
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange}/>
            </div>
            <div>
              <p className="font-bold text-gray-900">{user?.fullName}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className={`badge mt-1 ${user?.userType==='instructor'?'badge-info':'badge-success'}`}>
                {user?.userType==='instructor'?'Instructor':'Aprendiz'}
              </span>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="block text-xs text-[#4285F4] hover:underline mt-1">Cambiar foto</button>
            </div>
          </div>
          <div>
            <label className="input-label">Nombre completo</label>
            <input className="input-field" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Tu nombre completo"/>
          </div>
          <div>
            <label className="input-label">Correo electrónico</label>
            <input type="email" className="input-field opacity-60 cursor-not-allowed" value={user?.email||''} disabled/>
            <p className="text-xs text-gray-400 mt-1">El correo no puede modificarse</p>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
            {savingProfile ? <Loader size={15} className="animate-spin"/> : <Save size={15}/>}
            {savingProfile ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </form>
      </Section>

      {/* Apariencia */}
      <Section icon={Palette} title="Apariencia" onTitleClick={handleArkClick}>
        <p className="text-sm font-medium text-gray-700 mb-3">Tema</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[{id:'light',label:'Claro',icon:Sun},{id:'dark',label:'Oscuro',icon:Moon}].map(({id,label,icon:Icon}) => {
            const active = id==='dark' ? settings.darkMode : !settings.darkMode;
            return (
              <button key={id} type="button"
                onClick={() => { if(id==='dark'&&!settings.darkMode) toggleDark(); if(id==='light'&&settings.darkMode) toggleDark(); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${active?'border-[#4285F4] bg-blue-50':'border-gray-200 hover:border-gray-300'}`}>
                <Icon size={22} className={active?'text-[#4285F4]':'text-gray-400'}/>
                <span className={`text-sm font-semibold ${active?'text-[#4285F4]':'text-gray-500'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Idioma */}
      <Section icon={Globe} title="Idioma">
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map(({code,label,flag}) => (
            <button key={code} type="button"
              onClick={() => { updateSetting('language',code); showToast(`Idioma: ${label}`,'info'); }}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${settings.language===code?'border-[#4285F4] bg-blue-50':'border-gray-200 hover:border-gray-300'}`}>
              <span className="text-2xl">{flag}</span>
              <div className="text-left">
                <p className={`text-sm font-semibold ${settings.language===code?'text-[#4285F4]':'text-gray-700'}`}>{label}</p>
                <p className="text-xs text-gray-400">{code.toUpperCase()}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">La traducción completa al inglés estará disponible próximamente.</p>
      </Section>

      {/* Notificaciones */}
      <Section icon={Bell} title="Notificaciones">
        <div className="divide-y divide-gray-100">
          <ToggleSwitch checked={settings.notifications} onChange={v=>updateSetting('notifications',v)}
            label="Notificaciones del sistema" description="Alertas de sesiones, excusas y actividad"/>
        </div>
      </Section>

      {/* Hardware / Biometría (Sólo Instructor) */}
      {user?.userType === 'instructor' && (
        <SerialConnect />
      )}

      {/* Seguridad — clic 7 veces para el juego */}
      <Section icon={Shield} title="Seguridad" onTitleClick={handleSecClick}>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Tu sesión expira automáticamente después de 8 horas de inactividad.</p>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sesión actual</p>
            <p className="text-sm text-gray-700">{user?.email}</p>
            <p className="text-xs text-gray-400 capitalize cursor-pointer select-none inline-block" onClick={handleInstClick}>{user?.userType}</p>
          </div>
          {instClickCount > 0 && instClickCount < 10 && (
            <p className="text-xs text-gray-300 text-center">{10 - instClickCount} clics más para opciones ocultas</p>
          )}
          {showDevOptions && (
             <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-2 mt-2">
               <p className="text-xs font-bold text-red-600">Opciones de Instructor (Avanzado)</p>
               <button 
                 onClick={handleClearFingerprints}
                 className="w-full text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg py-2 transition-colors"
               >
                 Borrar Base de Datos del Sensor
               </button>
             </div>
          )}
          {secClicks > 0 && secClicks < 7 && (
            <p className="text-xs text-gray-300 text-center">{7-secClicks} más...</p>
          )}
        </div>
      </Section>
    </div>
  );
}
