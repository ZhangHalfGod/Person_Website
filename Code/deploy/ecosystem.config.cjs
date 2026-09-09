# Optional. This SPA is static; Nginx serving dist is the same pattern as MechAssist frontend.
# Use PM2 only if you insist on a Node process in `pm2 ls`.
#   cd /var/www/Person_Website/Code
#   npm run build
#   pm2 start ecosystem.config.cjs
# Then point Nginx location / to http://127.0.0.1:4173 instead of the dist root.

module.exports = {
  apps: [
    {
      name: 'person-website',
      cwd: '/var/www/Person_Website/Code',
      script: 'npx',
      args: 'vite preview --host 127.0.0.1 --port 4173',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
