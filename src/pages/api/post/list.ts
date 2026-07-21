import { Post } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any) => {
  const { channel } = req.query;
  const filter: any = {};
  if (channel) filter.channel = channel;
  const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(50).populate('author', 'username displayName avatar').lean();
  res.json({ posts });
});
