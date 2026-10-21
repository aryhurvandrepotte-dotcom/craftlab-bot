# Crée la tâche planifiée "Craft Lab Bot" : le bot démarre caché à chaque ouverture de session Windows.
# Pour l'enlever : Unregister-ScheduledTask -TaskName 'Craft Lab Bot' -Confirm:$false
$script = Join-Path $PSScriptRoot 'run-bot.ps1'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`"" `
  -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName 'Craft Lab Bot' -Action $action -Trigger $trigger -Settings $settings `
  -Description 'Bot Discord Craft Lab (vérification)' -Force | Out-Null
Write-Host "Tâche 'Craft Lab Bot' installée."
