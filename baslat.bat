@echo off
title Zyronova Tum Sistemleri Baslatici
echo =====================================================================
echo          ZYRONOVA ENTEGRE SaaS SISTEMI TOPLU SEKME BASLATICI
echo =====================================================================
echo.
echo Servisler Windows Terminal uzerinde sekmeler halinde baslatiliyor...
echo.

wt -p "Command Prompt" -d "%~dp0rent_a_car\Redis" cmd /c start_redis.bat ; new-tab -p "Command Prompt" -d "%~dp0tur_takip_otomasyonu\server" cmd /k npm start ; new-tab -p "Command Prompt" -d "%~dp0tur_takip_otomasyonu\client" cmd /k npm run dev ; new-tab -p "Command Prompt" -d "%~dp0rent_a_car" cmd /k .\.venv\Scripts\python.exe app.py

echo =====================================================================
echo [+] Tum servisler tek pencerede farkli sekmeler halinde baslatildi!
echo =====================================================================
timeout /t 3
