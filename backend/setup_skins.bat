@echo off
echo ========================================
echo   🐍 Setup Snake Skins System
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
echo.

echo [2/4] Sincronizando base de datos...
call npx prisma db push
echo.

echo [3/4] Generating Prisma client...
call npx prisma generate
echo.

echo [4/4] Seeding epic skins...
call node seed_skins.js
echo.

echo ========================================
echo   ✅ Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure MERCADOPAGO_ACCESS_TOKEN in .env
echo 2. Configure MERCADOPAGO_PUBLIC_KEY in .env
echo 3. Run: npm start
echo.
pause
