import { Message } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any) => {
  const { chatId } = req.query;
  const messages = await Message.find({ chat: chatId }).sort({ createdAt: -1 }).limit(50).populate('sender', 'username displayName').lean();
  res.json({ messages: messages.reverse() });
});
