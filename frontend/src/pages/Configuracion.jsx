import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import SerialConnect from '../components/SerialConnect';
import { Moon, Sun, Globe, Bell, User, Shield, Palette, Save, Camera, Loader, Usb } from 'lucide-react';
import TowerStack   from '../games/TowerStack';
import MemoryFlash  from '../games/MemoryFlash';
import ReactionTime from '../games/ReactionTime';
import WordleGame   from '../games/WordleGame';
import SnakeShop    from '../components/SnakeShop';
import { drawPremiumEyes, getRainbowColor, drawSegment3D, applyNeonGlow, clearGlow } from '../utils/snakeSkinRenderer';

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
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
      </button>
    </div>
  );
}

function Section({ icon: Icon, title, children, onTitleClick }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-[#4285F4]"/>
        </div>
        <h2 className="font-bold text-gray-900 cursor-default select-none" onClick={onTitleClick}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── La Bolita (Breakout) ─────────────────────────────────────────────────────
const MEDAL = ['🥇','🥈','🥉'];
const TOP_COLORS = [
  { text:'#7A5500', glow:'rgba(255,200,0,0.5)',   bg:'rgba(255,215,0,0.30)' },
  { text:'#3D4450', glow:'rgba(160,170,180,0.5)', bg:'rgba(180,190,200,0.35)' },
  { text:'#6B3000', glow:'rgba(180,100,30,0.5)',  bg:'rgba(205,127,50,0.30)' },
];
const LS_BREAKOUT = 'arachiz_breakout_lb_cache';
const getLBBreakout = () => { try { return JSON.parse(localStorage.getItem(LS_BREAKOUT)) || []; } catch { return []; } };

const saveBreakoutScore = async (score, token) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    await fetch(`${API_URL}/snake/breakout/score`, {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({ score }),
    });
  } catch {}
};

const fetchBreakoutLeaderboard = async () => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const res  = await fetch(`${API_URL}/snake/breakout/leaderboard`);
    const data = await res.json();
    if (data.scores) {
      localStorage.setItem(LS_BREAKOUT, JSON.stringify(data.scores));
      return data.scores;
    }
  } catch {}
  return getLBBreakout();
};

function BreakoutGame({ onClose, currentUser }) {
  const canvasRef  = useRef(null);
  const [score, setScore]   = useState(0);
  const [dead,  setDead]    = useState(false);
  const [showLB, setShowLB] = useState(false);
  const [lb, setLb]         = useState(getLBBreakout());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const savedRef  = useRef(false);
  const deadRef   = useRef(false);
  const restartFn = useRef(null);

  useEffect(()=>{
    // Cargar LB desde API al abrir
    fetchBreakoutLeaderboard().then(data => setLb(data));
    const onResize=()=>setIsMobile(window.innerWidth<700);
    window.addEventListener('resize',onResize);return()=>window.removeEventListener('resize',onResize);
  },[]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // ── Parámetros de dificultad alta ──
    let x = canvas.width/2, y = canvas.height-50;
    let dx = 3.0, dy = -3.0;          // bola inicial a velocidad moderada
    const ballR=6, padH=9, padW=60;   // paleta más pequeña
    let padX=(canvas.width-padW)/2;
    let right=false, left=false;
    const COLS=8, ROWS=7, BW=37, BH=13, BP=4; let sc=0;
    let level=1;
    const makeBricks=()=>Array.from({length:COLS},(_,c)=>Array.from({length:ROWS},(_,r)=>({
      x:0,y:0,on:1,
      hp: r===0?3 : r<3?2 : 1,        // fila 0 = 3 golpes, filas 1-2 = 2 golpes
      color:`hsl(${(c*45+r*20)%360},75%,${r===0?35:r<3?45:58}%)`
    })));
    let bricks=makeBricks();

    const restart=()=>{
      x=canvas.width/2;y=canvas.height-50;
      dx=3.0;dy=-3.0;level=1;sc=0;
      bricks=makeBricks();
      deadRef.current=false;
      savedRef.current=false;
      setScore(0);setDead(false);
      req=requestAnimationFrame(draw);
    };
    restartFn.current=restart;

    const kd=(e)=>{
      if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){if(deadRef.current){e.preventDefault();restart();}else{right=true;}}
      if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){if(deadRef.current){e.preventDefault();restart();}else{left=true;}}
      if(e.key===' '||e.key==='Enter'||e.key==='ArrowUp'||e.key==='ArrowDown'||e.key==='w'||e.key==='W'||e.key==='s'||e.key==='S'){if(deadRef.current){e.preventDefault();restart();}}
      if(e.key==='Escape')onClose();
    };
    const ku=(e)=>{if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')right=false;if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')left=false;};
    const mm=(e)=>{const rx=e.clientX-canvas.getBoundingClientRect().left;if(rx>0&&rx<canvas.width)padX=rx-padW/2;};
    const tm=(e)=>{if(e.touches[0]){const rx=e.touches[0].clientX-canvas.getBoundingClientRect().left;if(rx>0&&rx<canvas.width)padX=rx-padW/2;}};
    document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
    canvas.addEventListener('mousemove',mm);canvas.addEventListener('touchmove',tm,{passive:true});

    let req;
    const draw=()=>{
      if(deadRef.current)return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // Fondo
      const bg=ctx.createLinearGradient(0,0,0,canvas.height);
      bg.addColorStop(0,'#0a0f1e');bg.addColorStop(1,'#0d1a2e');
      ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);
      // Info
      ctx.fillStyle='rgba(255,255,255,0.2)';ctx.font='bold 10px system-ui';ctx.textAlign='left';
      ctx.fillText(`Nivel ${level}  ·  ${sc} pts`,8,14);
      // Ladrillos
      for(let c=0;c<COLS;c++)for(let r=0;r<ROWS;r++){
        if(!bricks[c][r].on)continue;
        const bx=(c*(BW+BP))+6,by=(r*(BH+BP))+22;
        bricks[c][r].x=bx;bricks[c][r].y=by;
        ctx.beginPath();ctx.roundRect?ctx.roundRect(bx,by,BW,BH,3):ctx.rect(bx,by,BW,BH);
        ctx.fillStyle=bricks[c][r].color;ctx.fill();
        if(bricks[c][r].hp>1){
          ctx.strokeStyle=bricks[c][r].hp>2?'rgba(255,255,100,0.7)':'rgba(255,255,255,0.4)';
          ctx.lineWidth=1.5;ctx.stroke();
        }
      }
      // Bola
      ctx.beginPath();ctx.arc(x,y,ballR,0,Math.PI*2);ctx.fillStyle='#ff4444';ctx.fill();
      // Paleta con glow
      ctx.beginPath();ctx.roundRect?ctx.roundRect(padX,canvas.height-padH-3,padW,padH,4):ctx.rect(padX,canvas.height-padH-3,padW,padH);
      ctx.fillStyle='#4285F4';ctx.fill();
      // Colisión ladrillos
      for(let c=0;c<COLS;c++)for(let r=0;r<ROWS;r++){
        const b=bricks[c][r];
        if(!b.on)continue;
        // Hitbox check
        if(x+ballR>b.x&&x-ballR<b.x+BW&&y+ballR>b.y&&y-ballR<b.y+BH){
          b.hp--;
          if(b.hp<=0){b.on=0;sc+=level*2;setScore(sc);}
          
          // Calcular overlap para determinar de qué lado pegó (Fix bug atravesar pared)
          const overlapX = Math.min(x+ballR - b.x, b.x+BW - (x-ballR));
          const overlapY = Math.min(y+ballR - b.y, b.y+BH - (y-ballR));
          if(overlapX < overlapY) dx = -dx;
          else dy = -dy;

          // Acelerar cada 4 ladrillos destruidos
          const destroyed=bricks.flat().filter(bk=>!bk.on).length;
          if(destroyed%4===0){const spd=Math.min(9,Math.abs(dx)+0.3);dx=dx>0?spd:-spd;dy=dy>0?spd:-spd;}
        }
      }
      // Siguiente nivel
      if(bricks.every(col=>col.every(b=>!b.on))){
        level++;bricks=makeBricks();
        const spd=Math.min(10,3.0+level*0.4);
        dx=dx>0?spd:-spd;dy=-Math.abs(spd);
      }
      if(x+dx>canvas.width-ballR||x+dx<ballR)dx=-dx;
      
      const padTop = canvas.height-padH-3;
      if(y+dy<ballR) dy=-dy;
      else if(y+dy >= padTop-ballR && y <= padTop && x > padX-ballR && x < padX+padW+ballR && dy > 0){
        // Colisión con paleta — reposicionar encima para evitar que entre
        y = padTop - ballR;
        dy = -Math.abs(dy);
        dx = dx + (x-(padX+padW/2))*0.15;
        // Limitar ángulo extremo
        if(Math.abs(dx)>8)dx=dx>0?8:-8;
      } else if(y+dy > canvas.height+ballR) {
        deadRef.current=true;setDead(true);return;
      }
      if(right&&padX<canvas.width-padW)padX+=7;
      if(left&&padX>0)padX-=7;
      x+=dx;y+=dy;
      req=requestAnimationFrame(draw);
    };
    draw();
    return()=>{document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);canvas.removeEventListener('mousemove',mm);canvas.removeEventListener('touchmove',tm);cancelAnimationFrame(req);};
  },[onClose]); // ← solo onClose, NO dead — evita reinicio al morir

  useEffect(()=>{
    if(dead&&!savedRef.current&&score>0){
      savedRef.current=true;
      // Guardar en API (global) y actualizar LB
      saveBreakoutScore(score, localStorage.getItem('token'))
        .then(()=>fetchBreakoutLeaderboard().then(data=>setLb(data)));
    }
  },[dead,score,currentUser]);

  const LBContent=()=>(
    <div style={{display:'flex',flexDirection:'column',gap:6,overflowY:'auto',maxHeight:isMobile?240:420}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
        <span style={{fontSize:14,fontWeight:800,color:'white',letterSpacing:'-0.3px'}}>Ranking</span>
        <span style={{fontSize:14}}>🏆</span>
      </div>
      {lb.length===0
        ?<p style={{color:'rgba(255,255,255,0.4)',textAlign:'center',padding:'16px 0',fontSize:12}}>¡Sé el primero!</p>
        :[...lb].sort((a,b)=>b.score-a.score).map((e,i)=>{
          const isTop=i<3,col=isTop?TOP_COLORS[i]:null;
          return(<div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 9px',borderRadius:12,background:isTop?col.bg:'rgba(255,255,255,0.08)',border:isTop?`1px solid ${col.glow}`:'1px solid rgba(255,255,255,0.12)'}}>
            <span style={{fontSize:isTop?15:11,fontWeight:700,minWidth:20,color:isTop?col.text:'rgba(255,255,255,0.4)'}}>{isTop?MEDAL[i]:i+1}</span>
            {e.avatar?<img src={e.avatar} style={{width:26,height:26,borderRadius:7,objectFit:'cover'}} alt=""/>
              :<div style={{width:26,height:26,borderRadius:7,background:isTop?col.text:'#4285F4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'white'}}>{e.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()||'?'}</div>}
            <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontWeight:700,fontSize:10,color:isTop?col.text:'white',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.name}</p></div>
            <span style={{fontWeight:800,fontSize:12,color:isTop?col.text:'white'}}>{e.score}</span>
          </div>);
        })
      }
    </div>
  );

  const glassPanel={background:'rgba(255,255,255,0.08)',backdropFilter:'blur(40px) saturate(200%)',WebkitBackdropFilter:'blur(40px) saturate(200%)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:24,boxShadow:'0 20px 60px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.15)',padding:'16px 14px'};

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:12,overflowY:'auto'}} onClick={onClose}>
      <div style={{display:'flex',flexDirection:isMobile?'column':'row',gap:12,alignItems:'flex-start',maxWidth:'98vw'}} onClick={e=>e.stopPropagation()}>

        {/* LB — solo en desktop a la izquierda */}
        {!isMobile && (
          <div style={{...glassPanel,width:180}}>
            <LBContent/>
          </div>
        )}

        {/* Juego */}
        <div style={{...glassPanel,display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'14px 14px 10px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
            <span style={{fontWeight:800,color:'white',fontSize:14,letterSpacing:'-0.3px'}}>🎯 La Bolita — {score} pts</span>
            <div style={{display:'flex',gap:6}}>
              {/* Botón Top solo en móvil */}
              {isMobile && (
                <button onClick={e=>{e.stopPropagation();setShowLB(v=>!v);}}
                  style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:14,color:'white',padding:'4px 10px',cursor:'pointer',fontSize:11,fontWeight:600}}>
                  🏆 Top
                </button>
              )}
              <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:14,color:'white',padding:'4px 10px',cursor:'pointer',fontSize:11,fontWeight:600}}>✕</button>
            </div>
          </div>

          {/* LB en móvil cuando se abre con botón */}
          {isMobile && showLB ? (
            <div style={{width:300,maxHeight:240,overflowY:'auto'}}>
              <LBContent/>
            </div>
          ) : (
            <div style={{position:'relative',borderRadius:12,overflow:'hidden',border:'1px solid rgba(255,255,255,0.15)',touchAction:'none'}}>
              <canvas ref={canvasRef} width={340} height={290} style={{display:'block'}}/>
              {dead&&(
                <button onClick={()=>restartFn.current&&restartFn.current()}
                  style={{
                    position:'absolute',
                    top:'50%',
                    left:'50%',
                    transform:'translate(-50%,-50%)',
                    background:'rgba(255,255,255,0.22)',
                    backdropFilter:'blur(8px)',
                    border:'1.5px solid rgba(255,255,255,0.5)',
                    borderRadius:16,
                    width:56,
                    height:56,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    cursor:'pointer',
                    fontSize:26,
                    color:'white',
                    transition:'all 0.2s',
                    boxShadow:'0 4px 20px rgba(0,0,0,0.25)'
                  }}
                  onMouseEnter={e=>{
                    e.currentTarget.style.background='rgba(255,255,255,0.35)';
                    e.currentTarget.style.transform='translate(-50%,-50%) scale(1.1)';
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style.background='rgba(255,255,255,0.22)';
                    e.currentTarget.style.transform='translate(-50%,-50%) scale(1)';
                  }}
                >
                  ↻
                </button>
              )}
            </div>
          )}
          <p style={{color:'rgba(255,255,255,0.3)',fontSize:9,margin:0}}>Ratón / A-D / táctil · Espacio reinicia · ESC cierra</p>
        </div>
      </div>
    </div>
  );
}

// ─── El Maní (Flappy Bird) ────────────────────────────────────────────────────
const LS_FLAPPY = 'arachiz_flappy_lb_cache';
const getLBFlappy = () => { try { return JSON.parse(localStorage.getItem(LS_FLAPPY)) || []; } catch { return []; } };
const saveFlappyScore = async (score, token) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    await fetch(`${API_URL}/snake/flappy/score`, {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({ score }),
    });
  } catch {}
};
const fetchFlappyLB = async () => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const res = await fetch(`${API_URL}/snake/flappy/leaderboard`);
    const data = await res.json();
    if (data.scores) { localStorage.setItem(LS_FLAPPY, JSON.stringify(data.scores)); return data.scores; }
  } catch {}
  return getLBFlappy();
};

function FlappyGame({ onClose, currentUser }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const savedRef  = useRef(false);
  const restartRef = useRef(null);
  const [score,      setScore]      = useState(0);
  const [dead,       setDead]       = useState(false);
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 700);
  const [showLB,     setShowLB]     = useState(false);
  const [lb,         setLb]         = useState(getLBFlappy());
  const [restartKey, setRestartKey] = useState(0);

  // Constantes del juego
  const W=340, H=520, PW=54, GAP=148;

  useEffect(()=>{
    fetchFlappyLB().then(d=>setLb(d));
    const f=()=>setIsMobile(window.innerWidth<700);
    window.addEventListener('resize',f);
    return()=>window.removeEventListener('resize',f);
  },[]);

  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    // Estado del juego — todo en variables locales del closure
    let bird = {x:80, y:H/2, vy:0};
    let pipes = [];
    let sc = 0;
    let frame = 0;
    // Detectar si es móvil para optimizar rendimiento y ajustar dificultad
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let speed = isMobileDevice ? 2.0 : 2.5;
    const baseGap = isMobileDevice ? 165 : 148;
    let started = false;
    let isDead = false;
    let req;


    
    const draw = () => {
      ctx.clearRect(0,0,W,H);

      // Fondo degradado más bonito
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#87CEEB');  // Sky blue
      gradient.addColorStop(0.7, '#B0E0E6'); // Light blue
      gradient.addColorStop(1, '#E0F6FF');   // Very light blue
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      // Tuberías con mejor diseño
      pipes.forEach(p => {
        // Sombra de las tuberías
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(p.x + 2, 2, PW, p.top);
        ctx.fillRect(p.x + 2, p.top + (p.gap || GAP) + 2, PW, H - p.top - (p.gap || GAP) - 38);
        
        // Tubería Superior
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(p.x, 0, PW, p.top);
        
        // Gorro Superior con gradiente
        const topGradient = ctx.createLinearGradient(0, p.top - 18, 0, p.top);
        topGradient.addColorStop(0, '#66BB6A');
        topGradient.addColorStop(1, '#4CAF50');
        ctx.fillStyle = topGradient;
        ctx.fillRect(p.x - 4, p.top - 18, PW + 8, 18);
        
        // Tubería Inferior
        const currentGap = p.gap || GAP;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(p.x, p.top + currentGap, PW, H - p.top - currentGap - 38);
        
        // Gorro Inferior con gradiente
        const bottomGradient = ctx.createLinearGradient(0, p.top + currentGap, 0, p.top + currentGap + 18);
        bottomGradient.addColorStop(0, '#66BB6A');
        bottomGradient.addColorStop(1, '#4CAF50');
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(p.x - 4, p.top + currentGap, PW + 8, 18);
        
        // Brillo en las tuberías
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(p.x + 2, 0, 4, p.top);
        ctx.fillRect(p.x + 2, p.top + currentGap, 4, H - p.top - currentGap - 38);
      });

      // Suelo con gradiente
      const groundGradient = ctx.createLinearGradient(0, H - 38, 0, H);
      groundGradient.addColorStop(0, '#8BC34A');
      groundGradient.addColorStop(1, '#689F38');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, H - 38, W, 38);

      // Dibujar maní (Emoji predeterminado pero con font-family segura para evitar bugs en iOS)
      ctx.save();
      ctx.translate(bird.x, bird.y);
      const angle = Math.min(Math.max(bird.vy * 0.03, -0.3), 0.6);
      ctx.rotate(angle);
      
      ctx.font = '28px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Sombra para dar profundidad
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fillText('🥜', 0, 0);
      
      ctx.restore();

      // Score con sombra y mejor estilo
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;
      ctx.font = 'bold 32px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#007aff';
      ctx.lineWidth = 2;
      ctx.strokeText(sc, W/2, 50);
      ctx.fillText(sc, W/2, 50);
      ctx.restore();

      // Pantalla de inicio — sin texto, solo espera el primer toque
      if(!started && !isDead){
        // nada — el juego inicia al primer toque/tecla
      }
    };

    const tick = () => {
      if(isDead) return;
      if(started){
        bird.vy += isMobileDevice ? 0.45 : 0.5;
        bird.y  += bird.vy;
        frame++;
        const interval = Math.max(50, 90 - sc * 3.5);
        if(frame % Math.floor(interval) === 0){
          // Ajustar el GAP de manera más gradual (gap más ámplio si es mobile)
          const currentGap = sc <= 7 ? Math.max(100, baseGap - Math.floor(sc * 4)) : Math.max(100, baseGap - 30);
          // Asegurar que siempre haya al menos 60px arriba y 60px abajo
          const minTop = 60;
          const maxTop = H - currentGap - 60 - 38; // 38 es el suelo
          const topH = Math.max(minTop, Math.min(maxTop, minTop + Math.random() * (maxTop - minTop)));
          pipes.push({x: W+10, top: topH, gap: currentGap, scored: false});
        }
        pipes.forEach(p => { p.x -= speed; });
        pipes = pipes.filter(p => p.x > -PW-10);
        pipes.forEach(p => {
          if(!p.scored && p.x+PW < bird.x){
            p.scored=true; sc++;
            setScore(sc);
            speed = Math.min(isMobileDevice ? 5.5 : 6.5, (isMobileDevice ? 2.2 : 2.8) + sc*0.12);
          }
        });
        if(bird.y+16 > H-38 || bird.y-16 < 0){
          isDead=true; setDead(true); draw(); return;
        }
        const hr=13;
        for(const p of pipes){
          const currentGap = p.gap || GAP;
          if(bird.x+hr > p.x && bird.x-hr < p.x+PW){
            if(bird.y-hr < p.top || bird.y+hr > p.top+currentGap){
              isDead=true; setDead(true); draw(); return;
            }
          }
        }
      }
      draw();
      req = requestAnimationFrame(tick);
    };

    const doJump = () => {
      if(isDead) return;
      if(!started) started=true;
      bird.vy = isMobileDevice ? -7.0 : -9;
    };

    rafRef.current = { jump: doJump };
    req = requestAnimationFrame(tick);

    const onKey=(e)=>{
      if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W'||e.key==='ArrowDown'||e.key==='s'||e.key==='S'||e.key==='ArrowLeft'||e.key==='a'||e.key==='A'||e.key==='ArrowRight'||e.key==='d'||e.key==='D'||e.key==='Enter'){
        e.preventDefault();
        if(isDead){ restartRef.current?.(); return; }
        doJump();
      }
      if(e.key==='Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    // Tap/Click detection - TODA LA PANTALLA
    const onTap = (e) => {
      // No prevenir si es un botón o elemento interactivo
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      e.preventDefault();
      if(isDead){ restartRef.current?.(); return; }
      doJump();
    };
    
    // Agregar eventos a todo el documento para que funcione en toda la pantalla
    document.addEventListener('click', onTap);
    document.addEventListener('touchend', onTap, { passive: false });

    return()=>{
      cancelAnimationFrame(req);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onTap);
      document.removeEventListener('touchend', onTap);
    };
  },[restartKey, onClose]);

  const restart = () => {
    savedRef.current = false;
    setScore(0);
    setDead(false);
    setRestartKey(k=>k+1);
  };
  restartRef.current = restart;

  // Guardar score al morir
  useEffect(()=>{
    if(dead && !savedRef.current){
      savedRef.current=true;
      if(score>0){
        saveFlappyScore(score, localStorage.getItem('token'))
          .then(()=>fetchFlappyLB().then(d=>setLb(d)));
      }
    }
  },[dead,score]);

  const jump = () => {
    if(dead){ restart(); return; }
    rafRef.current?.jump?.();
  };

  const btnSize = isMobile ? 80 : 60;
  const btn={width:btnSize,height:btnSize,background:'rgba(255,255,255,0.6)',border:'1.5px solid rgba(255,255,255,0.9)',borderRadius:16,color:'#1d1d1f',fontSize:26,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(0,0,0,0.08)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',transition:'transform 0.1s',display:'flex',alignItems:'center',justifyContent:'center'};
  const glass={background:'rgba(255,255,255,0.25)',backdropFilter:'blur(50px) saturate(200%)',WebkitBackdropFilter:'blur(50px) saturate(200%)',border:'1.5px solid rgba(255,255,255,0.9)',borderRadius:28,boxShadow:'0 30px 80px rgba(0,0,0,0.12),inset 0 2px 0 rgba(255,255,255,1)'};

  const LBPanel=()=>(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <span style={{fontSize:14,fontWeight:800,color:'#1d1d1f',letterSpacing:'-0.4px'}}>Ranking</span>
        <span style={{fontSize:14}}>🏆</span>
      </div>
      {lb.length===0
        ?<div style={{textAlign:'center',padding:'16px 0',color:'#6e6e73',fontSize:12}}><div style={{fontSize:28,marginBottom:6}}>🥜</div>¡Sé el primero!</div>
        :<div style={{display:'flex',flexDirection:'column',gap:5,overflowY:'auto',maxHeight:H-60}}>
          {[...lb].sort((a,b)=>b.score-a.score).map((entry,i)=>{
            const isTop=i<3,col=isTop?TOP_COLORS[i]:null;
            return(<div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 9px',borderRadius:13,background:isTop?col.bg:'rgba(255,255,255,0.35)',border:isTop?`1px solid ${col.glow}`:'1px solid rgba(255,255,255,0.5)'}}>
              <span style={{fontSize:isTop?15:11,fontWeight:700,minWidth:18,textAlign:'center',color:isTop?col.text:'#6e6e73'}}>{isTop?MEDAL[i]:i+1}</span>
              {entry.avatar?<img src={entry.avatar} style={{width:26,height:26,borderRadius:7,objectFit:'cover',flexShrink:0}} alt=""/>
                :<div style={{width:26,height:26,borderRadius:7,background:isTop?col.text:'#007aff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'white',flexShrink:0}}>{entry.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()||'?'}</div>}
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontWeight:700,fontSize:10,color:isTop?col.text:'#1d1d1f',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{entry.name}</p>
                <p style={{margin:0,fontSize:9,color:'#6e6e73'}}>{entry.score} pts</p>
              </div>
            </div>);
          })}
        </div>
      }
    </div>
  );

  return (
    <div key={restartKey} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.15)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:12,overflowY:'auto'}} onClick={jump}>
      <div style={{display:'flex',flexDirection:isMobile?'column':'row',gap:12,alignItems:'flex-start',maxWidth:'98vw'}} onClick={e=>e.stopPropagation()}>

        {!isMobile&&(
          <div style={{...glass,padding:'18px 14px',minWidth:190}}><LBPanel/></div>
        )}

        <div style={{...glass,padding:'14px 14px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
            <div style={{display:'flex',alignItems:'baseline',gap:8}}>
              <span style={{fontSize:16,fontWeight:800,color:'#1d1d1f',letterSpacing:'-0.5px'}}>🥜 El Maní</span>
              <span style={{fontSize:13,fontWeight:700,color:'#007aff',background:'rgba(0,122,255,0.1)',padding:'2px 8px',borderRadius:20}}>{score} pts</span>
            </div>
            <div style={{display:'flex',gap:6}}>
              {isMobile&&(
                <button onClick={e=>{e.stopPropagation();setShowLB(v=>!v);}}
                  style={{background:'rgba(0,0,0,0.07)',border:'none',borderRadius:14,color:'#1d1d1f',padding:'5px 10px',cursor:'pointer',fontSize:11,fontWeight:600}}>🏆 Top</button>
              )}
              <button onClick={e=>{e.stopPropagation();onClose();}} style={{background:'rgba(0,0,0,0.07)',border:'none',borderRadius:14,color:'#1d1d1f',padding:'5px 12px',cursor:'pointer',fontSize:12,fontWeight:600}}>Done</button>
            </div>
          </div>

          {isMobile&&showLB?(
            <div style={{width:280,maxHeight:220,overflowY:'auto'}}><LBPanel/></div>
          ):(
            <>
              <div style={{position:'relative',borderRadius:16,overflow:'hidden',border:'1.5px solid rgba(255,255,255,0.95)',cursor:'pointer'}}
                onClick={e=>{e.stopPropagation();jump();}}>
                <canvas ref={canvasRef} width={W} height={H} style={{display:'block',maxWidth:'100%'}}/>
                {dead&&(
                  <button onClick={e=>{e.stopPropagation();restart();}}
                    style={{
                      position:'absolute',
                      top:'50%',
                      left:'50%',
                      transform:'translate(-50%,-50%)',
                      background:'rgba(255,255,255,0.22)',
                      backdropFilter:'blur(8px)',
                      border:'1.5px solid rgba(255,255,255,0.5)',
                      borderRadius:16,
                      width:56,
                      height:56,
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      cursor:'pointer',
                      fontSize:26,
                      color:'white',
                      transition:'all 0.2s',
                      boxShadow:'0 4px 20px rgba(0,0,0,0.25)'
                    }}
                    onMouseEnter={e=>{
                      e.currentTarget.style.background='rgba(255,255,255,0.35)';
                      e.currentTarget.style.transform='translate(-50%,-50%) scale(1.1)';
                    }}
                    onMouseLeave={e=>{
                      e.currentTarget.style.background='rgba(255,255,255,0.22)';
                      e.currentTarget.style.transform='translate(-50%,-50%) scale(1)';
                    }}
                  >
                    ↻
                  </button>
                )}
              </div>
              <button style={btn} onClick={e=>{e.stopPropagation();jump();}}
                onMouseDown={e=>e.currentTarget.style.transform='scale(0.93)'}
                onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>🥜</button>
            </>
          )}
          <p style={{color:'rgba(0,0,0,0.3)',fontSize:10,margin:0}}>Espacio / W / ↑ / Toca · ESC cierra</p>
        </div>
      </div>
    </div>
  );
}

// ─── El Gusanito ──────────────────────────────────────────────────────────────
const COLS=16,ROWS=13,CELL=24;
const DIR={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};

function Apple({ x, y }) {
  return (
    <div style={{position:'absolute',left:x*CELL,top:y*CELL,width:CELL,height:CELL,display:'flex',alignItems:'center',justifyContent:'center',fontSize:CELL-4,lineHeight:1,filter:'drop-shadow(0 2px 6px rgba(255,59,48,0.6))',animation:'appleFloat 1.2s ease-in-out infinite alternate',userSelect:'none'}}>🍎</div>
  );
}

// Leaderboard global — usa la API del backend
const LS_KEY = 'arachiz_snake_lb_cache'; // cache local para mostrar mientras carga

const getLeaderboard = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
};

const saveScore = async (score, token) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    await fetch(`${API_URL}/snake/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score }),
    });
  } catch (e) { console.error('Error guardando score:', e); }
};

const fetchLeaderboard = async () => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const res  = await fetch(`${API_URL}/snake/leaderboard`);
    const data = await res.json();
    if (data.scores) {
      localStorage.setItem(LS_KEY, JSON.stringify(data.scores));
      return data.scores;
    }
  } catch (e) { console.error('Error cargando leaderboard:', e); }
  return getLeaderboard();
};

function Leaderboard({ onClose, currentUser }) {
  const lb = getLeaderboard();
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(180,200,220,0.2)',backdropFilter:'blur(32px) saturate(180%)',WebkitBackdropFilter:'blur(32px) saturate(180%)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:201,padding:16}} onClick={onClose}>
      <div style={{background:'rgba(255,255,255,0.45)',backdropFilter:'blur(60px) saturate(220%)',WebkitBackdropFilter:'blur(60px) saturate(220%)',border:'1.5px solid rgba(255,255,255,0.9)',borderRadius:36,boxShadow:'0 40px 100px rgba(0,0,0,0.12),inset 0 2px 0 rgba(255,255,255,1)',padding:'28px 24px',width:'100%',maxWidth:380,maxHeight:window.innerWidth<700?'85vh':'95vh',overflow:'hidden',display:'flex',flexDirection:'column',gap:16}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <span style={{fontSize:20,fontWeight:800,color:'#1d1d1f',letterSpacing:'-0.6px'}}>Leaderboard</span>
            <span style={{marginLeft:8,fontSize:18}}>🏆</span>
          </div>
          <button onClick={onClose} style={{background:'rgba(0,0,0,0.07)',border:'none',borderRadius:22,color:'#1d1d1f',padding:'7px 18px',cursor:'pointer',fontSize:14,fontWeight:600}}>Done</button>
        </div>

        {lb.length === 0 ? (
          <div style={{textAlign:'center',padding:'32px 0',color:'#6e6e73',fontSize:14}}>
            <div style={{fontSize:40,marginBottom:8}}>🎮</div>
            Aún no hay puntuaciones.<br/>¡Sé el primero!
          </div>
        ) : (
          <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
            {lb.map((entry, i) => {
              const isTop = i < 3;
              const col = isTop ? TOP_COLORS[i] : null;
              return (
                <div key={i} style={{
                  display:'flex',alignItems:'center',gap:12,
                  padding:'10px 14px',
                  borderRadius:18,
                  background: isTop ? col.bg : 'rgba(255,255,255,0.4)',
                  border: isTop ? `1px solid ${col.glow}` : '1px solid rgba(255,255,255,0.6)',
                  boxShadow: isTop ? `0 4px 16px ${col.glow}` : '0 2px 8px rgba(0,0,0,0.04)',
                  transition:'transform 0.15s',
                }}>
                  {/* Posición */}
                  <span style={{fontSize:isTop?22:15,fontWeight:700,minWidth:28,textAlign:'center',color:isTop?col.text:'#6e6e73'}}>
                    {isTop ? MEDAL[i] : `${i+1}`}
                  </span>
                  {/* Avatar */}
                  {entry.avatar
                    ? <img src={entry.avatar} style={{width:36,height:36,borderRadius:10,objectFit:'cover',border:isTop?`2px solid ${col.text}`:'2px solid rgba(255,255,255,0.8)',boxShadow:isTop?`0 0 10px ${col.glow}`:'none'}} alt={entry.name}/>
                    : <div style={{width:36,height:36,borderRadius:10,background:isTop?col.text:'#007aff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'white',border:isTop?`2px solid ${col.text}`:'none'}}>
                        {entry.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()||'?'}
                      </div>
                  }
                  {/* Nombre y fecha */}
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontWeight:700,fontSize:14,color:isTop?col.text:'#1d1d1f',letterSpacing:'-0.2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{entry.name}</p>
                    <p style={{margin:0,fontSize:11,color:'#6e6e73'}}>{entry.date}</p>
                  </div>
                  {/* Puntos */}
                  <span style={{fontWeight:800,fontSize:isTop?18:15,color:isTop?col.text:'#1d1d1f',letterSpacing:'-0.5px'}}>{entry.score}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SnakeGame({ onClose, currentUser }) {
  const canvasRef = useRef(null);
  const gRef      = useRef(null);  // todo el estado del juego aquí, sin React state
  const rafRef    = useRef(null);
  const savedRef  = useRef(false);
  const [score, setScore] = useState(0);
  const [dead,  setDead]  = useState(false);
  const [lb,    setLb]    = useState(getLeaderboard());
  const [snakeColor, setSnakeColor] = useState('#00ff88');
  const [foodEmoji, setFoodEmoji] = useState('🍎');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [equippedSkin, setEquippedSkin] = useState(null);
  // Refs para que drawGame (closure estático) siempre lea el valor actual
  const snakeColorRef   = useRef('#00ff88');
  const foodEmojiRef    = useRef('🍎');
  const equippedSkinRef = useRef(null);
  
  // Refs para canvas puro (sin SVG overlay)
  const gradCacheRef = useRef(null); // { skinId, bodyFill, headFill }
  const W = COLS*CELL, H = ROWS*CELL;

  // Sincronizar refs con estado para que drawGame siempre lea el valor actual
  useEffect(() => { snakeColorRef.current = snakeColor; gradCacheRef.current = null; }, [snakeColor]);
  useEffect(() => { foodEmojiRef.current = foodEmoji; }, [foodEmoji]);
  useEffect(() => { equippedSkinRef.current = equippedSkin; gradCacheRef.current = null; }, [equippedSkin]);

  // Cargar leaderboard desde el servidor al abrir
  useEffect(()=>{
    fetchLeaderboard().then(data=>setLb(data));
    loadEquippedSkin();
  },[]);

  // Cargar la skin equipada del usuario
  const loadEquippedSkin = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/skins/my-skins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const equipped = data.userSkins?.find(us => us.equipped);
      if (equipped) {
        setEquippedSkin(equipped.skin);
        equippedSkinRef.current = equipped.skin;
        setSnakeColor(equipped.skin.headColor);
        snakeColorRef.current = equipped.skin.headColor;
      }
    } catch (error) {
      console.error('Error loading equipped skin:', error);
    }
  };

  const handleEquipSkin = (skin) => {
    setEquippedSkin(skin);
    equippedSkinRef.current = skin;
    setSnakeColor(skin.headColor);
    snakeColorRef.current = skin.headColor;
  };

  const randFood=(snake)=>{let f;do{f=[Math.floor(Math.random()*COLS),Math.floor(Math.random()*ROWS)];}while(snake.some(c=>c[0]===f[0]&&c[1]===f[1]));return f;};

  const drawGame=(g,ctx)=>{
    ctx.clearRect(0,0,W,H);

    // Fondo claro
    ctx.fillStyle='rgba(248,250,252,0.9)';
    ctx.fillRect(0,0,W,H);

    const skin = equippedSkinRef.current;
    const baseColor = snakeColorRef.current;
    const cacheKey = skin ? (skin.id||skin.name||skin.pattern) : baseColor;

    // ── Gradiente cacheado — solo se recrea cuando cambia la skin ─────────
    if (!gradCacheRef.current || gradCacheRef.current.key !== cacheKey) {
      let bodyFill = baseColor;
      const p = skin?.pattern;
      if (skin) {
        if (p === 'solid')    bodyFill = skin.bodyColor;
        else if (p === 'neon') bodyFill = skin.bodyColor;
        else if (p === 'gradient') {
          const g2=ctx.createLinearGradient(0,0,W,H);
          g2.addColorStop(0,skin.headColor); g2.addColorStop(1,skin.bodyColor); bodyFill=g2;
        } else if (p === 'rainbow') {
          const g2=ctx.createLinearGradient(0,0,W,0);
          g2.addColorStop(0,'#ff0080'); g2.addColorStop(0.2,'#ff8000');
          g2.addColorStop(0.4,'#ffff00'); g2.addColorStop(0.6,'#00ff80');
          g2.addColorStop(0.8,'#0080ff'); g2.addColorStop(1,'#8000ff'); bodyFill=g2;
        } else if (p === 'galaxy') {
          const g2=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)/2);
          g2.addColorStop(0,'#c084fc'); g2.addColorStop(0.5,'#4a148c'); g2.addColorStop(1,'#000'); bodyFill=g2;
        } else if (p === 'fire') {
          const g2=ctx.createLinearGradient(0,H,0,0);
          g2.addColorStop(0,'#ff0000'); g2.addColorStop(0.5,'#ff6b00'); g2.addColorStop(1,'#ffd700'); bodyFill=g2;
        } else if (p === 'ice') {
          const g2=ctx.createLinearGradient(0,0,W,H);
          g2.addColorStop(0,'#e0f7ff'); g2.addColorStop(0.5,'#7dd3fc'); g2.addColorStop(1,'#0ea5e9'); bodyFill=g2;
        } else if (p === 'gold') {
          const g2=ctx.createLinearGradient(0,0,W,H);
          g2.addColorStop(0,'#ffd700'); g2.addColorStop(0.5,'#ffb300'); g2.addColorStop(1,'#ff8c00'); bodyFill=g2;
        } else if (p === 'void') {
          const g2=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)/2);
          g2.addColorStop(0,'#1a0030'); g2.addColorStop(0.6,'#0d0020'); g2.addColorStop(1,'#000'); bodyFill=g2;
        } else bodyFill = skin.bodyColor;
      }
      gradCacheRef.current = { key: cacheKey, bodyFill, headFill: skin?.headColor || baseColor };
    }
    const { bodyFill, headFill } = gradCacheRef.current;
    const eyeStyle = skin?.eyeStyle || 'normal';
    const R = (CELL-5)/2; // radio del cuerpo

    // ── Aura de color (para skins con patrón especial) ────────────────────
    if (skin && skin.pattern !== 'solid') {
      const auraColor = skin.headColor || skin.bodyColor;
      ctx.shadowColor = auraColor;
      ctx.shadowBlur = 18;
    } else if (skin?.pattern === 'neon') {
      ctx.shadowColor = skin.bodyColor;
      ctx.shadowBlur = 22;
    }

    // ── Cuerpo + cabeza como línea continua (mismo grosor) ────────────────
    if (g.snake.length > 0) {
      ctx.strokeStyle = bodyFill;
      ctx.lineWidth = CELL - 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(g.snake[0][0]*CELL+CELL/2, g.snake[0][1]*CELL+CELL/2);
      for (let i=1; i<g.snake.length; i++)
        ctx.lineTo(g.snake[i][0]*CELL+CELL/2, g.snake[i][1]*CELL+CELL/2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // ── Ojos Premium con expresión según rareza/eyeStyle ─────────────────────────
    if (g.snake.length > 0) {
      const [hx,hy] = g.snake[0];
      const [dx,dy] = g.dir;
      const cx = hx*CELL+CELL/2, cy = hy*CELL+CELL/2;
      const o = 4, f = 1; // lateral y adelante
      let e1x,e1y,e2x,e2y;
      if (dx===1)       { e1x=cx+f; e1y=cy-o; e2x=cx+f; e2y=cy+o; }
      else if (dx===-1) { e1x=cx-f; e1y=cy-o; e2x=cx-f; e2y=cy+o; }
      else if (dy===1)  { e1x=cx-o; e1y=cy+f; e2x=cx+o; e2y=cy+f; }
      else              { e1x=cx-o; e1y=cy-f; e2x=cx+o; e2y=cy-f; }

      // Usar la función premium de renderizado de ojos
      drawPremiumEyes(ctx, e1x, e1y, e2x, e2y, eyeStyle);
    }

    // ── Comida ────────────────────────────────────────────────────────────
    ctx.font = `${CELL-4}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(foodEmojiRef.current, g.food[0]*CELL+CELL/2, g.food[1]*CELL+CELL/2);
  };

  const loop=(ts)=>{
    const g=gRef.current;const ctx=canvasRef.current?.getContext('2d');
    if(!g||!ctx||g.dead)return;
    if(ts-g.lastTick>=g.speed){
      g.lastTick=ts;
      // Procesar cola de inputs — tomar el siguiente de la cola
      if(g.dirQueue.length>0) g.nextDir=g.dirQueue.shift();
      g.dir=g.nextDir;
      const[dx,dy]=g.dir;const head=[g.snake[0][0]+dx,g.snake[0][1]+dy];
      if(head[0]<0||head[0]>=COLS||head[1]<0||head[1]>=ROWS||g.snake.some(c=>c[0]===head[0]&&c[1]===head[1])){
        g.dead=true;setDead(true);setScore(g.score);drawGame(g,ctx);return;
      }
      const ate=head[0]===g.food[0]&&head[1]===g.food[1];
      g.snake=[head,...g.snake.slice(0,ate?undefined:-1)];
      if(ate){
        g.score+=10;
        g.food=randFood(g.snake);
        g.speed=Math.max(50,g.speed-4); // Aumenta velocidad más gradualmente
        setScore(g.score);
      }
    }
    drawGame(g,ctx);rafRef.current=requestAnimationFrame(loop);
  };

  const startGame=()=>{
    gRef.current={
      snake:[[8,6],[7,6],[6,6],[5,6]],
      food:[12,4],
      dir:[1,0],
      nextDir:[1,0],
      dirQueue:[],
      score:0,
      speed:120,
      lastTick:0,
      dead:false
    };
    savedRef.current=false;setScore(0);setDead(false);
    cancelAnimationFrame(rafRef.current);rafRef.current=requestAnimationFrame(loop);
  };

  useEffect(()=>{startGame();return()=>cancelAnimationFrame(rafRef.current);},[]);

  useEffect(()=>{
    if(dead&&!savedRef.current&&score>0){
      savedRef.current=true;
      saveScore(score,localStorage.getItem('token')).then(()=>fetchLeaderboard().then(d=>setLb(d)));
    }
  },[dead,score]);

  useEffect(()=>{
    const KEYS={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],W:[0,-1],s:[0,1],S:[0,1],a:[-1,0],A:[-1,0],d:[1,0],D:[1,0]};
    const onKey=(e)=>{
      if(e.key==='Escape'){onClose();return;}
      // Reiniciar con cualquier tecla de control cuando está muerto
      if(gRef.current?.dead && (e.key===' '||e.key==='Enter'||e.key.startsWith('Arrow')||['w','a','s','d','W','A','S','D'].includes(e.key))){
        e.preventDefault();
        startGame();
        return;
      }
      const next=KEYS[e.key];if(!next)return;e.preventDefault();
      const g=gRef.current;if(!g||g.dead)return;
      const last=g.dirQueue.length>0?g.dirQueue[g.dirQueue.length-1]:g.dir;
      if(last[0]!==0&&next[0]===-last[0])return;
      if(last[1]!==0&&next[1]===-last[1])return;
      if(last[0]===next[0]&&last[1]===next[1])return;
      if(g.dirQueue.length<1)g.dirQueue.push(next); // Solo 1 input en cola para máxima respuesta
    };
    
    // Controles táctiles optimizados para móvil - TODA LA PANTALLA
    let touchStartX = null;
    let touchStartY = null;
    let touchStartTime = null;
    const minSwipeDistance = 15; // Distancia mínima muy corta
    const maxSwipeTime = 300; // Tiempo máximo para considerar un swipe rápido
    
    const onTouchStart = (e) => {
      // No prevenir si es un botón o elemento interactivo
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    };
    
    const onTouchMove = (e) => {
      // No prevenir si es un botón o elemento interactivo
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      e.preventDefault(); // Prevenir scroll
      
      // Detección en tiempo real para mejor respuesta
      if (!touchStartX || !touchStartY) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) return;
      
      let next = null;
      if (absDeltaX > absDeltaY) {
        next = deltaX > 0 ? [1, 0] : [-1, 0];
      } else {
        next = deltaY > 0 ? [0, 1] : [0, -1];
      }
      
      if (next) {
        const g = gRef.current;
        if (!g || g.dead) return;
        const last = g.dirQueue.length > 0 ? g.dirQueue[g.dirQueue.length - 1] : g.dir;
        if (last[0] !== 0 && next[0] === -last[0]) return;
        if (last[1] !== 0 && next[1] === -last[1]) return;
        if (last[0] === next[0] && last[1] === next[1]) return;
        if (g.dirQueue.length < 1) {
          g.dirQueue.push(next);
          // Resetear para permitir nuevo swipe
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        }
      }
    };
    
    const onTouchEnd = (e) => {
      // No prevenir si es un botón o elemento interactivo
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      e.preventDefault();
      touchStartX = null;
      touchStartY = null;
      touchStartTime = null;
    };
    
    window.addEventListener('keydown',onKey);
    // Agregar eventos táctiles a TODO el documento para que funcione en toda la pantalla
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    
    return () => {
      window.removeEventListener('keydown',onKey);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  },[onClose]);

  const tryDir=(next)=>{
    const g=gRef.current;if(!g||g.dead)return;
    const last=g.dirQueue.length>0?g.dirQueue[g.dirQueue.length-1]:g.dir;
    if(last[0]!==0&&next[0]===-last[0])return;
    if(last[1]!==0&&next[1]===-last[1])return;
    if(last[0]===next[0]&&last[1]===next[1])return;
    if(g.dirQueue.length<3)g.dirQueue.push(next);
  };

  const btn={width:56,height:56,background:'rgba(255,255,255,0.6)',border:'1.5px solid rgba(255,255,255,0.9)',borderRadius:16,color:'#1d1d1f',fontSize:20,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.8)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',transition:'transform 0.1s',display:'flex',alignItems:'center',justifyContent:'center'};

  const LBPanel=()=>(
    <div style={{width:190,display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <span style={{fontSize:15,fontWeight:800,color:'#1d1d1f',letterSpacing:'-0.4px'}}>Ranking</span>
        <span style={{fontSize:15}}>🏆</span>
      </div>
      {lb.length===0?(
        <div style={{textAlign:'center',padding:'20px 0',color:'#6e6e73',fontSize:12}}><div style={{fontSize:28,marginBottom:6}}>🎮</div>¡Sé el primero!</div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:5,overflowY:'auto',maxHeight: window.innerHeight > 700 ? 460 : 380}}>
          {[...lb].sort((a,b)=>b.score-a.score).map((entry,i)=>{
            const isTop=i<3,col=isTop?TOP_COLORS[i]:null;
            return(<div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 9px',borderRadius:13,background:isTop?col.bg:'rgba(255,255,255,0.35)',border:isTop?`1px solid ${col.glow}`:'1px solid rgba(255,255,255,0.5)',boxShadow:isTop?`0 3px 10px ${col.glow}`:'none'}}>
              <span style={{fontSize:isTop?15:11,fontWeight:700,minWidth:18,textAlign:'center',color:isTop?col.text:'#6e6e73'}}>{isTop?MEDAL[i]:i+1}</span>
              {entry.avatar?<img src={entry.avatar} style={{width:26,height:26,borderRadius:7,objectFit:'cover',border:isTop?`1.5px solid ${col.text}`:'1.5px solid rgba(255,255,255,0.7)',flexShrink:0}} alt=""/>
                :<div style={{width:26,height:26,borderRadius:7,background:isTop?col.text:'#007aff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'white',flexShrink:0}}>{entry.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()||'?'}</div>}
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontWeight:700,fontSize:10,color:isTop?col.text:'#1d1d1f',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{entry.name}</p>
                <p style={{margin:0,fontSize:9,color:'#6e6e73'}}>{entry.score} pts</p>
              </div>
            </div>);
          })}
        </div>
      )}
    </div>
  );

  const [showLBSnake, setShowLBSnake] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  useEffect(()=>{const f=()=>setIsMobile(window.innerWidth<700);window.addEventListener('resize',f);return()=>window.removeEventListener('resize',f);},[]);

  const glassPanel = {
    background:'rgba(255,255,255,0.06)',
    backdropFilter:'blur(8px)',
    WebkitBackdropFilter:'blur(8px)',
    border:'1px solid rgba(255,255,255,0.25)',
    borderRadius:28,
    boxShadow:'0 2px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(255,255,255,0.04)',backdropFilter:'blur(6px)',WebkitBackdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:12,overflowY:'auto'}} onClick={onClose}>
      <div style={{display:'flex',flexDirection:isMobile?'column':'row',gap:12,alignItems:'flex-start',maxWidth:'98vw'}} onClick={e=>e.stopPropagation()}>

        {/* LB — siempre visible a la izquierda en desktop */}
        {!isMobile && (
          <div style={{...glassPanel,padding:'18px 14px',minWidth:190}}>
            <LBPanel/>
          </div>
        )}

        {/* Panel juego */}
        <div style={{...glassPanel,padding:'14px 14px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
            <div style={{display:'flex',alignItems:'baseline',gap:8}}>
              <span style={{fontSize:16,fontWeight:800,color:'#1d1d1f',letterSpacing:'-0.5px'}}>🐍 El Gusanito</span>
              <span style={{fontSize:13,fontWeight:700,color:'#007aff',background:'rgba(0,122,255,0.1)',padding:'2px 8px',borderRadius:20}}>{score} pts</span>
            </div>
            <div style={{display:'flex',gap:6}}>
              {/* Botón de Tienda */}
              <button onClick={e=>{e.stopPropagation();setShowShop(true);}}
                style={{background:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',border:'none',borderRadius:14,color:'#ffffff',padding:'5px 12px',cursor:'pointer',fontSize:11,fontWeight:700,boxShadow:'0 2px 8px rgba(245,87,108,0.3)'}}>
                🛍️ Tienda
              </button>
              {/* Botón Top solo en móvil */}
              {isMobile && (
                <button onClick={e=>{e.stopPropagation();setShowLBSnake(v=>!v);}}
                  style={{background:'rgba(0,0,0,0.07)',border:'none',borderRadius:14,color:'#1d1d1f',padding:'5px 10px',cursor:'pointer',fontSize:11,fontWeight:600}}>
                  🏆 Top
                </button>
              )}
              <button onClick={onClose} style={{background:'rgba(0,0,0,0.07)',border:'none',borderRadius:14,color:'#1d1d1f',padding:'5px 12px',cursor:'pointer',fontSize:12,fontWeight:600}}>Done</button>
            </div>
          </div>

          {/* LB en móvil cuando se abre con botón */}
          {isMobile && showLBSnake ? (
            <div style={{width:Math.min(W,300),maxHeight:220,overflowY:'auto',display:'flex',flexDirection:'column',gap:5}}>
              <LBPanel/>
            </div>
          ) : (
            <>
              <div style={{position:'relative',borderRadius:18,overflow:'hidden',border:'1.5px solid rgba(255,255,255,0.6)',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
                <canvas ref={canvasRef} width={W} height={H} style={{display:'block',maxWidth:'100%'}}/>

                {dead&&(
                  <button onClick={startGame}
                    style={{
                      position:'absolute',
                      top:'50%',
                      left:'50%',
                      transform:'translate(-50%,-50%)',
                      background:'rgba(255,255,255,0.22)',
                      backdropFilter:'blur(8px)',
                      border:'1.5px solid rgba(255,255,255,0.5)',
                      borderRadius:16,
                      width:56,
                      height:56,
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      cursor:'pointer',
                      fontSize:26,
                      color:'#1d1d1f',
                      transition:'all 0.2s',
                      boxShadow:'0 4px 20px rgba(0,0,0,0.15)'
                    }}
                    onMouseEnter={e=>{
                      e.currentTarget.style.background='rgba(255,255,255,0.4)';
                      e.currentTarget.style.transform='translate(-50%,-50%) scale(1.1)';
                    }}
                    onMouseLeave={e=>{
                      e.currentTarget.style.background='rgba(255,255,255,0.22)';
                      e.currentTarget.style.transform='translate(-50%,-50%) scale(1)';
                    }}
                  >
                    ↻
                  </button>
                )}
              </div>
              
              {/* Controles de personalización */}
              <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center'}}>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
                  <span style={{fontSize:12,fontWeight:600,color:'#6e6e73'}}>Color:</span>
                  {['#00ff88','#ff4757','#3742fa','#ffa502','#7bed9f','#ff6b6b'].map(color=>(
                    <button key={color} onClick={()=>{ setSnakeColor(color); snakeColorRef.current=color; equippedSkinRef.current=null; setEquippedSkin(null); }}
                      style={{width:24,height:24,borderRadius:12,background:color,border:snakeColor===color?'2px solid #1d1d1f':'1px solid rgba(255,255,255,0.3)',cursor:'pointer'}}/>
                  ))}
                  <button onClick={()=>setShowColorPicker(true)}
                    style={{width:24,height:24,borderRadius:12,background:'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)',border:'1px solid rgba(255,255,255,0.3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'white'}}>+</button>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
                  <span style={{fontSize:12,fontWeight:600,color:'#6e6e73'}}>Comida:</span>
                  {['🍎','🍊','🍌','🍇','🍓','🥕','🍒','🥝'].map(emoji=>(
                    <button key={emoji} onClick={()=>{ setFoodEmoji(emoji); foodEmojiRef.current=emoji; }}
                      style={{fontSize:16,background:foodEmoji===emoji?'rgba(0,122,255,0.2)':'transparent',border:foodEmoji===emoji?'1px solid #007aff':'1px solid rgba(255,255,255,0.3)',borderRadius:8,padding:'4px 6px',cursor:'pointer'}}>{emoji}</button>
                  ))}
                  <button onClick={()=>setShowEmojiPicker(true)}
                    style={{fontSize:14,background:'transparent',border:'1px solid rgba(255,255,255,0.3)',borderRadius:8,padding:'4px 8px',cursor:'pointer',fontWeight:700,color:'#6e6e73'}}>+</button>
                </div>
              </div>
              
              {/* Color Picker Modal */}
              {showColorPicker && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={()=>setShowColorPicker(false)}>
                  <div style={{background:'white',borderRadius:16,padding:20,maxWidth:300}} onClick={e=>e.stopPropagation()}>
                    <h3 style={{margin:'0 0 15px',fontSize:16,fontWeight:700}}>Elige un color</h3>
                    <input type="color" value={snakeColor} onChange={e=>{ setSnakeColor(e.target.value); snakeColorRef.current=e.target.value; equippedSkinRef.current=null; setEquippedSkin(null); }}
                      style={{width:'100%',height:40,border:'none',borderRadius:8,cursor:'pointer'}}/>
                    <div style={{display:'flex',gap:8,marginTop:15,justifyContent:'flex-end'}}>
                      <button onClick={()=>setShowColorPicker(false)}
                        style={{padding:'8px 16px',border:'1px solid #ddd',borderRadius:8,background:'white',cursor:'pointer'}}>Cancelar</button>
                      <button onClick={()=>setShowColorPicker(false)}
                        style={{padding:'8px 16px',border:'none',borderRadius:8,background:'#007aff',color:'white',cursor:'pointer'}}>Listo</button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Emoji Picker Modal */}
              {showEmojiPicker && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={()=>setShowEmojiPicker(false)}>
                  <div style={{background:'white',borderRadius:16,padding:20,maxWidth:320,maxHeight:400,overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
                    <h3 style={{margin:'0 0 15px',fontSize:16,fontWeight:700}}>Elige un emoji</h3>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(8, 1fr)',gap:8}}>
                      {['🍎','🍊','🍌','🍇','🍓','🥕','🍒','🥝','🍑','🥭','🍍','🥥','🫐','🍈','🍉','🍋','🥑','🍅','🌶️','🥒','🥬','🥦','🧄','🧅','🌽','🥖','🍞','🥨','🧀','🥚','🍳','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🌮','🌯','🥙','🧆','🥘','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🎂','🍰','🍪','🍫','🍬','🍭'].map(emoji=>(
                        <button key={emoji} onClick={()=>{ setFoodEmoji(emoji); foodEmojiRef.current=emoji; setShowEmojiPicker(false); }}
                          style={{fontSize:20,padding:8,border:'1px solid #ddd',borderRadius:8,background:'white',cursor:'pointer',transition:'background 0.2s'}}
                          onMouseEnter={e=>e.target.style.background='#f0f0f0'}
                          onMouseLeave={e=>e.target.style.background='white'}>{emoji}</button>
                      ))}
                    </div>
                    <button onClick={()=>setShowEmojiPicker(false)}
                      style={{width:'100%',marginTop:15,padding:'10px',border:'none',borderRadius:8,background:'#007aff',color:'white',cursor:'pointer',fontSize:14,fontWeight:600}}>Cerrar</button>
                  </div>
                </div>
              )}
            </>
          )}
          <p style={{color:'rgba(0,0,0,0.3)',fontSize:10,margin:0}}>Deslizar para mover · Espacio reinicia · ESC cierra</p>
        </div>
      </div>
      
      {/* Modal de la Tienda */}
      {showShop && (
        <SnakeShop
          onClose={() => setShowShop(false)}
          onEquipSkin={handleEquipSkin}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
// === DICCIONARIO DE IDOMAS (EJEMPLO) ===
const translations = {
  es: {
    pageTitle: "Configuración",
    pageSubtitle: "Personaliza tu experiencia en Arachiz",
    profile: "Perfil",
    fullName: "Nombre completo",
    email: "Correo electrónico",
    instructor: "Instructor",
    student: "Aprendiz",
    changePhoto: "Cambiar foto",
    saveProfile: "Guardar perfil",
    saving: "Guardando...",
    appearance: "Apariencia",
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    language: "Idioma",
    englishComingSoon: "Traducción aplicada en esta página como ejemplo.",
    notificationsTitle: "Notificaciones",
    sysNotifications: "Notificaciones del sistema",
    sysDesc: "Alertas de sesiones, excusas y actividad",
    security: "Seguridad",
    sessionDesc: "Tu sesión expira automáticamente después de 8 horas de inactividad.",
    currentSession: "Sesión actual",
    advSensor: "Opciones avanzadas del sensor",
    clearDb: "Borrar base de datos del sensor de huellas",
    cancel: "Cancelar"
  },
  en: {
    pageTitle: "Settings",
    pageSubtitle: "Customize your Arachiz experience",
    profile: "Profile",
    fullName: "Full Name",
    email: "Email address",
    instructor: "Instructor",
    student: "Student",
    changePhoto: "Change photo",
    saveProfile: "Save profile",
    saving: "Saving...",
    appearance: "Appearance",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    language: "Language",
    englishComingSoon: "Translation applied on this page as an example.",
    notificationsTitle: "Notifications",
    sysNotifications: "System notifications",
    sysDesc: "Session alerts, excuses and activity",
    security: "Security",
    sessionDesc: "Your session expires automatically after 8 hours of inactivity.",
    currentSession: "Current session",
    advSensor: "Advanced sensor options",
    clearDb: "Clear fingerprint sensor database",
    cancel: "Cancel"
  }
};

export default function Configuracion() {
  const { user, updateUser } = useContext(AuthContext);
  const { settings, updateSetting, toggleDark } = useSettings();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const t = (key) => {
    const lang = settings?.language || 'es';
    return translations[lang]?.[key] || translations['es'][key] || key;
  };

  const [fullName, setFullName]           = useState(user?.fullName || '');
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatarUrl ? (user.avatarUrl.startsWith('data:')||user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_BASE}${user.avatarUrl}`) : null
  );
  const [avatarFile, setAvatarFile]       = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Sincronizar avatarPreview cuando el user se actualiza (ej: al cargar /auth/me)
  useEffect(() => {
    if (user?.avatarUrl && !avatarFile) {
      const url = user.avatarUrl;
      setAvatarPreview(url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:') ? url : `${API_BASE}${url}`);
    }
  }, [user?.avatarUrl]);

  // Snake — 7 clicks en "Seguridad"
  const [secClicks, setSecClicks] = useState(0);
  const [showSnake, setShowSnake] = useState(false);
  const secTimer = useRef(null);
  const handleSecClick = () => {
    setSecClicks(n => {
      const next = n + 1;
      if (next >= 7) { setShowSnake(true); return 0; }
      clearTimeout(secTimer.current);
      secTimer.current = setTimeout(() => setSecClicks(0), 2000);
      return next;
    });
  };

  // Breakout — 7 clicks en "Apariencia"
  const [arkClicks, setArkClicks] = useState(0);
  const [showArk, setShowArk]     = useState(false);
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

  // El Maní — 7 clicks en "Idioma" / Memory Flash — 10 clicks en "Idioma"
  const [idiomaClicks, setIdiomaClicks] = useState(0);
  const [showFlappy, setShowFlappy]     = useState(false);
  const idiomaTimer = useRef(null);
  const handleIdiomaClick = () => {
    setIdiomaClicks(n => {
      const next = n + 1;
      if (next >= 10) { setShowMemory(true); return 0; }
      if (next >= 7)  { setShowFlappy(true); return next; } // continúa contando hasta 10
      clearTimeout(idiomaTimer.current);
      idiomaTimer.current = setTimeout(() => setIdiomaClicks(0), 2000);
      return next;
    });
  };

  // Tower Stack — 7 clicks en "Notificaciones" (todos lo ven)
  const [notiClicks, setNotiClicks] = useState(0);
  const [showTower,  setShowTower]  = useState(false);
  const notiTimer = useRef(null);
  const handleNotiClick = () => {
    setNotiClicks(n => {
      const next = n + 1;
      if (next >= 7) { setShowTower(true); return 0; }
      clearTimeout(notiTimer.current);
      notiTimer.current = setTimeout(() => setNotiClicks(0), 2000);
      return next;
    });
  };

  // Memory Flash — 7 clicks en "Español" (todos lo ven)
  const [espanolClicks, setEspanolClicks] = useState(0);
  const [showMemory, setShowMemory] = useState(false);
  const espanolTimer = useRef(null);
  const handleEspanolClick = () => {
    setEspanolClicks(n => {
      const next = n + 1;
      if (next >= 7) { setShowMemory(true); return 0; }
      clearTimeout(espanolTimer.current);
      espanolTimer.current = setTimeout(() => setEspanolClicks(0), 2000);
      return next;
    });
  };

  // Reaction Time — 7 clicks en "Perfil"
  const [perfilClicks, setPerfilClicks] = useState(0);
  const [showReaction, setShowReaction] = useState(false);
  const perfilTimer = useRef(null);
  const handlePerfilClick = () => {
    setPerfilClicks(n => {
      const next = n + 1;
      if (next >= 7) { setShowReaction(true); return 0; }
      clearTimeout(perfilTimer.current);
      perfilTimer.current = setTimeout(() => setPerfilClicks(0), 2000);
      return next;
    });
  };

  // Wordle — 7 clicks en "Cambiar Contraseña" (si existe) o en el email
  const [wordleClicks, setWordleClicks] = useState(0);
  const [showWordle,   setShowWordle]   = useState(false);
  const wordleTimer = useRef(null);
  const handleWordleClick = () => {
    setWordleClicks(n => {
      const next = n + 1;
      if (next >= 7) { setShowWordle(true); return 0; }
      clearTimeout(wordleTimer.current);
      wordleTimer.current = setTimeout(() => setWordleClicks(0), 2000);
      return next;
    });
  };

  // Botón oculto instructor — 10 clicks en el rol para borrar huellas
  const [instClicks, setInstClicks] = useState(0);
  const [showClear, setShowClear]   = useState(false);
  const instTimer = useRef(null);
  const handleInstClick = () => {
    if (user?.userType !== 'instructor') return;
    setInstClicks(n => {
      const next = n + 1;
      if (next >= 10) { setShowClear(true); return 0; }
      clearTimeout(instTimer.current);
      instTimer.current = setTimeout(() => setInstClicks(0), 2000);
      return next;
    });
  };

  const handleClearFingerprints = async () => {
    if (!confirm('¿Borrar TODA la base de datos del sensor de huellas?')) return;
    try {
      const res  = await fetch(`${API_BASE}/api/serial/clear-fingerprints`, { method:'POST', headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message || 'Comando enviado al sensor', 'success');
      setShowClear(false);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const initials  = user?.fullName ? user.fullName.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : '?';
  const roleColor = user?.userType === 'instructor' ? 'bg-[#4285F4]' : 'bg-[#34A853]';

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { showToast('Máx. 5MB','error'); return; }
    // Comprimir a máx 400x400 y calidad 0.75 antes de base64
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 400;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else        { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const b64 = canvas.toDataURL('image/jpeg', 0.75);
      URL.revokeObjectURL(url);
      setAvatarPreview(b64);
      setAvatarFile(b64);
    };
    img.src = url;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setSavingProfile(true);
    try {
      const body = {};
      if (fullName.trim() && fullName !== user?.fullName) body.fullName = fullName.trim();
      if (avatarFile) body.avatarBase64 = avatarFile; // base64 string
      const d    = await fetch(`${API_BASE}/api/auth/profile`, {
        method:'PUT',
        headers:{ Authorization:`Bearer ${localStorage.getItem('token')}`, 'Content-Type':'application/json' },
        body: JSON.stringify(body),
      });
      const json = await d.json();
      if (!d.ok) throw new Error(json.error || 'Error');
      if (updateUser) updateUser(json.user);
      setAvatarFile(null);
      showToast('Perfil actualizado','success');
    } catch(err) { showToast(err.message,'error'); }
    finally { setSavingProfile(false); }
  };

  const LANGUAGES = [{ code:'es', label:'Español', flag:'🇨🇴' }, { code:'en', label:'English', flag:'🇺🇸' }];

  return (
    <div className="animate-fade-in space-y-5 max-w-2xl">
      {showSnake  && <SnakeGame    onClose={() => setShowSnake(false)}  currentUser={user}/>}
      {showArk    && <BreakoutGame onClose={() => setShowArk(false)}    currentUser={user}/>}
      {showFlappy && <FlappyGame   onClose={() => setShowFlappy(false)}  currentUser={user}/>}
      {showTower  && <TowerStack   onClose={() => setShowTower(false)}   currentUser={user}/>}
      {showMemory && <MemoryFlash  onClose={() => setShowMemory(false)}  currentUser={user}/>}
      {showReaction && <ReactionTime onClose={() => setShowReaction(false)} currentUser={user}/>}
      {showWordle && <WordleGame   onClose={() => setShowWordle(false)}  currentUser={user}/>}

      <PageHeader title="Configuración" subtitle="Personaliza tu experiencia en Arachiz" />

      {/* Perfil */}
      <Section icon={User} title="Perfil" onTitleClick={handlePerfilClick}>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-5 mb-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover shadow-md"/>
                : <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md ${roleColor}`}>{initials}</div>
              }
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white"/>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange}/>
            </div>
            <div>
              <p className="font-bold text-gray-900">{user?.fullName}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className={`badge mt-1 ${user?.userType==='instructor'?'badge-info':'badge-success'}`}>
                {user?.userType==='instructor'?'Instructor':'Aprendiz'}
              </span>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="block text-xs text-[#4285F4] hover:underline mt-1">
                Cambiar foto
              </button>
            </div>
          </div>
          <div>
            <label className="input-label">Nombre completo</label>
            <input className="input-field" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Tu nombre completo"/>
          </div>
          <div>
            <label className="input-label">Correo electrónico</label>
            <input type="email" className="input-field opacity-60 cursor-not-allowed" value={user?.email||''} disabled/>
            <p className="text-xs text-gray-400 mt-1 cursor-default select-none" onClick={handleWordleClick}>El correo no puede modificarse</p>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
            {savingProfile ? <Loader size={15} className="animate-spin"/> : <Save size={15}/>}
            {savingProfile ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </form>
      </Section>

      {/* Apariencia */}
      <Section icon={Palette} title={t('appearance')} onTitleClick={handleArkClick}>
        <p className="text-sm font-medium text-gray-700 mb-3">{t('theme')}</p>
        <div className="grid grid-cols-2 gap-3">
          {[{id:'light',label:t('light'),icon:Sun},{id:'dark',label:t('dark'),icon:Moon}].map(({id,label,icon:Icon}) => {
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
        {arkClicks > 0 && arkClicks < 7 && <p className="text-xs text-gray-300 text-center mt-2">{7-arkClicks} más...</p>}
      </Section>

      {/* Idioma */}
      <Section icon={Globe} title={t('language')} onTitleClick={handleIdiomaClick}>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map(({code,label,flag}) => (
            <button key={code} type="button"
              onClick={() => { 
                updateSetting('language',code); 
                showToast(`Idioma: ${label}`,'info');
                if (code === 'es') handleEspanolClick(); // Solo trigger en Español
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${settings.language===code?'border-[#4285F4] bg-blue-50':'border-gray-200 hover:border-gray-300'}`}>
              <span className="text-2xl">{flag}</span>
              <div className="text-left">
                <p className={`text-sm font-semibold ${settings.language===code?'text-[#4285F4]':'text-gray-700'}`}>{label}</p>
                <p className="text-xs text-gray-400">{code.toUpperCase()}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">{t('englishComingSoon')}</p>
        {idiomaClicks > 0 && idiomaClicks < 7 && <p className="text-xs text-gray-300 text-center mt-1">{7-idiomaClicks} más...</p>}
        {espanolClicks > 0 && espanolClicks < 7 && <p className="text-xs text-blue-300 text-center mt-1">Memory: {7-espanolClicks} más...</p>}
      </Section>

      {/* Notificaciones */}
      <Section icon={Bell} title={t('notificationsTitle')} onTitleClick={handleNotiClick}>
        <div className="divide-y divide-gray-100">
          <ToggleSwitch checked={settings.notifications} onChange={v=>updateSetting('notifications',v)}
            label={t('sysNotifications')} description={t('sysDesc')}/>
        </div>
        {notiClicks > 0 && notiClicks < 7 && <p className="text-xs text-gray-300 text-center mt-1">{7-notiClicks} más...</p>}
      </Section>

      {/* Hardware — solo instructores */}
      {user?.userType === 'instructor' && (
        <Section icon={Usb} title="Hardware / Arduino">
          <SerialConnect />
        </Section>
      )}

      {/* Seguridad */}
      <Section icon={Shield} title={t('security')} onTitleClick={handleSecClick}>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{t('sessionDesc')}</p>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('currentSession')}</p>
            <p className="text-sm text-gray-700">{user?.email}</p>
            <p className="text-xs text-gray-400 capitalize cursor-default select-none" onClick={handleInstClick}>
              {user?.userType}
            </p>
          </div>
          {secClicks > 0 && secClicks < 7 && <p className="text-xs text-gray-300 text-center">{7-secClicks} más...</p>}
          {showClear && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-red-600">{t('advSensor')}</p>
              <button onClick={handleClearFingerprints} className="w-full text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg py-2 transition-colors">
                {t('clearDb')}
              </button>
              <button onClick={() => setShowClear(false)} className="w-full text-xs text-gray-500 hover:text-gray-700 py-1">
                {t('cancel')}
              </button>
            </div>
          )}
        </div>
      </Section>

      <div className="flex items-center justify-center gap-2 pt-8 pb-12 cursor-default select-none opacity-50">
        <img src="/mi-logo.png" alt="Arachiz Logo" className="w-5 h-5 object-contain" />
        <p className="text-gray-500 text-xs font-medium">Version 1.2.12</p>
      </div>
    </div>
  );
}
