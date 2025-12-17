# Start SMART-Admin Server
# Uses port 5502 to avoid conflicts

$env:NODE_ENV = "development"
$env:PORT = "8502"

Write-Host "🚀 Starting SMART-Admin server on port 8502..." -ForegroundColor Green
npx tsx server/index.ts
