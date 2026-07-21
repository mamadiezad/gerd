import { Channel } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any, user: any) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (user.role !== 'admin' && user.role !== 'superadmin') return res.status(403).json({ error: 'Only admins' });
  const channel = await Channel.create({ ...req.body, createdBy: user._id });
  res.json({ channel });
});
