import { Channel } from '@/lib/db';
import { authMiddleware } from '@/lib/auth';
export default authMiddleware(async (req: any, res: any) => {
  const channels = await Channel.find().sort({ createdAt: 1 }).lean();
  res.json({ channels });
});
