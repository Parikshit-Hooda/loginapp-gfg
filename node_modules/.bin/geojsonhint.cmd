@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\@mapbox\geojsonhint\bin\geojsonhint" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\..\@mapbox\geojsonhint\bin\geojsonhint" %*
)