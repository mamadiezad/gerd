import mongoose from 'mongoose';
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gerd';

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  displayName: { type: String },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['member', 'admin', 'superadmin'], default: 'member' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'voice', 'announcement'], default: 'text' },
  description: { type: String, default: '' },
  isPrivate: { type: Boolean, default: false },
  allowedRoles: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const PostSchema = new mongoose.Schema({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  attachments: [{ url: String, type: String }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  isPinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

const InviteSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  maxUses: { type: Number, default: 0 },
  useCount: { type: Number, default: 0 },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: String },
  lastMessageAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const MessageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

const OnlineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  socketId: { type: String },
  lastPing: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Channel = mongoose.models.Channel || mongoose.model('Channel', ChannelSchema);
export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
export const Invite = mongoose.models.Invite || mongoose.model('Invite', InviteSchema);
export const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
export const Online = mongoose.models.Online || mongoose.model('Online', OnlineSchema);

let cached = (global as any).__mongo;
if (!cached) cached = (global as any).__mongo = { conn: null, promise: null };
export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(URI).then(m => m);
  cached.conn = await cached.promise;
  return cached.conn;
}
