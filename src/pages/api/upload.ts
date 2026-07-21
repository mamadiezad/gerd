import { authMiddleware } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_SIZE = 20 * 1024 * 1024;

export default authMiddleware(async (req: any, res: any, user: any) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { fileData, fileName, fileType } = req.body;
    if (!fileData) return res.status(400).json({ error: 'No file data' });

    const buffer = Buffer.from(fileData, 'base64');
    if (buffer.length > MAX_SIZE) return res.status(400).json({ error: 'File too large' });

    const ext = fileName?.split('.').pop() || 'bin';
    const safeName = uuidv4().slice(0, 12) + '.' + ext;
    fs.writeFileSync(path.join(UPLOAD_DIR, safeName), buffer);

    const mediaType = fileType?.startsWith('image') ? 'image' : fileType?.startsWith('video') ? 'video' : fileType?.startsWith('audio') ? 'audio' : 'file';

    res.json({ success: true, file: { url: '/uploads/' + safeName, name: fileName, type: mediaType, size: buffer.length } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
