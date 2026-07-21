import { Chat, Message } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any, user: any) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { chatId, content } = req.body;
  let chat = chatId ? await Chat.findById(chatId) : null;
  if (!chat) chat = await Chat.create({ participants: [user._id, req.body.targetId] });
  const msg = await Message.create({ chat: chat._id, sender: user._id, content });
  chat.lastMessage = content; chat.lastMessageAt = new Date(); await chat.save();
  const populated = await Message.findById(msg._id).populate('sender', 'username displayName').lean();
  res.json({ message: populated, chatId: chat._id });
});
