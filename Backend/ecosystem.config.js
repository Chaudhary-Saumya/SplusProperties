module.exports = {
    apps: [
        {
            name: 'property-backend',
            script: 'index.js',
            cwd: '/Users/sumitchaudhary/LandSelling/Backend',
            instances: 'max',        // Cluster mode: use all CPU cores
            exec_mode: 'cluster',
            watch: false,
            max_memory_restart: '500M', // Restart if memory exceeds 500MB
            env: {
                NODE_ENV: 'development',
                PORT: 5000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 5000
            },
            // Logging
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            merge_logs: true,
            // Crash recovery
            restart_delay: 3000,       // Wait 3s before restarting after crash
            max_restarts: 10,
            min_uptime: '5s',
            autorestart: true,
        }
    ]
};
