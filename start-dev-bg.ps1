# PowerShell version for better control
Write-Host "Starting SMART-Admin Development Server..." -ForegroundColor Green

# Kill any existing processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*SMART-Admin*" } | Stop-Process -Force

# Start backend in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location "D:\SMART-Admin"
    npm run dev:win *>&1 | Out-File -FilePath "logs\backend.log" -Append
}

# Start frontend in background 
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "D:\SMART-Admin\client"
    npx vite *>&1 | Out-File -FilePath "..\logs\frontend.log" -Append
}

Write-Host "Backend Job ID: $($backendJob.Id)" -ForegroundColor Yellow
Write-Host "Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Yellow

Write-Host "`nSMART-Admin servers started in background" -ForegroundColor Green
Write-Host "Backend logs: logs\backend.log" -ForegroundColor Cyan
Write-Host "Frontend logs: logs\frontend.log" -ForegroundColor Cyan
Write-Host "`nUse 'Get-Job' to see running jobs" -ForegroundColor Yellow
Write-Host "Use 'Stop-Job <ID>' to stop individual servers" -ForegroundColor Yellow
Write-Host "Use '.\stop-dev.ps1' to stop all servers" -ForegroundColor Yellow