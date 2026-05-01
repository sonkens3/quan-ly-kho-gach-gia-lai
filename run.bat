@echo off
setlocal EnableExtensions

title Quan ly kho gach
cd /d "%~dp0"

if not defined PORT set "PORT=3000"

echo.
echo =========================================
echo  QUAN LY KHO GACH
echo =========================================
echo.

if not exist "package.json" (
  echo [LOI] Khong tim thay package.json.
  echo Hay dat file run.bat trong thu muc goc cua du an.
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] May nay chua cai Node.js.
  echo Hay cai ban Node.js LTS, sau do mo lai run.bat.
  echo Link tai: https://nodejs.org/
  start "" "https://nodejs.org/"
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong tim thay npm.
  echo Hay cai lai Node.js LTS tai: https://nodejs.org/
  start "" "https://nodejs.org/"
  echo.
  pause
  exit /b 1
)

for /f "tokens=* usebackq" %%V in (`node --version`) do set "NODE_VERSION=%%V"
echo Node.js: %NODE_VERSION%

if not exist "node_modules\" (
  echo.
  echo Lan dau chay: dang cai thu vien, vui long doi...
  call npm install
  if errorlevel 1 goto install_error
)

echo.
echo Dang chay web tai:
echo   - May nay: http://localhost:%PORT%

for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /i "IPv4"') do (
  set "LAN_IP=%%A"
  goto show_lan_ip
)

:show_lan_ip
if defined LAN_IP set "LAN_IP=%LAN_IP: =%"
if defined LAN_IP echo   - May khac cung Wi-Fi/LAN: http://%LAN_IP%:%PORT%

echo.
echo Neu trinh duyet chua tu mo, hay mo link o tren.
echo Muon tat chuong trinh: dong cua so nay hoac bam Ctrl+C.
echo.

echo Dang build ban web tinh...
call npm run build
if errorlevel 1 goto build_error

if /i not "%NO_BROWSER%"=="1" (
  start "" /min cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:%PORT%"
)

call npm run start -- --listen tcp://0.0.0.0:%PORT%
if errorlevel 1 goto run_error

echo.
echo Ung dung da dung.
pause
exit /b 0

:install_error
echo.
echo [LOI] Cai thu vien that bai.
echo Hay kiem tra internet va chay lai run.bat.
echo.
pause
exit /b 1

:build_error
echo.
echo [LOI] Build web that bai.
echo Hay xem thong bao loi o phia tren roi chay lai run.bat.
echo.
pause
exit /b 1

:run_error
echo.
echo [LOI] Khong chay duoc ung dung.
echo Neu cong %PORT% dang bi chiem, hay tat server cu roi chay lai.
echo.
pause
exit /b 1
