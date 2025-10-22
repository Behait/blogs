export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    // Switch to session-based admin auth and configure cookies for HTTP
    sessions: {
      cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
      },
      // Use numeric milliseconds to avoid NaN timestamps in DB
      maxRefreshTokenLifespan: 604800000,
      maxSessionLifespan: 604800000,
    },
    // Keep JWT option for backward compatibility; Strapi 6 removes this
    options: {
      expiresIn: '7d',
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
