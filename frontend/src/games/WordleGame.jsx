import React, { useState, useEffect, useCallback } from 'react';
import { overlayStyle, glassLight } from './gameUtils';

const WORD_LISTS = {
  4: [
    'CASA','MESA','GATO','AGUA','AMOR','VIDA','HORA','IDEA','LADO','NOTA',
    'OBRA','PASO','PESO','PLAN','RAMA','SALA','TEMA','TIPO','ZONA','ARTE',
    'BIEN','DATO','EDAD','FASE','AZUL','BESO','CAFE','DEDO','FRIO','GRIS',
    'HILO','ISLA','JOYA','KILO','LUNA','MANO','NUBE','OJOS','PIEL','ROJO',
    'SOLO','TREN','UVAS','VINO','ALTO','BAJO','CERO','DURO','FIJO','LOCO',
    'RICO','SECO','FINO','RARO','LISO','PURO','VIVO','APTO','CARO','VAGO',
  ],
  5: [
    'FICHA','SABER','MUNDO','LUGAR','FORMA','PARTE','GRUPO','PUNTO','ORDEN',
    'CAMPO','MEDIO','NIVEL','VALOR','CLASE','CURSO','GRADO','MARCO','PAPEL',
    'PLANO','RADIO','RANGO','RITMO','SALUD','SIGNO','TAREA','TEXTO','VISTA','VUELO',
    'ABRIL','ACTOR','ALBUM','ANGEL','ARENA','AUDIO','BAILE','BANCO','BARCO',
    'BARRO','BELLO','BORDE','BRAZO','BREVE','BUENO','CABLE','CARNE','CARTA',
    'CERRO','CHICO','CIELO','CINCO','CLIMA','COLOR','CUERO','DANZA','DEBER',
    'DECIR','DOLOR','DULCE','ENERO','ERROR','ESTAR','FALTA','FECHA','FELIZ',
    'FINAL','FONDO','FRUTA','FUEGO','GENTE','GOLPE','GRANO','GRAVE','GUSTO',
    'HACER','HECHO','HIELO','HONOR','HOTEL','HUESO','HUMOR','IGUAL','JUNTO',
    'LARGO','LECHE','LETRA','LIBRO','LINEA','LLAMA','LLENO','MADRE','MAYOR',
    'MENOR','METAL','METRO','MIEDO','MOVER','MUCHO','NACER','NEGRO','NOCHE',
    'NORTE','NUEVO','PADRE','PASAR','PECHO','PERRO','PIANO','PIEZA','PLATA',
    'PLAZA','PODER','QUESO','REINO','RESTO','ROBOT','SALIR','SANTO','SERIO',
    'SIGLO','SOBRE','SOLAR','SUELO','TABLA','TANTO','TARDE','TECHO','TOTAL',
    'TRAJE','TRATO','TURNO','VERDE','VIAJE','VISTA','VIVIR','VUELO','ZORRO',
    'BRAVO','CLARO','CORTO','FIRME','FLACO','GORDO','JUSTO','LENTO','LIBRE',
    'NOBLE','POBRE','SABIO','SUCIO','DENSO','LLENO',
  ],
  6: [
    'FICHAR','SABADO','CIUDAD','TIEMPO','CAMINO','DINERO','FUTURO','IMAGEN',
    'LENGUA','MANERA','NUMERO','OBJETO','PRECIO','PUEBLO','REGION','SANGRE',
    'SEMANA','TIERRA','VERDAD','BLANCO','BONITO','BRILLO','CAMBIO','CIERTO',
    'COMIDA','CUENTA','DENTRO','ESCENA','ESPEJO','ESTADO','FUERZA','GRANDE',
    'HUMANO','INICIO','JOVEN','LIGERO','LIMPIO','LLUVIA','MADERA','MEDIDA',
    'MODELO','MOTIVO','MUSICA','NACION','NORMAL','OSCURO','PASADO','PIEDRA',
    'PLANTA','RAPIDO','RECIBO','REGALO','RIESGO','RITUAL','SEGURO','SIMPLE',
    'SOCIAL','SONIDO','SUERTE','TEATRO','TESORO','TITULO','ULTIMO','UNIDAD',
    'URBANO','VALIDO','VECINO','VERANO','VIDRIO','VISION','VISITA','VOLCAN',
    'AGENTE','ALEGRE','AMABLE','BONITA','CANTAR','CRECER','DORMIR',
  ],
};

const getRandomWord = (length) => {
  const words = WORD_LISTS[length] || WORD_LISTS[5];
  return words[Math.floor(Math.random() * words.length)];
};

const MAX_ATTEMPTS = 6;

const KEYBOARD = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L','Ñ'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

const evaluate = (guess, word) => {
  const result = Array(word.length).fill(null).map((_, i) => ({ letter: guess[i], state: 'absent' }));
  const wordArr = word.split('');
  const guessArr = guess.split('');
  const wordUsed = Array(word.length).fill(false);
  for (let i = 0; i < word.length; i++) {
    if (guessArr[i] === wordArr[i]) { result[i].state = 'correct'; wordUsed[i] = true; }
  }
  for (let i = 0; i < word.length; i++) {
    if (result[i].state === 'correct') continue;
    for (let j = 0; j < word.length; j++) {
      if (!wordUsed[j] && guessArr[i] === wordArr[j]) { result[i].state = 'present'; wordUsed[j] = true; break; }
    }
  }
  return result;
};

const STATE_COLORS = {
  correct: { bg:'#34A853', text:'white' },
  present: { bg:'#FBBC05', text:'white' },
  absent:  { bg:'#374151', text:'white' },
  empty:   { bg:'rgba(255,255,255,0.18)', text:'#1d1d1f' },
  active:  { bg:'rgba(255,255,255,0.45)', text:'#1d1d1f' },
};

const DAILY_KEY = 'arachiz_wordle_daily_v2';
const getTodayStr = () => new Date().toISOString().slice(0, 10);
const getDailyRecord = () => { try { return JSON.parse(localStorage.getItem(DAILY_KEY)) || {}; } catch { return {}; } };
const markPlayed = (length) => {
  const rec = getDailyRecord();
  const today = getTodayStr();
  if (!rec[today]) rec[today] = {};
  rec[today][length] = true;
  Object.keys(rec).forEach(d => { if (d !== today) delete rec[d]; });
  localStorage.setItem(DAILY_KEY, JSON.stringify(rec));
};
const hasPlayedToday = (length) => !!(getDailyRecord()[getTodayStr()]?.[length]);

export default function WordleGame({ onClose }) {
  const [wordLength, setWordLength] = useState(5);
  const [WORD, setWORD] = useState(() => getRandomWord(5));
  const [guesses,  setGuesses]  = useState([]);
  const [current,  setCurrent]  = useState('');
  const [phase,    setPhase]    = useState(() => hasPlayedToday(5) ? 'done' : 'playing');
  const [shake,    setShake]    = useState(false);
  const savedRef = React.useRef(false);

  // Tamaño de celda adaptativo según longitud
  const cellSize = wordLength === 6 ? 48 : wordLength === 4 ? 58 : 52;
  const keyW     = wordLength === 6 ? 28 : 32;

  const submit = useCallback(() => {
    if (phase !== 'playing') return;
    if (current.length !== WORD.length) { 
      setShake(true); 
      setTimeout(() => setShake(false), 500); 
      return; 
    }
    
    // Validar que la palabra existe en el diccionario
    const validWords = WORD_LISTS[wordLength] || WORD_LISTS[5];
    if (!validWords.includes(current)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      // Mostrar mensaje de error temporal
      const errorMsg = document.createElement('div');
      errorMsg.textContent = '❌ Palabra no válida';
      errorMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(234,67,53,0.95);color:white;padding:12px 24px;borderRadius:12px;fontSize:14px;fontWeight:700;zIndex:9999;boxShadow:0 4px 20px rgba(0,0,0,0.3);';
      document.body.appendChild(errorMsg);
      setTimeout(() => errorMsg.remove(), 1500);
      return;
    }
    
    const result = evaluate(current, WORD);
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);
    setCurrent('');
    if (current === WORD) {
      if (!savedRef.current) { savedRef.current = true; markPlayed(wordLength); }
      setPhase('won'); return;
    }
    if (newGuesses.length >= MAX_ATTEMPTS) {
      if (!savedRef.current) { savedRef.current = true; markPlayed(wordLength); }
      setPhase('lost');
    }
  }, [current, guesses, WORD, phase, wordLength]);

  const pressKey = useCallback((key) => {
    if (phase !== 'playing') return;
    if (key === '⌫' || key === 'Backspace') { setCurrent(p => p.slice(0, -1)); return; }
    if (key === 'ENTER' || key === 'Enter') { submit(); return; }
    if (/^[A-ZÑ]$/.test(key) && current.length < WORD.length) setCurrent(p => p + key);
  }, [phase, current, submit, WORD.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (phase === 'playing') pressKey(e.key === 'Backspace' ? '⌫' : e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pressKey, onClose, phase]);

  const letterStates = {};
  guesses.flat().forEach(({ letter, state }) => {
    if (!letterStates[letter] || state === 'correct') letterStates[letter] = state;
  });

  const switchLength = (length) => {
    setWordLength(length);
    setWORD(getRandomWord(length));
    savedRef.current = false;
    setGuesses([]);
    setCurrent('');
    setPhase(hasPlayedToday(length) ? 'done' : 'playing');
  };

  const alreadyPlayed = phase === 'done';

  return (
    <div style={{ ...overlayStyle }} onClick={e => e.stopPropagation()}>
      <div style={{
        ...glassLight,
        padding:'16px 16px 12px',
        display:'flex', flexDirection:'column', alignItems:'center', gap:10,
        maxWidth:'98vw', width: 'fit-content',
      }}>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', minWidth: wordLength * cellSize + (wordLength-1)*6 }}>
          <span style={{ fontSize:20, fontWeight:800, color:'#1d1d1f', letterSpacing:'-0.5px' }}>📝 Wordle</span>
          <button onClick={onClose}
            style={{ background:'rgba(0,0,0,0.07)', border:'none', borderRadius:14, color:'#1d1d1f', padding:'6px 14px', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            Done
          </button>
        </div>

        {/* Selector de longitud */}
        <div style={{ display:'flex', gap:8 }}>
          {[4, 5, 6].map(length => {
            const played = hasPlayedToday(length);
            return (
              <button key={length} onClick={() => switchLength(length)}
                style={{
                  background: wordLength === length ? '#007aff' : played ? 'rgba(52,168,83,0.2)' : 'rgba(255,255,255,0.35)',
                  color: wordLength === length ? 'white' : played ? '#34A853' : '#1d1d1f',
                  border: played && wordLength !== length ? '1.5px solid #34A853' : 'none',
                  borderRadius:10, padding:'7px 18px', fontSize:13, fontWeight:700, cursor:'pointer',
                  transition:'all 0.15s',
                }}>
                {length} letras {played ? '✓' : ''}
              </button>
            );
          })}
        </div>

        {/* Aviso ya jugó */}
        {alreadyPlayed && (
          <div style={{ background:'rgba(52,168,83,0.12)', border:'1.5px solid #34A853', borderRadius:14, padding:'10px 20px', textAlign:'center' }}>
            <p style={{ margin:0, fontWeight:700, color:'#34A853', fontSize:14 }}>✅ Ya jugaste {wordLength} letras hoy</p>
            <p style={{ margin:'4px 0 0', color:'#6e6e73', fontSize:12 }}>Vuelve mañana · Prueba otra longitud</p>
          </div>
        )}

        {/* Grid */}
        <div style={{ display:'flex', flexDirection:'column', gap:5, opacity: alreadyPlayed ? 0.5 : 1 }}>
          {Array.from({ length: MAX_ATTEMPTS }).map((_, row) => {
            const guess = guesses[row];
            const isActive = row === guesses.length && phase === 'playing';
            const letters = isActive
              ? current.padEnd(WORD.length, ' ').split('')
              : (guess ? guess.map(g => g.letter) : Array(WORD.length).fill(' '));
            const states = guess
              ? guess.map(g => g.state)
              : Array(WORD.length).fill(isActive ? 'active' : 'empty');
            return (
              <div key={row} style={{ display:'flex', gap:5, animation: isActive && shake ? 'shake 0.4s ease' : 'none' }}>
                {letters.map((l, col) => {
                  const s = STATE_COLORS[states[col]] || STATE_COLORS.empty;
                  return (
                    <div key={col} style={{
                      width: cellSize, height: cellSize, borderRadius:10,
                      background: s.bg, color: s.text,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize: cellSize * 0.38, fontWeight:800,
                      border: states[col] === 'empty' || states[col] === 'active' ? '2px solid rgba(255,255,255,0.5)' : 'none',
                      transition:'background 0.2s',
                      boxShadow: states[col] === 'correct' ? '0 4px 12px rgba(52,168,83,0.4)' : states[col] === 'present' ? '0 4px 12px rgba(251,188,5,0.4)' : 'none',
                    }}>
                      {l.trim()}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Resultado */}
        {(phase === 'won' || phase === 'lost') && (
          <div style={{ textAlign:'center' }}>
            {phase === 'won'
              ? <p style={{ color:'#34A853', fontWeight:800, fontSize:16, margin:'2px 0' }}>🎉 ¡Correcto en {guesses.length} intentos!</p>
              : <p style={{ color:'#EA4335', fontWeight:800, fontSize:16, margin:'2px 0' }}>La palabra era: <strong>{WORD}</strong></p>
            }
            <p style={{ color:'#6e6e73', fontSize:12, margin:'4px 0 0' }}>Vuelve mañana para jugar de nuevo</p>
          </div>
        )}

        {/* Teclado */}
        {!alreadyPlayed && (
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {KEYBOARD.map((row, ri) => (
              <div key={ri} style={{ display:'flex', gap:4, justifyContent:'center' }}>
                {row.map(key => {
                  const st = letterStates[key];
                  const col = st ? STATE_COLORS[st] : { bg:'rgba(255,255,255,0.6)', text:'#1d1d1f' };
                  const isWide = key === 'ENTER' || key === '⌫';
                  const isDisabled = phase !== 'playing';
                  return (
                    <button key={key} onClick={() => pressKey(key)} disabled={isDisabled}
                      style={{
                        width: isWide ? keyW * 1.7 : keyW,
                        height: 38, borderRadius:8, border:'none',
                        background: col.bg, color: col.text,
                        fontSize: isWide ? 10 : 13, fontWeight:700,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.5 : 1,
                        backdropFilter:'blur(8px)', transition:'background 0.2s',
                        boxShadow:'0 2px 4px rgba(0,0,0,0.08)',
                      }}>
                      {key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
