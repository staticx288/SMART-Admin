# Stop all SMART-Admin background jobs
Write-Host "Stopping SMART-Admin Development Server..." -ForegroundColor Yellow

# Stop PowerShell jobs
Get-Job | Where-Object { $_.Command -like "*npm run dev*" -or $_.Command -like "*npx vite*" } | Stop-Job
Get-Job | Where-Object { $_.Command -like "*npm run dev*" -or $_.Command -like "*npx vite*" } | Remove-Job

# Kill any remaining node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*SMART-Admin*" } | Stop-Process -Force

Write-Host "SMART-Admin servers stopped" -ForegroundColor Green