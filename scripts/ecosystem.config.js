module.exports = {
  apps: [
    {
      name: 'iwedding-saas',
      script: 'server.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        JWT_SECRET: 'your-production-secret'
      }
    }
  ]
};
