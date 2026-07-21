import { User } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any, user: any) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { displayName, bio, avatar } = req.body;
  if (displayName) user.displayName = displayName;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  res.json({ user: { id: user._id, username: user.username, displayName: user.displayName, bio: user.bio, avatar: user.avatar, role: user.role } });
});
