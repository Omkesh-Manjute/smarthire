@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM  VerifyHire — JobsInHand Daily Ingestion Cron Setup
REM  Schedules the scraper to run every day at 7:00 PM IST (19:00)
REM
REM  ▶ Run this script ONCE as Administrator to register the Task Scheduler job
REM  ▶ Task name: VerifyHire_JobsInHand_Ingestion
REM ═══════════════════════════════════════════════════════════════════════════

setlocal

SET TASK_NAME=VerifyHire_JobsInHand_Ingestion
SET SCRIPT_PATH=f:\App Projects\Fake candidate app\verifyhire-react\server\jobs-ingestion\run-ingestion.js
SET NODE_EXE=node
SET START_TIME=19:00

echo.
echo ═══════════════════════════════════════════════════════════
echo  VerifyHire JobsInHand Ingestion Scheduler Setup
echo ═══════════════════════════════════════════════════════════
echo  Task Name  : %TASK_NAME%
echo  Script     : %SCRIPT_PATH%
echo  Schedule   : Daily at %START_TIME% (7:00 PM IST)
echo ═══════════════════════════════════════════════════════════
echo.

REM Delete existing task if it exists (suppress error if not found)
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

REM Create new scheduled task (runs every 6 minutes)
schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "\"%NODE_EXE%\" \"%SCRIPT_PATH%\"" ^
  /sc MINUTE ^
  /mo 6 ^
  /rl HIGHEST ^
  /f

IF %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ SUCCESS! Task scheduled successfully.
  echo.
  echo  The ingestion job will run automatically every 6 minutes.
  echo  To verify: schtasks /query /tn "%TASK_NAME%"
  echo  To verify: schtasks /query /tn "%TASK_NAME%"
  echo  To run now: schtasks /run /tn "%TASK_NAME%"
  echo  To remove:  schtasks /delete /tn "%TASK_NAME%" /f
  echo.
) ELSE (
  echo.
  echo ❌ FAILED to create scheduled task.
  echo  Make sure you are running this as Administrator.
  echo.
)

REM Show task info
echo Current Task Details:
schtasks /query /tn "%TASK_NAME%" /fo LIST 2>nul

echo.
pause
