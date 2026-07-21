import { Invite } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
export default authMiddleware(async (req: any, res: any, user: any) => {
  if (user.role !== 'admin' && user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const code = (req.body?.code) || uuidv4().slice(0, 6).toUpperCase();
  const invite = await Invite.create({ code, createdBy: user._id, ...req.body });
  res.json({ invite });
});
