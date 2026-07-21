import { Chat } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any, user: any) => {
  const chats = await Chat.find({ participants: user._id }).sort({ lastMessageAt: -1 }).populate('participants', 'username displayName avatar isOnline').lean();
  res.json({ chats });
});
