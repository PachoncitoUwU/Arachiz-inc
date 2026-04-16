// Utilidades compartidas para todos los juegos Easter Egg

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const MEDAL = ['🥇','🥈','🥉'];
export const TOP_COLORS = [
  { text:'#FFD700', glow:'rgba(255,215,0,0.4)',   bg:'rgba(255,215,0,0.12)' },
  { text:'#C0C0C0', glow:'rgba(192,192,192,0.4)', bg:'rgba(192,192,192,0.1)' },
  { text:'#CD7F32', glow:'rgba(205,127,50,0.4)',  bg:'rgba(205,127,50,0.1)' },
];

// Juegos donde menor score = mejor (tiempo de reacción, intentos wordle)
export const LOWER_IS_BETTER = ['reaction', 'wordle'];

const LS = (game) => `arachiz_${game}_lb`;

export const getCachedLB = (game) => {
  try { return JSON.parse(localStorage.getItem(LS(game))) || []; } catch { return []; }
};

export const fetchLB = async (game) => {
  try {
    const res  = await fetch(`${API_URL}/games/${game}/leaderboard`);
    const data = await res.json();
    if (data.scores) {
      localStorage.setItem(LS(game), JSON.stringify(data.scores));
      return data.scores;
    }
  } catch {}
  return getCachedLB(game);
};

export const saveGameScore = async (game, score) => {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/games/${game}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score }),
    });
  } catch {}
};

// Estilos Liquid Glass reutilizables
export const glassLight = {
  background: 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(60px) saturate(220%)',
  WebkitBackdropFilter: 'blur(60px) saturate(220%)',
  border: '1.5px solid rgba(255,255,255,0.85)',
  borderRadius: 28,
  boxShadow: '0 30px 80px rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,1)',
};

export const glassDark = {
  background: 'rgba(20,20,30,0.55)',
  backdropFilter: 'blur(60px) saturate(180%)',
  WebkitBackdropFilter: 'blur(60px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 28,
  boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
};

export const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(180,200,220,0.2)',
  backdropFilter: 'blur(28px) saturate(160%)',
  WebkitBackdropFilter: 'blur(28px) saturate(160%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 12, overflowY: 'auto',
};
