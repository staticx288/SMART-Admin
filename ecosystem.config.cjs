// PM2 Production Configuration for SMART-Admin
module.exports = {
  apps: [
    {
      name: 'smart-admin-server',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'server/index.ts',
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: '5001'
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 3000,
      listen_timeout: 5000,
      wait_ready: false,
      combine_logs: true,
      time: true
    },
    {
      name: 'smart-node-agent',
      script: './UniversalSMARTAgent.py',
      interpreter: 'python3',
      cwd: process.cwd() + '/smart_node_agent',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PYTHONUNBUFFERED: '1'
      },
      error_file: '../logs/agent-error.log',
      out_file: '../logs/agent-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
