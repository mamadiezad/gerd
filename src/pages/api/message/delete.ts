import { Message } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any, user: any) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { messageId } = req.body;
  const msg = await Message.findById(messageId);
  if (!msg) return res.status(404).json({ error: 'Not found' });
  if (msg.sender.toString() !== user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
  await Message.findByIdAndDelete(messageId);
  res.json({ success: true });
});
