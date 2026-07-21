import { Post } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any, user: any) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { postId } = req.body;
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (post.author.toString() !== user._id.toString() && user.role === 'member') return res.status(403).json({ error: 'Forbidden' });
  await Post.findByIdAndDelete(postId);
  res.json({ success: true });
});
