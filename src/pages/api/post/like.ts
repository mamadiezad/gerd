import { Post } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any, user: any) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { postId } = req.body;
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const idx = post.likes.indexOf(user._id);
  if (idx > -1) post.likes.splice(idx, 1);
  else post.likes.push(user._id);
  await post.save();
  res.json({ likes: post.likes.length, liked: idx === -1 });
});
