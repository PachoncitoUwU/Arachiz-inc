#!/bin/bash

# Script para resolver conflictos de package.json entre main y danieljuegos

echo "🔧 Resolviendo conflictos de package.json..."

# Verificar que estamos en la rama correcta
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Rama actual: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "danieljuegos" ]; then
    echo "⚠️  Este script debe ejecutarse desde la rama danieljuegos"
    echo "Cambiando a danieljuegos..."
    git checkout danieljuegos
fi

# Hacer backup de los archivos actuales
echo "💾 Creando backup de package.json actuales..."
cp frontend/package.json frontend/package.json.backup
cp backend/package.json backend/package.json.backup

# Traer los cambios de main
echo "📥 Obteniendo cambios de main..."
git fetch origin main

# Intentar merge
echo "🔀 Intentando merge con main..."
git merge origin/main --no-commit --no-ff

# Si hay conflictos en package.json, usar la versión de main
if git diff --name-only --diff-filter=U | grep -q "package.json"; then
    echo "⚠️  Conflictos detectados en package.json"
    echo "✅ Usando versiones de main para package.json (mantiene todas las dependencias)"
    
    git checkout origin/main -- frontend/package.json
    git checkout origin/main -- backend/package.json
    git checkout origin/main -- frontend/package-lock.json
    git checkout origin/main -- backend/package-lock.json
    
    echo "📦 Reinstalando dependencias..."
    cd frontend && npm install && cd ..
    cd backend && npm install && cd ..
    
    git add frontend/package*.json backend/package*.json
    
    echo "✅ Conflictos resueltos!"
    echo ""
    echo "📝 Ahora puedes:"
    echo "   1. Revisar otros conflictos si los hay: git status"
    echo "   2. Completar el merge: git commit"
    echo "   3. Hacer push: git push origin danieljuegos"
else
    echo "✅ No hay conflictos en package.json"
    git merge --continue
fi

echo ""
echo "🎉 Proceso completado!"
