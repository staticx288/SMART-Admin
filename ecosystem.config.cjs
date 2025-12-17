// PM2 Ecosystem Configuration for SMART-Admin
// This manages the server process with auto-restart and logging

module.exports = {
  apps: [{
    name: 'smart-admin',
    script: 'server/index.ts',
    interpreter: 'node',
    interpreter_args: '--import tsx',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',  // Use fork mode instead of cluster for UDP server
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 8502
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // Restart strategies
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    // Advanced settings
    kill_timeout: 5000,
    listen_timeout: 10000,
    shutdown_with_message: true,
    // Windows-specific: prevent console window popup (fixes focus stealing)
    windowsHide: true
  }]
};
