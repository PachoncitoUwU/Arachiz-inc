import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import SerialConnect from '../components/SerialConnect';
import { Moon, Sun, Globe, Bell, User, Shield, Palette, Save, Camera, Loader, Usb } from 'lucide-react';

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

// ─── Breakout (más difícil + leaderboard) ────────────────────────────────────
const LS_BREAKOUT = 'arachiz_breakout_lb_cache';
const getLBBreakout = () => { try { return JSON.parse(localStorage.getItem(LS_BREAKOUT)) || []; } catch { return []; } };
const saveBreakoutScore = async (score, token) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    await fetch(`${API_URL}/snake/score`, { // reutilizamos el mismo endpoint por ahora
      method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({ score, game:'breakout' }),
    });
  } catch {}
};

function BreakoutGame({ onClose, currentUser }) {
  const canvasRef  = useRef(null);
  const [score, setScore]   = useState(0);
  const [dead,  setDead]    = useState(false);
  const [showLB, setShowLB] = useState(false);
  const [lb, setLb]         = useState(getLBBreakout());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const savedRef  = useRef(false);
  const deadRef   = useRef(false); // para reiniciar con espacio
  const restartFn = useRef(null);

  useEffect(()=>{
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
        if(x>padX&&x<padX+padW){
          dy=-Math.abs(dy);
          dx=dx+(x-(padX+padW/2))*0.15; // ángulo según donde golpea
        } else {
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
  },[onClose,dead]);

  useEffect(()=>{
    if(dead&&!savedRef.current&&score>0){
      savedRef.current=true;
      const lb=getLBBreakout();
      const existing=lb.findIndex(e=>e.name===(currentUser?.fullName||'Jugador'));
      const entry={name:currentUser?.fullName||'Jugador',avatar:currentUser?.avatarUrl||null,score,date:new Date().toLocaleDateString('es-CO')};
      if(existing>=0){if(score>lb[existing].score)lb[existing]=entry;}else lb.push(entry);
      lb.sort((a,b)=>b.score-a.score);
      localStorage.setItem(LS_BREAKOUT,JSON.stringify(lb.slice(0,10)));
      setLb(lb.slice(0,10));
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
            <span style={{fontWeight:800,color:'white',fontSize:14,letterSpacing:'-0.3px'}}>🧱 Breakout — {score} pts</span>
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
  const W = COLS*CELL, H = ROWS*CELL;

  // Cargar leaderboard desde el servidor al abrir
  useEffect(()=>{
    fetchLeaderboard().then(data=>setLb(data));
  },[]);

  const randFood=(snake)=>{let f;do{f=[Math.floor(Math.random()*COLS),Math.floor(Math.random()*ROWS)];}while(snake.some(c=>c[0]===f[0]&&c[1]===f[1]));return f;};

  const drawGame=(g,ctx)=>{
    ctx.clearRect(0,0,W,H);
    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'rgba(240,248,255,0.95)');bg.addColorStop(1,'rgba(220,240,230,0.9)');
    ctx.fillStyle=bg;ctx.beginPath();
    ctx.roundRect?ctx.roundRect(0,0,W,H,22):ctx.rect(0,0,W,H);ctx.fill();
    g.snake.forEach(([x,y],i)=>{
      const t=i/Math.max(g.snake.length-1,1);
      const r=Math.round(52+t*30),gr=Math.round(199-t*60),b=Math.round(89-t*20);
      ctx.fillStyle=`rgb(${r},${gr},${b})`;
      ctx.shadowColor=i===0?`rgba(${r},${gr},${b},0.6)`:'transparent';ctx.shadowBlur=i===0?10:0;
      ctx.beginPath();ctx.roundRect?ctx.roundRect(x*CELL+1,y*CELL+1,CELL-2,CELL-2,i===0?10:6):ctx.rect(x*CELL+1,y*CELL+1,CELL-2,CELL-2);ctx.fill();
      if(i===0){ctx.shadowBlur=0;ctx.fillStyle='white';ctx.beginPath();ctx.arc(x*CELL+5,y*CELL+5,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x*CELL+CELL-5,y*CELL+5,2.5,0,Math.PI*2);ctx.fill();}
    });
    ctx.shadowBlur=0;ctx.font=`${CELL-2}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('🍎',g.food[0]*CELL+CELL/2,g.food[1]*CELL+CELL/2);
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
      if(ate){g.score+=10;g.food=randFood(g.snake);g.speed=Math.max(80,g.speed-2);setScore(g.score);}
    }
    drawGame(g,ctx);rafRef.current=requestAnimationFrame(loop);
  };

  const startGame=()=>{
    gRef.current={snake:[[8,6],[7,6],[6,6],[5,6]],food:[12,4],dir:[1,0],nextDir:[1,0],dirQueue:[],score:0,speed:140,lastTick:0,dead:false};
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
      if(g.dirQueue.length<3)g.dirQueue.push(next);
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
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
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                <button style={btn} onClick={()=>tryDir([0,-1])} onMouseDown={e=>e.currentTarget.style.transform='scale(0.93)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>↑</button>
                <div style={{display:'flex',gap:6}}>
                  {[[[-1,0],'←'],[[0,1],'↓'],[[1,0],'→']].map(([d,label],i)=>(
                    <button key={i} style={btn} onClick={()=>tryDir(d)} onMouseDown={e=>e.currentTarget.style.transform='scale(0.93)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <p style={{color:'rgba(0,0,0,0.3)',fontSize:10,margin:0}}>Flechas / WASD · Espacio reinicia · ESC cierra</p>
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
      {showSnake && <SnakeGame onClose={() => setShowSnake(false)} currentUser={user}/>}
      {showArk   && <BreakoutGame onClose={() => setShowArk(false)} currentUser={user}/>}

      <PageHeader title="Configuración" subtitle="Personaliza tu experiencia en Arachiz" />

      {/* Perfil */}
      <Section icon={User} title="Perfil">
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
        <p className="text-xs text-gray-400 mt-3">Traducción completa al inglés próximamente.</p>
      </Section>

      {/* Notificaciones */}
      <Section icon={Bell} title="Notificaciones">
        <div className="divide-y divide-gray-100">
          <ToggleSwitch checked={settings.notifications} onChange={v=>updateSetting('notifications',v)}
            label="Notificaciones del sistema" description="Alertas de sesiones, excusas y actividad"/>
        </div>
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
