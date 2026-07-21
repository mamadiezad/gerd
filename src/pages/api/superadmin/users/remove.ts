import { User } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any, user: any) => {
  if (user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  await User.findByIdAndDelete(req.body.userId);
  res.json({ success: true });
});
