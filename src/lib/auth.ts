import jwt from 'jsonwebtoken';
import { connectDB, User } from '@/lib/db';
import { config } from '@/lib/config';

export function authMiddleware(handler: Function) {
  return async (req: any, res: any) => {
    try {
      const auth = req.headers.authorization?.replace('Bearer ', '');
      if (!auth) return res.status(401).json({ error: 'No token' });
      const payload = jwt.verify(auth, config.jwt.secret) as any;
      await connectDB();
      const user = await User.findById(payload.id);
      if (!user) return res.status(401).json({ error: 'User not found' });
      return handler(req, res, user);
    } catch { return res.status(401).json({ error: 'Invalid token' }); }
  };
}

export function adminMiddleware(handler: Function) {
  return authMiddleware(async (req: any, res: any, user: any) => {
    if (user.role !== 'admin' && user.role !== 'superadmin')
      return res.status(403).json({ error: 'Admin only' });
    return handler(req, res, user);
  });
}

export function superAdminMiddleware(handler: Function) {
  return authMiddleware(async (req: any, res: any, user: any) => {
    if (user.role !== 'superadmin')
      return res.status(403).json({ error: 'Super admin only' });
    return handler(req, res, user);
  });
}
