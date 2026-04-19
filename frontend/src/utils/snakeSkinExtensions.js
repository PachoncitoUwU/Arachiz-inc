// ============================================
// SNAKE SKIN EXTENSIONS - Ejemplos y Extensiones
// ============================================

/**
 * EJEMPLOS DE EXTENSIONES FUTURAS
 * Estos son ejemplos de cómo extender el sistema de skins
 */

// ============================================
// 1. ANIMACIONES DE OJOS
// ============================================

/**
 * Anima el parpadeo de los ojos
 * @param {number} frameCount - Contador de frames
 * @returns {number} Opacidad (0-1)
 */
export function getBlinkOpacity(frameCount) {
  const blinkCycle = 60; // Parpadea cada 60 frames
  const blinkDuration = 10; // Dura 10 frames
  const cyclePosition = frameCount % blinkCycle;
  
  if (cyclePosition < blinkDuration) {
    // Parpadeo: cierra y abre
    const halfway = blinkDuration / 2;
    if (cyclePosition < halfway) {
      return 1 - (cyclePosition / halfway); // Cierra
    } else {
      return (cyclePosition - halfway) / halfway; // Abre
    }
  }
  return 1; // Ojos abiertos
}

/**
 * Dibuja ojos con animación de parpadeo
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} e1x - Posición X ojo izquierdo
 * @param {number} e1y - Posición Y ojo izquierdo
 * @param {number} e2x - Posición X ojo derecho
 * @param {number} e2y - Posición Y ojo derecho
 * @param {string} eyeStyle - Estilo de ojo
 * @param {number} frameCount - Contador de frames
 */
export function drawAnimatedEyes(ctx, e1x, e1y, e2x, e2y, eyeStyle, frameCount) {
  const blinkOpacity = getBlinkOpacity(frameCount);
  
  // Guardar opacidad actual
  const originalAlpha = ctx.globalAlpha;
  
  // Aplicar opacidad de parpadeo
  ctx.globalAlpha = blinkOpacity;
  
  // Dibujar ojos normalmente
  // drawPremiumEyes(ctx, e1x, e1y, e2x, e2y, eyeStyle);
  
  // Restaurar opacidad
  ctx.globalAlpha = originalAlpha;
}

// ============================================
// 2. EFECTOS DE PARTÍCULAS
// ============================================

/**
 * Genera partículas alrededor de un segmento
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {string} color - Color de la partícula
 * @param {number} count - Cantidad de partículas
 * @returns {Array} Array de partículas
 */
export function generateParticles(x, y, color, count = 5) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = 2 + Math.random() * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 1,
      decay: 0.02,
    });
  }
  return particles;
}

/**
 * Actualiza y dibuja partículas
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} particles - Array de partículas
 */
export function updateAndDrawParticles(ctx, particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    
    // Actualizar posición
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    
    // Dibujar
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Remover si está muerta
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
  ctx.globalAlpha = 1;
}

// ============================================
// 3. EFECTOS DE EXPRESIÓN
// ============================================

/**
 * Dibuja cejas expresivas
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} e1x - Posición X ojo izquierdo
 * @param {number} e1y - Posición Y ojo izquierdo
 * @param {number} e2x - Posición X ojo derecho
 * @param {number} e2y - Posición Y ojo derecho
 * @param {string} expression - Expresión: 'happy', 'sad', 'angry', 'neutral'
 */
export function drawEyebrows(ctx, e1x, e1y, e2x, e2y, expression) {
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  
  if (expression === 'happy') {
    // Cejas levantadas
    ctx.beginPath();
    ctx.arc(e1x, e1y - 5, 3, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(e2x, e2y - 5, 3, Math.PI, 0);
    ctx.stroke();
  } else if (expression === 'sad') {
    // Cejas bajadas
    ctx.beginPath();
    ctx.arc(e1x, e1y - 5, 3, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(e2x, e2y - 5, 3, 0, Math.PI);
    ctx.stroke();
  } else if (expression === 'angry') {
    // Cejas fruncidas
    ctx.beginPath();
    ctx.moveTo(e1x - 3, e1y - 6);
    ctx.lineTo(e1x + 3, e1y - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e2x - 3, e2y - 4);
    ctx.lineTo(e2x + 3, e2y - 6);
    ctx.stroke();
  }
}

// ============================================
// 4. EFECTOS DE MOVIMIENTO
// ============================================

/**
 * Calcula la posición de los ojos según la dirección
 * @param {number} cx - Centro X de la cabeza
 * @param {number} cy - Centro Y de la cabeza
 * @param {number} dx - Dirección X
 * @param {number} dy - Dirección Y
 * @returns {Object} Posiciones de los ojos
 */
export function getEyePositions(cx, cy, dx, dy) {
  const o = 4; // Offset lateral
  const f = 1; // Offset adelante
  let e1x, e1y, e2x, e2y;
  
  if (dx === 1) {
    // Derecha
    e1x = cx + f;
    e1y = cy - o;
    e2x = cx + f;
    e2y = cy + o;
  } else if (dx === -1) {
    // Izquierda
    e1x = cx - f;
    e1y = cy - o;
    e2x = cx - f;
    e2y = cy + o;
  } else if (dy === 1) {
    // Abajo
    e1x = cx - o;
    e1y = cy + f;
    e2x = cx + o;
    e2y = cy + f;
  } else {
    // Arriba
    e1x = cx - o;
    e1y = cy - f;
    e2x = cx + o;
    e2y = cy - f;
  }
  
  return { e1x, e1y, e2x, e2y };
}

// ============================================
// 5. EFECTOS DE DAÑO/ESTADO
// ============================================

/**
 * Dibuja ojos dañados/asustados
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} e1x - Posición X ojo izquierdo
 * @param {number} e1y - Posición Y ojo izquierdo
 * @param {number} e2x - Posición X ojo derecho
 * @param {number} e2y - Posición Y ojo derecho
 */
export function drawScaredEyes(ctx, e1x, e1y, e2x, e2y) {
  // Esclerótica
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(e1x, e1y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x, e2y, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupila pequeña (asustada)
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(e1x, e1y, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x, e2y, 1, 0, Math.PI * 2);
  ctx.fill();
  
  // Líneas de susto
  ctx.strokeStyle = 'rgba(255,0,0,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(e1x + 5 + i * 2, e1y - 5);
    ctx.lineTo(e1x + 5 + i * 2, e1y - 8);
    ctx.stroke();
  }
}

/**
 * Dibuja ojos muertos (X)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} e1x - Posición X ojo izquierdo
 * @param {number} e1y - Posición Y ojo izquierdo
 * @param {number} e2x - Posición X ojo derecho
 * @param {number} e2y - Posición Y ojo derecho
 */
export function drawDeadEyes(ctx, e1x, e1y, e2x, e2y) {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  
  // Ojo izquierdo
  ctx.beginPath();
  ctx.moveTo(e1x - 2, e1y - 2);
  ctx.lineTo(e1x + 2, e1y + 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e1x + 2, e1y - 2);
  ctx.lineTo(e1x - 2, e1y + 2);
  ctx.stroke();
  
  // Ojo derecho
  ctx.beginPath();
  ctx.moveTo(e2x - 2, e2y - 2);
  ctx.lineTo(e2x + 2, e2y + 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e2x + 2, e2y - 2);
  ctx.lineTo(e2x - 2, e2y + 2);
  ctx.stroke();
}

// ============================================
// 6. EFECTOS DE PODER
// ============================================

/**
 * Dibuja aura de poder alrededor de los ojos
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} e1x - Posición X ojo izquierdo
 * @param {number} e1y - Posición Y ojo izquierdo
 * @param {number} e2x - Posición X ojo derecho
 * @param {number} e2y - Posición Y ojo derecho
 * @param {string} color - Color del aura
 * @param {number} intensity - Intensidad (0-1)
 */
export function drawPowerAura(ctx, e1x, e1y, e2x, e2y, color, intensity) {
  ctx.shadowColor = color;
  ctx.shadowBlur = 20 * intensity;
  
  // Aura izquierda
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5 * intensity;
  ctx.beginPath();
  ctx.arc(e1x, e1y, 6, 0, Math.PI * 2);
  ctx.stroke();
  
  // Aura derecha
  ctx.beginPath();
  ctx.arc(e2x, e2y, 6, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// ============================================
// 7. UTILIDADES
// ============================================

/**
 * Interpola entre dos colores
 * @param {string} color1 - Color inicial (hex)
 * @param {string} color2 - Color final (hex)
 * @param {number} t - Interpolación (0-1)
 * @returns {string} Color interpolado
 */
export function interpolateColor(color1, color2, t) {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  
  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;
  
  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

/**
 * Genera un color aleatorio
 * @returns {string} Color en formato hex
 */
export function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Convierte RGB a Hex
 * @param {number} r - Rojo (0-255)
 * @param {number} g - Verde (0-255)
 * @param {number} b - Azul (0-255)
 * @returns {string} Color en formato hex
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Convierte Hex a RGB
 * @param {string} hex - Color en formato hex
 * @returns {Object} Objeto con r, g, b
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

// ============================================
// EJEMPLOS DE USO
// ============================================

/*
// Ejemplo 1: Usar ojos animados con parpadeo
function drawGameWithAnimatedEyes(g, ctx, frameCount) {
  // ... código del juego ...
  
  // Dibujar ojos con parpadeo
  drawAnimatedEyes(ctx, e1x, e1y, e2x, e2y, eyeStyle, frameCount);
}

// Ejemplo 2: Agregar partículas cuando come
function onSnakeEat(x, y, color) {
  const particles = generateParticles(x, y, color, 10);
  // Guardar en estado del juego
  gameState.particles = particles;
}

// Ejemplo 3: Dibujar partículas cada frame
function drawGame(g, ctx) {
  // ... código del juego ...
  
  // Dibujar partículas
  updateAndDrawParticles(ctx, gameState.particles);
}

// Ejemplo 4: Cambiar expresión según el estado
function updateExpression(gameState) {
  if (gameState.dead) {
    return 'dead';
  } else if (gameState.scared) {
    return 'scared';
  } else if (gameState.powered) {
    return 'powered';
  }
  return 'normal';
}

// Ejemplo 5: Usar aura de poder
function drawPoweredSnake(ctx, e1x, e1y, e2x, e2y) {
  drawPowerAura(ctx, e1x, e1y, e2x, e2y, '#ffff00', 0.8);
  drawPremiumEyes(ctx, e1x, e1y, e2x, e2y, 'laser');
}
*/
