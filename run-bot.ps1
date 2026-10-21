# Lance le bot en boucle : s'il s'arrête ou plante, il redémarre 10 s plus tard.
# Démarré automatiquement par la tâche planifiée Windows "Craft Lab Bot" (voir install-autostart.ps1).
Set-Location $PSScriptRoot
$env:NODE_OPTIONS = '--use-system-ca'   # Avast intercepte le HTTPS : on fait confiance aux certificats Windows
New-Item -ItemType Directory -Force logs | Out-Null
$log = Join-Path $PSScriptRoot 'logs\bot.log'

while ($true) {
  Add-Content $log "[$(Get-Date -Format s)] Démarrage du bot"
  node --env-file=.env src/index.js 2>&1 | ForEach-Object { "$_" } | Add-Content -Path $log -Encoding UTF8
  Add-Content $log "[$(Get-Date -Format s)] Bot arrêté (code $LASTEXITCODE), redémarrage dans 10 s"
  Start-Sleep -Seconds 10
}
