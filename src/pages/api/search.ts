import { Post, Message, User } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) return res.json({ posts: [], users: [] });
  
  const regex = new RegExp(q, 'i');
  const [posts, users] = await Promise.all([
    Post.find({ content: regex }).sort({ createdAt: -1 }).limit(20).populate('author', 'username displayName').lean(),
    User.find({ $or: [{ username: regex }, { displayName: regex }] }).select('-password').limit(10).lean(),
  ]);
  res.json({ posts, users });
});
