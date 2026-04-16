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
    let dx = 4.5, dy = -4.5;          // bola rápida desde el inicio
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
      dx=4.5;dy=-4.5;level=1;sc=0;
      bricks=makeBricks();
      deadRef.current=false;
      savedRef.current=false;
      setScore(0);setDead(false);
      req=requestAnimationFrame(draw);
    };
    restartFn.current=restart;

    const kd=(e)=>{
      if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')right=true;
      if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')left=true;
      if(e.key==='Escape')onClose();
      if((e.key===' '||e.key==='Enter')&&deadRef.current){e.preventDefault();restart();}
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
      ctx.shadowColor='#ff6b6b';ctx.shadowBlur=14;
      ctx.beginPath();ctx.arc(x,y,ballR,0,Math.PI*2);ctx.fillStyle='#ff4444';ctx.fill();
      ctx.shadowBlur=0;
      // Paleta con glow
      ctx.shadowColor='#4285F4';ctx.shadowBlur=8;
      ctx.beginPath();ctx.roundRect?ctx.roundRect(padX,canvas.height-padH-3,padW,padH,4):ctx.rect(padX,canvas.height-padH-3,padW,padH);
      ctx.fillStyle='#4285F4';ctx.fill();ctx.shadowBlur=0;
      // Colisión ladrillos
      for(let c=0;c<COLS;c++)for(let r=0;r<ROWS;r++){
        const b=bricks[c][r];
        if(!b.on)continue;
        if(x+ballR>b.x&&x-ballR<b.x+BW&&y+ballR>b.y&&y-ballR<b.y+BH){
          dy=-dy;b.hp--;
          if(b.hp<=0){b.on=0;sc+=level*2;setScore(sc);}
          // Acelerar cada 4 ladrillos destruidos
          const destroyed=bricks.flat().filter(b=>!b.on).length;
          if(destroyed%4===0){const spd=Math.min(9,Math.abs(dx)+0.3);dx=dx>0?spd:-spd;dy=dy>0?spd:-spd;}
        }
      }
      // Siguiente nivel
      if(bricks.every(col=>col.every(b=>!b.on))){
        level++;bricks=makeBricks();
        const spd=Math.min(10,4.5+level*0.6);
        dx=dx>0?spd:-spd;dy=-Math.abs(spd);
      }
      if(x+dx>canvas.width-ballR||x+dx<ballR)dx=-dx;
      if(y+dy<ballR)dy=-dy;
      else if(y+dy>canvas.height-ballR){
        const padTop = canvas.height-padH-3;
        if(y+dy >= padTop-ballR && x > padX-ballR && x < padX+padW+ballR){
          // Colisión con paleta — reposicionar encima para evitar que entre
          y = padTop - ballR;
          dy = -Math.abs(dy);
          dx = dx + (x-(padX+padW/2))*0.15;
          // Limitar ángulo extremo
          if(Math.abs(dx)>8)dx=dx>0?8:-8;
        } else if(y+dy > canvas.height+ballR) {
          deadRef.current=true;setDead(true);return;
        }
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
    <div style={{display:'flex',flexDirection:'column',gap:6,overflowY:'auto',maxHeight:280}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
        <span style={{fontSize:14,fontWeight:800,color:'white',letterSpacing:'-0.3px'}}>Ranking</span>
        <span style={{fontSize:14}}>🏆</span>
      </div>
      {lb.length===0
        ?<p style={{color:'rgba(255,255,255,0.4)',textAlign:'center',padding:'16px 0',fontSize:12}}>¡Sé el primero!</p>
        :lb.map((e,i)=>{
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
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(10px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}>
                  <p style={{color:'white',fontWeight:800,fontSize:20,margin:0}}>Game Over</p>
                  <p style={{color:'rgba(255,255,255,0.5)',fontSize:12,margin:0}}>{score} pts</p>
                  <button onClick={()=>restartFn.current&&restartFn.current()}
                    style={{background:'#4285F4',color:'white',border:'none',borderRadius:18,padding:'9px 24px',fontWeight:700,cursor:'pointer',fontSize:13,marginTop:4}}>
                    Reintentar
                  </button>
                </div>
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
    let speed = 2.5;
    let started = false;
    let isDead = false;
    let req;

    // SVG-style cloud helper
    const drawCloud = (cx, cy, r) => {
      ctx.save();
      ctx.shadowColor = 'rgba(200,220,255,0.4)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      // Main body
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + r*0.7, cy + r*0.2, r*0.65, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - r*0.6, cy + r*0.2, r*0.55, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + r*0.3, cy - r*0.5, r*0.55, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - r*0.2, cy - r*0.4, r*0.45, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0,0,W,H);

      // Fondo Glass App
      const bg = ctx.createLinearGradient(0,0,0,H);
      bg.addColorStop(0,'rgba(220,235,255,0.97)');
      bg.addColorStop(1,'rgba(200,220,245,0.90)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(0,0,W,H,18) : ctx.rect(0,0,W,H);
      ctx.fill();

      // Nubes SVG-style
      drawCloud(60, 75, 22);
      drawCloud(200, 45, 18);
      drawCloud(295, 105, 20);

      // Tuberías de cristal (Glassmorphism)
      pipes.forEach(p => {
        ctx.save();
        ctx.shadowColor = 'rgba(0,122,255,0.25)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 4;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.5;
        const grd = ctx.createLinearGradient(p.x,0,p.x+PW,0);
        grd.addColorStop(0,'rgba(255,255,255,0.4)');
        grd.addColorStop(0.5,'rgba(230,245,255,0.5)');
        grd.addColorStop(1,'rgba(255,255,255,0.3)');
        ctx.fillStyle = grd;
        // Tubería Superior
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(p.x, 0, PW, p.top, 8) : ctx.rect(p.x, 0, PW, p.top);
        ctx.fill(); ctx.stroke();
        // Gorro Superior
        ctx.beginPath();
        const capTopY = p.top - 18;
        ctx.roundRect ? ctx.roundRect(p.x - 4, capTopY, PW + 8, 18, 6) : ctx.rect(p.x - 4, capTopY, PW + 8, 18);
        ctx.fillStyle = 'rgba(250,250,255,0.7)';
        ctx.fill(); ctx.stroke();
        // Tubería Inferior
        ctx.fillStyle = grd;
        ctx.beginPath();
        const currentGap = p.gap || GAP;
        ctx.roundRect ? ctx.roundRect(p.x, p.top + currentGap, PW, H - p.top - currentGap - 38, 8) : ctx.rect(p.x, p.top + currentGap, PW, H - p.top - currentGap - 38);
        ctx.fill(); ctx.stroke();
        // Gorro Inferior
        ctx.beginPath();
        const capBotY = p.top + currentGap;
        ctx.roundRect ? ctx.roundRect(p.x - 4, capBotY, PW + 8, 18, 6) : ctx.rect(p.x - 4, capBotY, PW + 8, 18);
        ctx.fillStyle = 'rgba(250,250,255,0.7)';
        ctx.fill(); ctx.stroke();
        ctx.restore();
      });

      // Suelo — línea sutil sin rectángulo visible
      ctx.fillStyle = 'rgba(0,122,255,0.12)';
      ctx.fillRect(0, H - 38, W, 2);

      // Maní con alas animadas (arcos simples)
      ctx.save();
      ctx.translate(bird.x, bird.y);
      const angle = Math.min(Math.max(bird.vy * 0.05,-0.6),1.4);
      ctx.rotate(angle);

      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      // Alas: dos arcos simples que se animan con Math.sin(frame)
      const wingY = Math.sin(frame * 0.35) * 8;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = 'rgba(180,200,255,0.7)';
      ctx.lineWidth = 1;
      // Ala izquierda
      ctx.beginPath();
      ctx.arc(-16, -4 + wingY, 10, Math.PI * 0.8, Math.PI * 2.2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Ala derecha
      ctx.beginPath();
      ctx.arc(16, -4 + wingY, 10, Math.PI * -0.2, Math.PI * 1.2);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.shadowBlur = 0;
      // Maní
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🥜', 0, 1);
      ctx.restore();

      // Score
      ctx.font = '800 36px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,122,255,0.85)';
      ctx.shadowColor = 'rgba(255,255,255,1)';
      ctx.shadowBlur = 12;
      ctx.fillText(sc, W/2, 60);
      ctx.shadowBlur = 0;

      // Pantalla de inicio
      if(!started && !isDead){
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        const rw = 200, rh = 56;
        ctx.roundRect ? ctx.roundRect(W/2 - rw/2, H/2 - rh/2 + 20, rw, rh, 20) : ctx.rect(W/2 - rw/2, H/2 - rh/2 + 20, rw, rh);
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#007aff';
        ctx.font = '800 16px system-ui';
        ctx.fillText('🥜 Toca para volar', W/2, H/2 + 25);
      }
    };

    const tick = () => {
      if(isDead) return;
      if(started){
        bird.vy += 0.5;
        bird.y  += bird.vy;
        frame++;
        const interval = Math.max(50, 90 - sc * 3.5);
        if(frame % Math.floor(interval) === 0){
          const currentGap = Math.max(110, GAP - Math.floor(sc * 1.5));
          const topH = 40 + Math.random() * (H - currentGap - 80);
          pipes.push({x: W+10, top: topH, gap: currentGap, scored: false});
        }
        pipes.forEach(p => { p.x -= speed; });
        pipes = pipes.filter(p => p.x > -PW-10);
        pipes.forEach(p => {
          if(!p.scored && p.x+PW < bird.x){
            p.scored=true; sc++;
            setScore(sc);
            speed = Math.min(6.5, 2.8 + sc*0.12);
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
      bird.vy = -9;
    };

    rafRef.current = { jump: doJump };
    req = requestAnimationFrame(tick);

    const onKey=(e)=>{
      if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){
        e.preventDefault();
        if(isDead){ restartRef.current?.(); return; }
        doJump();
      }
      if(e.key==='Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    // Swipe up detection
    let touchStartY = 0;
    const onTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const onTouchEnd = (e) => {
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      if(deltaY < -30) { if(!isDead) doJump(); }
    };
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    return()=>{
      cancelAnimationFrame(req);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
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
          {lb.map((entry,i)=>{
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
                  <div style={{position:'absolute',inset:0,background:'rgba(255,255,255,0.88)',backdropFilter:'blur(16px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,borderRadius:14}}>
                    <span style={{fontSize:44}}>💥</span>
                    <p style={{color:'#1d1d1f',fontWeight:800,fontSize:20,letterSpacing:'-0.6px',margin:0}}>Game Over</p>
                    <p style={{color:'#6e6e73',fontSize:13,margin:0}}>{score} tuberías 🏆</p>
                    <button onClick={e=>{e.stopPropagation();restart();}}
                      style={{background:'#007aff',color:'white',border:'none',borderRadius:22,padding:'10px 28px',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 6px 20px rgba(0,122,255,0.4)',marginTop:4}}>
                      Try Again
                    </button>
                  </div>
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

const MEDAL = ['🥇','🥈','🥉'];
const TOP_COLORS = [
  { text:'#FFD700', glow:'rgba(255,215,0,0.4)', bg:'rgba(255,215,0,0.12)' },
  { text:'#C0C0C0', glow:'rgba(192,192,192,0.4)', bg:'rgba(192,192,192,0.1)' },
  { text:'#CD7F32', glow:'rgba(205,127,50,0.4)',  bg:'rgba(205,127,50,0.1)' },
];

function Leaderboard({ onClose, currentUser }) {
  const lb = getLeaderboard();
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(180,200,220,0.2)',backdropFilter:'blur(32px) saturate(180%)',WebkitBackdropFilter:'blur(32px) saturate(180%)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:201,padding:16}} onClick={onClose}>
      <div style={{background:'rgba(255,255,255,0.45)',backdropFilter:'blur(60px) saturate(220%)',WebkitBackdropFilter:'blur(60px) saturate(220%)',border:'1.5px solid rgba(255,255,255,0.9)',borderRadius:36,boxShadow:'0 40px 100px rgba(0,0,0,0.12),inset 0 2px 0 rgba(255,255,255,1)',padding:'28px 24px',width:'100%',maxWidth:380,maxHeight:'85vh',overflow:'hidden',display:'flex',flexDirection:'column',gap:16}} onClick={e=>e.stopPropagation()}>
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
  const W = COLS*CELL, H = ROWS*CELL;

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
        setSnakeColor(equipped.skin.headColor);
      }
    } catch (error) {
      console.error('Error loading equipped skin:', error);
    }
  };

  const handleEquipSkin = (skin) => {
    setEquippedSkin(skin);
    setSnakeColor(skin.headColor);
  };

  const randFood=(snake)=>{let f;do{f=[Math.floor(Math.random()*COLS),Math.floor(Math.random()*ROWS)];}while(snake.some(c=>c[0]===f[0]&&c[1]===f[1]));return f;};

  const drawGame=(g,ctx)=>{
    ctx.clearRect(0,0,W,H);
    
    // Fondo simple y limpio
    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#f8fafc');
    bg.addColorStop(1,'#e2e8f0');
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,W,H);
    
    // Aplicar efectos de skin si hay una equipada
    const skin = equippedSkin;
    let bodyColor = snakeColor;
    let headColor = snakeColor;
    
    if (skin) {
      bodyColor = skin.bodyColor;
      headColor = skin.headColor;
      
      // Efectos de rastro
      if (skin.trailEffect && skin.trailEffect !== 'none' && g.snake.length > 1) {
        for (let i = 1; i < Math.min(g.snake.length, 10); i++) {
          const [x, y] = g.snake[i];
          const alpha = 1 - (i / 10);
          
          if (skin.trailEffect === 'sparkles') {
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(x*CELL+CELL/2, y*CELL+CELL/2, 3, 0, Math.PI*2);
            ctx.fill();
          } else if (skin.trailEffect === 'fire') {
            ctx.fillStyle = `rgba(255, 107, 53, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.arc(x*CELL+CELL/2, y*CELL+CELL/2, 4, 0, Math.PI*2);
            ctx.fill();
          } else if (skin.trailEffect === 'ice') {
            ctx.fillStyle = `rgba(160, 216, 241, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(x*CELL+CELL/2, y*CELL+CELL/2, 3, 0, Math.PI*2);
            ctx.fill();
          } else if (skin.trailEffect === 'lightning') {
            ctx.strokeStyle = `rgba(255, 235, 59, ${alpha * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x*CELL+CELL/2, y*CELL+CELL/2);
            if (i < g.snake.length - 1) {
              const [nx, ny] = g.snake[i+1];
              ctx.lineTo(nx*CELL+CELL/2, ny*CELL+CELL/2);
            }
            ctx.stroke();
          } else if (skin.trailEffect === 'stars') {
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.7})`;
            ctx.font = `${CELL/2}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', x*CELL+CELL/2, y*CELL+CELL/2);
          }
        }
      }
    }
    
    // Serpiente como una línea continua y fluida
    if(g.snake.length > 0) {
      // Aplicar patrón de skin
      if (skin && skin.pattern === 'gradient') {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, headColor);
        grad.addColorStop(1, bodyColor);
        ctx.strokeStyle = grad;
      } else if (skin && skin.pattern === 'rainbow') {
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, '#ff0080');
        grad.addColorStop(0.25, '#ff8000');
        grad.addColorStop(0.5, '#ffff00');
        grad.addColorStop(0.75, '#00ff80');
        grad.addColorStop(1, '#0080ff');
        ctx.strokeStyle = grad;
      } else if (skin && skin.pattern === 'galaxy') {
        const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W);
        grad.addColorStop(0, '#4a148c');
        grad.addColorStop(0.5, '#1a237e');
        grad.addColorStop(1, '#000000');
        ctx.strokeStyle = grad;
      } else if (skin && skin.pattern === 'neon') {
        ctx.strokeStyle = bodyColor;
        ctx.shadowColor = bodyColor;
        ctx.shadowBlur = 15;
      } else {
        ctx.strokeStyle = bodyColor;
      }
      
      ctx.lineWidth = CELL - 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(g.snake[0][0] * CELL + CELL/2, g.snake[0][1] * CELL + CELL/2);
      
      for(let i = 1; i < g.snake.length; i++) {
        ctx.lineTo(g.snake[i][0] * CELL + CELL/2, g.snake[i][1] * CELL + CELL/2);
      }
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Cabeza de la serpiente
      const [headX, headY] = g.snake[0];
      ctx.fillStyle = headColor;
      ctx.beginPath();
      ctx.arc(headX*CELL+CELL/2, headY*CELL+CELL/2, CELL/2-1, 0, Math.PI*2);
      ctx.fill();
      
      // Ojos según el estilo de la skin
      const eyeStyle = skin?.eyeStyle || 'normal';
      ctx.fillStyle = '#ffffff';
      const eyeSize = eyeStyle === 'cute' ? 5 : 4;
      const eyeOffset = 7;
      
      if (eyeStyle === 'laser') {
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
      }
      
      ctx.beginPath();
      ctx.arc(headX*CELL+eyeOffset, headY*CELL+eyeOffset, eyeSize, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX*CELL+CELL-eyeOffset, headY*CELL+eyeOffset, eyeSize, 0, Math.PI*2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // Pupilas
      if (eyeStyle !== 'laser') {
        ctx.fillStyle = eyeStyle === 'angry' ? '#ff0000' : '#000000';
        const pupilSize = eyeStyle === 'cute' ? 3 : 2;
        ctx.beginPath();
        ctx.arc(headX*CELL+eyeOffset, headY*CELL+eyeOffset, pupilSize, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX*CELL+CELL-eyeOffset, headY*CELL+eyeOffset, pupilSize, 0, Math.PI*2);
        ctx.fill();
      }
    }
    
    // Comida personalizable
    const [fx, fy] = g.food;
    ctx.font = `${CELL-2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(foodEmoji, fx*CELL+CELL/2, fy*CELL+CELL/2);
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
      speed:120, // Velocidad inicial más lenta para móvil
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
      if(e.key===' '||e.key==='Enter'){e.preventDefault();if(gRef.current?.dead)startGame();return;}
      const next=KEYS[e.key];if(!next)return;e.preventDefault();
      const g=gRef.current;if(!g||g.dead)return;
      const last=g.dirQueue.length>0?g.dirQueue[g.dirQueue.length-1]:g.dir;
      if(last[0]!==0&&next[0]===-last[0])return;
      if(last[1]!==0&&next[1]===-last[1])return;
      if(last[0]===next[0]&&last[1]===next[1])return;
      if(g.dirQueue.length<1)g.dirQueue.push(next); // Solo 1 input en cola para máxima respuesta
    };
    
    // Controles táctiles optimizados para móvil
    let touchStartX = null;
    let touchStartY = null;
    let touchStartTime = null;
    const minSwipeDistance = 15; // Distancia mínima muy corta
    const maxSwipeTime = 300; // Tiempo máximo para considerar un swipe rápido
    
    const onTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    };
    
    const onTouchMove = (e) => {
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
      e.preventDefault();
      touchStartX = null;
      touchStartY = null;
      touchStartTime = null;
    };
    
    const canvas = canvasRef.current;
    window.addEventListener('keydown',onKey);
    if (canvas) {
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    }
    
    return () => {
      window.removeEventListener('keydown',onKey);
      if (canvas) {
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
      }
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
        <div style={{display:'flex',flexDirection:'column',gap:5,overflowY:'auto',maxHeight:H}}>
          {lb.map((entry,i)=>{
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
    background:'rgba(255,255,255,0.5)',
    backdropFilter:'blur(60px) saturate(220%)',
    WebkitBackdropFilter:'blur(60px) saturate(220%)',
    border:'1.5px solid rgba(255,255,255,0.9)',
    borderRadius:28,
    boxShadow:'0 30px 80px rgba(0,0,0,0.12),inset 0 2px 0 rgba(255,255,255,1)',
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(180,200,220,0.25)',backdropFilter:'blur(32px) saturate(180%)',WebkitBackdropFilter:'blur(32px) saturate(180%)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:12,overflowY:'auto'}} onClick={onClose}>
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
              <div style={{position:'relative',borderRadius:18,overflow:'hidden',border:'1.5px solid rgba(255,255,255,0.95)',boxShadow:'inset 0 2px 16px rgba(0,0,0,0.06)'}}>
                <canvas ref={canvasRef} width={W} height={H} style={{display:'block',maxWidth:'100%'}}/>
                {dead&&(
                  <div style={{position:'absolute',inset:0,background:'rgba(255,255,255,0.88)',backdropFilter:'blur(16px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,borderRadius:16}}>
                    <span style={{fontSize:40}}>😵</span>
                    <p style={{color:'#1d1d1f',fontWeight:800,fontSize:20,letterSpacing:'-0.6px',margin:0}}>Game Over</p>
                    <p style={{color:'#6e6e73',fontSize:13,margin:0}}>{score} pts guardados 🏆</p>
                    <button onClick={startGame} style={{background:'#007aff',color:'white',border:'none',borderRadius:22,padding:'10px 28px',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 6px 20px rgba(0,122,255,0.4)',marginTop:4}}>Try Again</button>
                  </div>
                )}
              </div>
              
              {/* Controles de personalización */}
              <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center'}}>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
                  <span style={{fontSize:12,fontWeight:600,color:'#6e6e73'}}>Color:</span>
                  {['#00ff88','#ff4757','#3742fa','#ffa502','#7bed9f','#ff6b6b'].map(color=>(
                    <button key={color} onClick={()=>setSnakeColor(color)}
                      style={{width:24,height:24,borderRadius:12,background:color,border:snakeColor===color?'2px solid #1d1d1f':'1px solid rgba(255,255,255,0.3)',cursor:'pointer'}}/>
                  ))}
                  <button onClick={()=>setShowColorPicker(true)}
                    style={{width:24,height:24,borderRadius:12,background:'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)',border:'1px solid rgba(255,255,255,0.3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'white'}}>+</button>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
                  <span style={{fontSize:12,fontWeight:600,color:'#6e6e73'}}>Comida:</span>
                  {['🍎','🍊','🍌','🍇','🍓','🥕','🍒','🥝'].map(emoji=>(
                    <button key={emoji} onClick={()=>setFoodEmoji(emoji)}
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
                    <input type="color" value={snakeColor} onChange={e=>setSnakeColor(e.target.value)}
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
                        <button key={emoji} onClick={()=>{setFoodEmoji(emoji);setShowEmojiPicker(false);}}
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
export default function Configuracion() {
  const { user, updateUser } = useContext(AuthContext);
  const { settings, updateSetting, toggleDark } = useSettings();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

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
      <Section icon={Palette} title="Apariencia" onTitleClick={handleArkClick}>
        <p className="text-sm font-medium text-gray-700 mb-3">Tema</p>
        <div className="grid grid-cols-2 gap-3">
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
        {arkClicks > 0 && arkClicks < 7 && <p className="text-xs text-gray-300 text-center mt-2">{7-arkClicks} más...</p>}
      </Section>

      {/* Idioma */}
      <Section icon={Globe} title="Idioma" onTitleClick={handleIdiomaClick}>
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
        <p className="text-xs text-gray-400 mt-3">Traducción completa al inglés próximamente.</p>
        {idiomaClicks > 0 && idiomaClicks < 7 && <p className="text-xs text-gray-300 text-center mt-1">{7-idiomaClicks} más...</p>}
        {espanolClicks > 0 && espanolClicks < 7 && <p className="text-xs text-blue-300 text-center mt-1">Memory: {7-espanolClicks} más...</p>}
      </Section>

      {/* Notificaciones */}
      <Section icon={Bell} title="Notificaciones" onTitleClick={handleNotiClick}>
        <div className="divide-y divide-gray-100">
          <ToggleSwitch checked={settings.notifications} onChange={v=>updateSetting('notifications',v)}
            label="Notificaciones del sistema" description="Alertas de sesiones, excusas y actividad"/>
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
      <Section icon={Shield} title="Seguridad" onTitleClick={handleSecClick}>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Tu sesión expira automáticamente después de 8 horas de inactividad.</p>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sesión actual</p>
            <p className="text-sm text-gray-700">{user?.email}</p>
            <p className="text-xs text-gray-400 capitalize cursor-default select-none" onClick={handleInstClick}>
              {user?.userType}
            </p>
          </div>
          {secClicks > 0 && secClicks < 7 && <p className="text-xs text-gray-300 text-center">{7-secClicks} más...</p>}
          {showClear && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-red-600">Opciones avanzadas del sensor</p>
              <button onClick={handleClearFingerprints} className="w-full text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg py-2 transition-colors">
                Borrar base de datos del sensor de huellas
              </button>
              <button onClick={() => setShowClear(false)} className="w-full text-xs text-gray-500 hover:text-gray-700 py-1">
                Cancelar
              </button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
