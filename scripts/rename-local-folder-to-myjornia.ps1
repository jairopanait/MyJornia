Write-Host "Cierra VS Code y cualquier servidor Expo antes de ejecutar este script." -ForegroundColor Yellow

$oldPath = Join-Path $env:USERPROFILE "MyWorkday"
$newPath = Join-Path $env:USERPROFILE "MyJornia"

if (-not (Test-Path -LiteralPath $oldPath)) {
  Write-Host "No encuentro la carpeta $oldPath" -ForegroundColor Red
  exit 1
}

if (Test-Path -LiteralPath $newPath) {
  Write-Host "Ya existe $newPath. No hago nada para no sobrescribir." -ForegroundColor Red
  exit 1
}

Rename-Item -LiteralPath $oldPath -NewName "MyJornia"
Set-Location -LiteralPath $newPath
git remote set-url origin https://github.com/jairopanait/MyJornia.git

Write-Host "Carpeta renombrada a $newPath" -ForegroundColor Green
Write-Host "Remoto actualizado a https://github.com/jairopanait/MyJornia.git" -ForegroundColor Green
Write-Host "Abre VS Code desde la nueva carpeta y ejecuta: npx expo start --clear" -ForegroundColor Cyan
