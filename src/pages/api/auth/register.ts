import { connectDB, User, Invite } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config, INVITE_CODES } from '@/lib/config';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await connectDB();
    const { email, username, password, inviteCode } = req.body;
    if (!email || !username || !password) return res.status(400).json({ error: 'All fields required' });

    // Check invite
    if (!INVITE_CODES.includes(inviteCode)) {
      const dbInvite = await Invite.findOne({ code: inviteCode, isActive: true });
      if (!dbInvite || (dbInvite.maxUses > 0 && dbInvite.useCount >= dbInvite.maxUses))
        return res.status(403).json({ error: 'Invalid invite code' });
      if (dbInvite) {
        dbInvite.useCount++;
        await dbInvite.save();
      }
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ error: 'Email or username taken' });

    const hashed = await bcrypt.hash(password, 12);
    const role = (await User.countDocuments()) === 0 ? 'superadmin' : 'member';
    const user = await User.create({ email, username, password: hashed, displayName: username, role });
    const token = jwt.sign({ id: user._id, role: user.role }, config.jwt.secret, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, username, email: user.email, role: user.role, displayName: user.displayName } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
