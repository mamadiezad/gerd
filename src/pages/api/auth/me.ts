import { connectDB, User } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';
export default async function handler(req: any, res: any) {
  try {
    const auth = req.headers.authorization?.replace('Bearer ', '');
    if (!auth) return res.status(401).json({ error: 'No token' });
    const payload = jwt.verify(auth, config.jwt.secret) as any;
    await connectDB();
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}
