# Script PowerShell para resolver conflictos de package.json

Write-Host "🔧 Resolviendo conflictos de package.json..." -ForegroundColor Cyan

# Verificar rama actual
$currentBranch = git branch --show-current
Write-Host "📍 Rama actual: $currentBranch" -ForegroundColor Yellow

if ($currentBranch -ne "danieljuegos") {
    Write-Host "⚠️  Este script debe ejecutarse desde la rama danieljuegos" -ForegroundColor Red
    Write-Host "Cambiando a danieljuegos..." -ForegroundColor Yellow
    git checkout danieljuegos
}

# Hacer backup
Write-Host "💾 Creando backup de package.json actuales..." -ForegroundColor Cyan
Copy-Item "frontend/package.json" "frontend/package.json.backup" -Force
Copy-Item "backend/package.json" "backend/package.json.backup" -Force

# Traer cambios de main
Write-Host "📥 Obteniendo cambios de main..." -ForegroundColor Cyan
git fetch origin main

# Intentar merge
Write-Host "🔀 Intentando merge con main..." -ForegroundColor Cyan
git merge origin/main --no-commit --no-ff

# Verificar conflictos
$conflicts = git diff --name-only --diff-filter=U
if ($conflicts -match "package.json") {
    Write-Host "⚠️  Conflictos detectados en package.json" -ForegroundColor Yellow
    Write-Host "✅ Usando versiones de main para package.json (mantiene todas las dependencias)" -ForegroundColor Green
    
    git checkout origin/main -- frontend/package.json
    git checkout origin/main -- backend/package.json
    git checkout origin/main -- frontend/package-lock.json
    git checkout origin/main -- backend/package-lock.json
    
    Write-Host "📦 Reinstalando dependencias del frontend..." -ForegroundColor Cyan
    Set-Location frontend
    npm install
    Set-Location ..
    
    Write-Host "📦 Reinstalando dependencias del backend..." -ForegroundColor Cyan
    Set-Location backend
    npm install
    Set-Location ..
    
    git add frontend/package*.json backend/package*.json
    
    Write-Host "✅ Conflictos resueltos!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Ahora puedes:" -ForegroundColor Cyan
    Write-Host "   1. Revisar otros conflictos si los hay: git status" -ForegroundColor White
    Write-Host "   2. Completar el merge: git commit -m 'fix: Resolver conflictos de merge con main'" -ForegroundColor White
    Write-Host "   3. Hacer push: git push origin danieljuegos" -ForegroundColor White
} else {
    Write-Host "✅ No hay conflictos en package.json" -ForegroundColor Green
    git merge --continue
}

Write-Host ""
Write-Host "🎉 Proceso completado!" -ForegroundColor Green
