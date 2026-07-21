import { User } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any, user: any) => {
  if (user.role !== 'admin' && user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
  res.json({ users });
});
