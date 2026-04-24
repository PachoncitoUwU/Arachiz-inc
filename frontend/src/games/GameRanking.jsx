import React from 'react';
import { MEDAL, TOP_COLORS, LOWER_IS_BETTER } from './gameUtils';

/**
 * Panel de ranking reutilizable para todos los juegos.
 * Muestra top 10 con medallas, avatares y colores oro/plata/bronce.
 */
export default function GameRanking({ lb = [], game = '', maxHeight = 400, hasFicha = true }) {
  const lowerBetter = LOWER_IS_BETTER.includes(game);

  // Ordenar en el cliente también — por si el backend devuelve orden incorrecto
  const sorted = [...lb].sort((a, b) =>
    lowerBetter ? a.score - b.score : b.score - a.score
  );

  const formatScore = (score) => {
    if (game === 'wordle') return `${score} intentos`;
    return `${score} pts`;
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <span style={{ fontSize:15, fontWeight:800, color:'#1d1d1f', letterSpacing:'-0.4px' }}>
          Ranking
        </span>
        <span style={{ fontSize:15 }}>🏆</span>
        {lowerBetter && (
          <span style={{ fontSize:10, color:'#6e6e73', marginLeft:4 }}>↓ menor = mejor</span>
        )}
      </div>

      {!hasFicha ? (
        <div style={{ textAlign:'center', padding:'20px 0', color:'#6e6e73', fontSize:12 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🏫</div>
          Únete a una ficha para ver el ranking
        </div>
      ) : lb.length === 0 ? (
        <div style={{ textAlign:'center', padding:'20px 0', color:'#6e6e73', fontSize:12 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🎮</div>
          ¡Sé el primero en el ranking!
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:5, overflowY: sorted.length > 10 ? 'auto' : 'visible', maxHeight: sorted.length > 10 ? maxHeight : 'none' }}>
          {sorted.map((entry, i) => {
            const isTop = i < 3;
            const col   = isTop ? TOP_COLORS[i] : null;
            return (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'8px 10px', borderRadius:14,
                background: isTop ? col.bg : 'rgba(255,255,255,0.35)',
                border: isTop ? `1px solid ${col.glow}` : '1px solid rgba(255,255,255,0.5)',
                boxShadow: isTop ? `0 3px 12px ${col.glow}` : 'none',
              }}>
                <span style={{
                  fontSize: isTop ? 16 : 12, fontWeight:700,
                  minWidth:22, textAlign:'center',
                  color: isTop ? col.text : '#6e6e73',
                }}>
                  {isTop ? MEDAL[i] : i + 1}
                </span>

                {entry.avatar
                  ? <img src={entry.avatar} style={{ width:28, height:28, borderRadius:8, objectFit:'cover', flexShrink:0, border: isTop ? `1.5px solid ${col.text}` : '1.5px solid rgba(255,255,255,0.7)' }} alt=""/>
                  : <div style={{ width:28, height:28, borderRadius:8, background: isTop ? col.text : '#007aff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>
                      {entry.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() || '?'}
                    </div>
                }

                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:11, color: isTop ? col.text : '#1d1d1f', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {entry.name}
                  </p>
                  <p style={{ margin:0, fontSize:9, color:'#6e6e73' }}>{entry.date}</p>
                </div>

                <span style={{ fontWeight:800, fontSize: isTop ? 14 : 12, color: isTop ? col.text : '#1d1d1f', whiteSpace:'nowrap' }}>
                  {formatScore(entry.score)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
