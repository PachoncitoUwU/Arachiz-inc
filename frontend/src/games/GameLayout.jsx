import React, { useState, useEffect } from 'react';
import GameRanking from './GameRanking';
import { glassLight, overlayStyle } from './gameUtils';

/**
 * Layout unificado para todos los juegos Easter Egg.
 * Desktop: ranking izquierda + juego derecha.
 * Móvil: juego full + botón 🏆 que abre ranking en modal.
 */
export default function GameLayout({
  title,        // "🥜 El Maní"
  score,        // número actual
  lb,           // array del leaderboard
  game,         // key del juego para formatear score
  onClose,      // función para cerrar
  children,     // área del juego
  onOverlayClick, // click en el fondo (para saltar en flappy)
  hasFicha,     // bool — si el usuario pertenece a una ficha
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [showLB,   setShowLB]   = useState(false);

  useEffect(() => {
    const f = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  const formatScore = (s) => {
    if (game === 'wordle') return `${s} int.`;
    return `${s} pts`;
  };

  return (
    <div style={{ ...overlayStyle }} onClick={onOverlayClick}>
      <div
        style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:12, alignItems:'flex-start', maxWidth:'98vw' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Ranking — solo desktop, siempre visible */}
        {!isMobile && (
          <div style={{ ...glassLight, padding:'18px 14px', minWidth:200 }}>
          <GameRanking lb={lb} game={game} maxHeight={window.innerHeight > 800 ? 550 : window.innerHeight > 700 ? 460 : 380} hasFicha={hasFicha} />
          </div>
        )}

        {/* Panel del juego */}
        <div style={{ ...glassLight, padding:'14px 14px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:10, minWidth:320 }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <span style={{ fontSize:16, fontWeight:800, color:'#1d1d1f', letterSpacing:'-0.5px' }}>{title}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#007aff', background:'rgba(0,122,255,0.1)', padding:'2px 8px', borderRadius:20 }}>
                {formatScore(score)}
              </span>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {/* Botón Top solo en móvil */}
              {isMobile && (
                <button
                  onClick={e => { e.stopPropagation(); setShowLB(v => !v); }}
                  style={{ background:'rgba(0,0,0,0.07)', border:'none', borderRadius:14, color:'#1d1d1f', padding:'5px 10px', cursor:'pointer', fontSize:11, fontWeight:600 }}
                >
                  🏆 Top
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); onClose(); }}
                style={{ background:'rgba(0,0,0,0.07)', border:'none', borderRadius:14, color:'#1d1d1f', padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:600 }}
              >
                Done
              </button>
            </div>
          </div>

          {/* Ranking móvil (toggle) */}
          {isMobile && showLB ? (
            <div style={{ width:300, maxHeight:260, overflowY:'auto' }}>
              <GameRanking lb={lb} game={game} maxHeight={240} hasFicha={hasFicha} />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
