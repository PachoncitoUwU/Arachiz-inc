// ============================================
// SNAKE SKIN RENDERER - Optimizado y Premium
// ============================================

/**
 * Dibuja ojos premium con brillo especular
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} e1x - Posición X ojo izquierdo
 * @param {number} e1y - Posición Y ojo izquierdo
 * @param {number} e2x - Posición X ojo derecho
 * @param {number} e2y - Posición Y ojo derecho
 * @param {string} eyeStyle - Estilo: 'normal', 'cute', 'laser', 'angry'
 */
export function drawPremiumEyes(ctx, e1x, e1y, e2x, e2y, eyeStyle) {
  if (eyeStyle === 'cute') {
    drawCuteEyes(ctx, e1x, e1y, e2x, e2y);
  } else if (eyeStyle === 'laser') {
    drawLaserEyes(ctx, e1x, e1y, e2x, e2y);
  } else if (eyeStyle === 'angry') {
    drawAngryEyes(ctx, e1x, e1y, e2x, e2y);
  } else {
    drawNormalEyes(ctx, e1x, e1y, e2x, e2y);
  }
}

function drawCuteEyes(ctx, e1x, e1y, e2x, e2y) {
  // Sombra sutil para profundidad
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  
  // Esclerótica (blanco del ojo)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(e1x, e1y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x, e2y, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Borde fino
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(e1x, e1y, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(e2x, e2y, 4, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  
  // Pupila con gradiente
  const grad1 = ctx.createRadialGradient(e1x - 0.5, e1y - 0.5, 0, e1x, e1y, 2.2);
  grad1.addColorStop(0, '#1a1a1a');
  grad1.addColorStop(1, '#000000');
  ctx.fillStyle = grad1;
  ctx.beginPath();
  ctx.arc(e1x, e1y, 2.2, 0, Math.PI * 2);
  ctx.fill();
  
  const grad2 = ctx.createRadialGradient(e2x - 0.5, e2y - 0.5, 0, e2x, e2y, 2.2);
  grad2.addColorStop(0, '#1a1a1a');
  grad2.addColorStop(1, '#000000');
  ctx.fillStyle = grad2;
  ctx.beginPath();
  ctx.arc(e2x, e2y, 2.2, 0, Math.PI * 2);
  ctx.fill();
  
  // ⭐ BRILLO ESPECULAR - El toque premium
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(e1x + 1.2, e1y - 1.2, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x + 1.2, e2y - 1.2, 1, 0, Math.PI * 2);
  ctx.fill();
  
  // Brillo secundario
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(e1x - 0.8, e1y + 0.8, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x - 0.8, e2y + 0.8, 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawLaserEyes(ctx, e1x, e1y, e2x, e2y) {
  // Glow exterior
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 15;
  
  // Gradiente radial
  const gradLaser1 = ctx.createRadialGradient(e1x, e1y, 0, e1x, e1y, 4);
  gradLaser1.addColorStop(0, '#ff6666');
  gradLaser1.addColorStop(0.5, '#ff0000');
  gradLaser1.addColorStop(1, '#cc0000');
  ctx.fillStyle = gradLaser1;
  ctx.beginPath();
  ctx.arc(e1x, e1y, 4, 0, Math.PI * 2);
  ctx.fill();
  
  const gradLaser2 = ctx.createRadialGradient(e2x, e2y, 0, e2x, e2y, 4);
  gradLaser2.addColorStop(0, '#ff6666');
  gradLaser2.addColorStop(0.5, '#ff0000');
  gradLaser2.addColorStop(1, '#cc0000');
  ctx.fillStyle = gradLaser2;
  ctx.beginPath();
  ctx.arc(e2x, e2y, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Centro brillante
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(e1x, e1y, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x, e2y, 1.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

function drawAngryEyes(ctx, e1x, e1y, e2x, e2y) {
  // Esclerótica
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(e1x, e1y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x, e2y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupila roja
  ctx.fillStyle = '#cc0000';
  ctx.beginPath();
  ctx.arc(e1x, e1y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x, e2y, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Brillo
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(e1x + 0.8, e1y - 0.8, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x + 0.8, e2y - 0.8, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawNormalEyes(ctx, e1x, e1y, e2x, e2y) {
  // Esclerótica con sombra
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(e1x, e1y, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x, e2y, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Pupila con gradiente
  const gradNorm1 = ctx.createRadialGradient(e1x, e1y, 0, e1x, e1y, 1.8);
  gradNorm1.addColorStop(0, '#2a2a2a');
  gradNorm1.addColorStop(1, '#000000');
  ctx.fillStyle = gradNorm1;
  ctx.beginPath();
  ctx.arc(e1x, e1y, 1.8, 0, Math.PI * 2);
  ctx.fill();
  
  const gradNorm2 = ctx.createRadialGradient(e2x, e2y, 0, e2x, e2y, 1.8);
  gradNorm2.addColorStop(0, '#2a2a2a');
  gradNorm2.addColorStop(1, '#000000');
  ctx.fillStyle = gradNorm2;
  ctx.beginPath();
  ctx.arc(e2x, e2y, 1.8, 0, Math.PI * 2);
  ctx.fill();
  
  // Brillo especular
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(e1x + 0.8, e1y - 0.8, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e2x + 0.8, e2y - 0.8, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Obtiene el color del arcoíris para un índice de segmento
 * @param {number} index - Índice del segmento
 * @param {number} totalSegments - Total de segmentos
 * @returns {string} Color en formato hex
 */
export function getRainbowColor(index, totalSegments) {
  const rainbowColors = [
    '#ff0080', // Rosa
    '#ff4060', // Rosa-Naranja
    '#ff8040', // Naranja
    '#ffc020', // Amarillo-Naranja
    '#ffff00', // Amarillo
    '#80ff40', // Amarillo-Verde
    '#00ff80', // Verde
    '#00ffff', // Cian
    '#0080ff', // Azul
    '#4060ff', // Azul-Púrpura
    '#8040ff', // Púrpura
    '#ff00ff', // Magenta
  ];
  
  const colorIndex = Math.floor((index / totalSegments) * rainbowColors.length) % rainbowColors.length;
  return rainbowColors[colorIndex];
}

/**
 * Dibuja un segmento del cuerpo con efecto 3D
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {string} color - Color del segmento
 * @param {number} radius - Radio del segmento
 * @param {boolean} isPremium - Si es skin premium
 */
export function drawSegment3D(ctx, x, y, color, radius, isPremium = false) {
  if (!isPremium) {
    // Segmento normal
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  
  // Segmento premium con efecto 3D
  
  // Sombra oscura en los bordes (Ambient Occlusion)
  const shadowGrad = ctx.createRadialGradient(x, y, radius * 0.6, x, y, radius);
  shadowGrad.addColorStop(0, color);
  shadowGrad.addColorStop(0.7, color);
  shadowGrad.addColorStop(1, adjustBrightness(color, -0.3));
  
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Brillo en la parte superior (luz)
  const highlightGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
  highlightGrad.addColorStop(0, adjustBrightness(color, 0.4));
  highlightGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
  
  ctx.fillStyle = highlightGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Ajusta el brillo de un color hex
 * @param {string} color - Color en formato hex
 * @param {number} percent - Porcentaje de ajuste (-1 a 1)
 * @returns {string} Color ajustado
 */
function adjustBrightness(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Aplica glow neon dinámico
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} color - Color del glow
 * @param {number} intensity - Intensidad del glow (0-1)
 */
export function applyNeonGlow(ctx, color, intensity = 0.8) {
  ctx.shadowColor = color;
  ctx.shadowBlur = 12 * intensity;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Limpia el glow
 * @param {CanvasRenderingContext2D} ctx
 */
export function clearGlow(ctx) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}
