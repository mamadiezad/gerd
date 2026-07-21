import { Post } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any, user: any) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const post = await Post.create({ ...req.body, author: user._id });
  const populated = await Post.findById(post._id).populate('author', 'username displayName avatar').lean();
  res.json({ post: populated });
});
