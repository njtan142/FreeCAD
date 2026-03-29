@echo off
cd /d "%~dp0"
echo Starting FreeCAD with debug output...
set PYTHONVERBOSE=2
".pixi\envs\default\Library\bin\FreeCAD.exe" > freecad_output.log 2>&1
echo FreeCAD process ended with code: %ERRORLEVEL%
pause
