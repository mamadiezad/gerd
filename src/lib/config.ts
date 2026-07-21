export const config = {
  mongo: process.env.MONGODB_URI || 'mongodb://localhost:27017/gerd',
  jwt: { secret: process.env.JWT_SECRET || 'gerd-secret', expiresIn: '30d' },
  site: { name: 'Gerd', url: process.env.SITE_URL || 'http://localhost:3000', support: '@llllxyz' },
  defaultAdmin: { email: process.env.ADMIN_EMAIL || 'admin@gerd.local', password: process.env.ADMIN_PASSWORD || 'admin123', username: process.env.ADMIN_USERNAME || 'admin' },
};

export const INVITE_CODES = process.env.INVITE_CODES?.split(',') || ['GERD2024'];
