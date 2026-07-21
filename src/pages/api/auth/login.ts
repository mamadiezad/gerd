import { connectDB, User } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await connectDB();
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, config.jwt.secret, { expiresIn: '30d' });
    user.isOnline = true; user.lastSeen = new Date(); await user.save();
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role, displayName: user.displayName, bio: user.bio, avatar: user.avatar } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
