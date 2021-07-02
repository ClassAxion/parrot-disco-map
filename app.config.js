module.exports = {
    apps: [
        {
            name: 'parrot-disco-map',
            script: './app.js',
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
