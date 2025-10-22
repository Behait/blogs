export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // Help Strapi detect correct scheme/host when behind proxy or accessed remotely
  url: env('PUBLIC_URL', 'http://43.132.197.38:1337'),
  proxy: true,
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // Admin authentication settings
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
      // Deprecated in Strapi 6; keeping for now alongside sessions
      options: {
        expiresIn: '7d',
      },
      sessions: {
        // Ensure refresh/session cookies can be used over HTTP
        cookie: {
          secure: false,
          httpOnly: true,
          sameSite: 'lax',
        },
        // Optional lifespans; adjust as needed (in milliseconds)
                maxRefreshTokenLifespan: 604800000,
                maxSessionLifespan: 604800000,
      },
    },
  },
});
