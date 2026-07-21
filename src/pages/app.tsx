import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AppPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<'channels'|'chats'>('channels');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({ name:'', description:'', type:'text' });
  const [editingPost, setEditingPost] = useState<string|null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const messagesEnd = useRef<any>(null);

  useEffect(() => { scrollToBottom(); }, [messages, posts]);

  function scrollToBottom() {
    setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/'); return; }
    setToken(t);
    fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + t } })
      .then(r => r.json()).then(d => { if (d.user) setUser(d.user); else router.push('/'); });
    fetch('/api/channel/list', { headers: { 'Authorization': 'Bearer ' + t } })
      .then(r => r.json()).then(d => setChannels(d.channels || [])).catch(() => {});
    fetch('/api/superadmin/users', { headers: { 'Authorization': 'Bearer ' + t } })
      .then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  function loadChannel(ch: any) {
    setActiveChannel(ch); setActiveChat(null); setReplyTo(null);
    fetch('/api/post/list?channel=' + ch._id, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {});
  }

  function startChat(u: any) {
    setActiveChat(u); setActiveChannel(null); setReplyTo(null);
    // Load existing messages
    setMessages([]);
  }

  async function sendPost() {
    if (!input.trim() && !uploading) return;
    const body: any = { content: input || '📎 فایل پیوست شد', channel: activeChannel._id };
    if (replyTo) body.replyTo = replyTo._id;
    const res = await fetch('/api/post/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.post) setPosts(prev => [data.post, ...prev]);
    setInput(''); setReplyTo(null);
  }

  async function sendMessage() {
    if (!input.trim() && !uploading) return;
    if (!activeChat) return;
    const res = await fetch('/api/chat/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ content: input, targetId: activeChat._id }),
    });
    const data = await res.json();
    if (data.message) setMessages(prev => [...prev, data.message]);
    setInput('');
  }

  async function uploadFile() {
    const files = fileInput.current?.files;
    if (!files || !files[0]) return;
    const file = files[0];
    setUploading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await fetch('/api/upload', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ fileData: base64, fileName: file.name, fileType: file.type }),
      });
      const data = await res.json();
      if (data.success) {
        const mediaHtml = data.file.type === 'image' ? '🖼️ ' : data.file.type === 'video' ? '🎬 ' : data.file.type === 'audio' ? '🎵 ' : '📎 ';
        setInput(prev => prev + ' ' + mediaHtml + window.location.origin + data.file.url);
      }
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    };
    reader.readAsDataURL(file);
  }

  async function editPost(postId: string) {
    if (!editContent.trim()) return;
    await fetch('/api/post/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ postId, content: editContent }),
    });
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, content: editContent, updatedAt: new Date() } : p));
    setEditingPost(null); setEditContent('');
  }

  async function deletePost(postId: string) {
    if (!confirm('حذف شود؟')) return;
    await fetch('/api/post/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ postId }),
    });
    setPosts(prev => prev.filter(p => p._id !== postId));
  }

  async function likePost(postId: string) {
    const res = await fetch('/api/post/like', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ postId }),
    });
    const data = await res.json();
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: p.likes || [], _liked: data.liked, _likesCount: data.likes } : p));
  }

  async function deleteMessage(messageId: string) {
    await fetch('/api/message/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ messageId }),
    });
    setMessages(prev => prev.filter(m => m._id !== messageId));
  }

  function renderContent(text: string) {
    // Detect URLs, images, audio, video
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('http')) {
        if (part.match(/\.(jpg|jpeg|png|gif|webp)/i)) return <img key={i} src={part} style={{ maxWidth:300, borderRadius:8, marginTop:4 }} />;
        if (part.match(/\.(mp4|webm)/i)) return <video key={i} src={part} controls style={{ maxWidth:300, borderRadius:8, marginTop:4 }} />;
        if (part.match(/\.(mp3|ogg|wav)/i)) return <audio key={i} src={part} controls style={{ marginTop:4, width:250 }} />;
        return <a key={i} href={part} target="_blank" style={{ color:'#7c3aed' }}>{part}</a>;
      }
      return part;
    });
  }

  if (!user) return <div style={{ padding:40, textAlign:'center', color:'#6b7280' }}>⏳</div>;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', flexDirection:'column' }}>
      <Head><title>Gerd — {user.displayName || user.username}</title></Head>

      {/* Main content area */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Sidebar */}
        <aside style={{ width:240, background:'#1e1e2e', borderLeft:'1px solid #313244', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:16, borderBottom:'1px solid #313244', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontWeight:700, color:'#7c3aed' }}>🌐 Gerd</span>
            <div onClick={() => router.push('/admin')} style={{ width:32, height:32, borderRadius:'50%', background:'#7c3aed', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              {user.displayName?.[0] || 'U'}
            </div>
          </div>
          <div style={{ display:'flex', padding:8, gap:4 }}>
            <button onClick={() => setTab('channels')} style={tabBtn(tab==='channels')}>📢 کانال</button>
            <button onClick={() => setTab('chats')} style={tabBtn(tab==='chats')}>💬 چت</button>
          </div>
          <div style={{ flex:1, overflow:'auto', padding:8 }}>
            {tab === 'channels' && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 8px', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'#6b7280' }}>کانال‌ها</span>
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <button onClick={() => setShowCreateChannel(true)} style={{ background:'none', border:'none', color:'#7c3aed', cursor:'pointer' }}>+</button>
                  )}
                </div>
                {channels.map((ch:any) => (
                  <div key={ch._id} onClick={() => loadChannel(ch)}
                    style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer', marginBottom:2,
                      background: activeChannel?._id === ch._id ? '#7c3aed33' : 'transparent',
                      color: activeChannel?._id === ch._id ? '#7c3aed' : '#a0a0b0', fontSize:14 }}>
                    # {ch.name} {ch.type === 'announcement' ? '📢' : ''}
                  </div>
                ))}
              </>
            )}
            {tab === 'chats' && (
              <>
                <div style={{ fontSize:12, color:'#6b7280', marginBottom:8, padding:'4px 8px' }}>کاربران</div>
                {users.filter((u:any) => u._id !== user._id).map((u:any) => (
                  <div key={u._id} onClick={() => startChat(u)}
                    style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, display:'flex', alignItems:'center', gap:8,
                      background: activeChat?._id === u._id ? '#7c3aed33' : 'transparent', color:'#a0a0b0', fontSize:14 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background: u.isOnline ? '#22c55e' : '#6b7280', display:'inline-block' }} />
                    {u.displayName || u.username}
                  </div>
                ))}
              </>
            )}
          </div>
          <div style={{ padding:'8px 16px', borderTop:'1px solid #313244', fontSize:12, color:'#6b7280', display:'flex', justifyContent:'space-between' }}>
            <span>@{user.username}</span>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          {/* Channel View */}
          {activeChannel && (
            <>
              <div style={{ padding:'12px 20px', borderBottom:'1px solid #313244', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <h2 style={{ fontSize:16, color:'#7c3aed', margin:0 }}># {activeChannel.name}</h2>
                  <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{activeChannel.description}</p>
                </div>
                <button onClick={() => loadChannel(activeChannel)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:18 }}>🔄</button>
              </div>
              <div style={{ flex:1, overflow:'auto', padding:16 }}>
                {posts.filter(p => p.isPinned).slice(0, 2).map((p:any) => (
                  <div key={p._id} style={{ padding:'6px 12px', background:'#7c3aed11', border:'1px solid #7c3aed33', borderRadius:8, marginBottom:8, fontSize:13 }}>
                    📌 {p.content?.slice(0,100)} <span style={{ color:'#6b7280', fontSize:11 }}>(پین شده)</span>
                  </div>
                ))}
                {posts.sort((a,b) => b.isPinned ? 1 : -1).map((post:any) => (
                  <div key={post._id} style={{ padding:'12px 16px', background:'#1e1e2e', border:'1px solid #313244', borderRadius:8, marginBottom:8 }}>
                    {post.isPinned && <span style={{ fontSize:11, color:'#7c3aed' }}>📌 پین شده</span>}
                    {post.replyTo && <div style={{ fontSize:12, color:'#6b7280', padding:'4px 8px', background:'#0d1117', borderRadius:4, marginBottom:6 }}>↪️ پاسخ به یک پیام</div>}
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ fontWeight:600, fontSize:13 }}>{post.author?.displayName || post.author?.username || 'کاربر'}</span>
                      <span style={{ fontSize:11, color:'#6b7280' }}>{new Date(post.createdAt).toLocaleString('fa-IR')}</span>
                      {post.updatedAt && <span style={{ fontSize:11, color:'#6b7280' }}>(ویرایش شده)</span>}
                      {post.author?._id === user._id && (
                        <span style={{ marginRight:'auto', display:'flex', gap:4 }}>
                          <button onClick={() => { setEditingPost(post._id); setEditContent(post.content); }} style={{ background:'none', border:'none', color:'#a0a0b0', cursor:'pointer', fontSize:12 }}>✏️</button>
                          <button onClick={() => deletePost(post._id)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:12 }}>🗑️</button>
                        </span>
                      )}
                    </div>
                    {editingPost === post._id ? (
                      <div>
                        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width:'100%', background:'#0d1117', border:'1px solid #313244', borderRadius:8, padding:8, color:'#e0e0e0', fontSize:14, minHeight:60, resize:'vertical' }} />
                        <div style={{ display:'flex', gap:6, marginTop:4 }}>
                          <button onClick={() => editPost(post._id)} style={miniBtn('#7c3aed')}>ذخیره</button>
                          <button onClick={() => setEditingPost(null)} style={miniBtn('#6b7280')}>لغو</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize:14, lineHeight:1.7, margin:0 }}>{renderContent(post.content)}</p>
                        <div style={{ display:'flex', gap:12, marginTop:8, alignItems:'center' }}>
                          <button onClick={() => likePost(post._id)} style={{ background:'none', border:'none', color:'#a0a0b0', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:4 }}>
                            ❤️ {post.likes?.length || 0}
                          </button>
                          <button onClick={() => setReplyTo(post)} style={{ background:'none', border:'none', color:'#a0a0b0', cursor:'pointer', fontSize:13 }}>↪️ پاسخ</button>
                          {(user.role === 'admin' || user.role === 'superadmin') && (
                            <button onClick={() => fetch('/api/post/update', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify({ postId:post._id, isPinned:!post.isPinned }) })}
                              style={{ background:'none', border:'none', color:'#a0a0b0', cursor:'pointer', fontSize:13 }}>📌 {post.isPinned ? 'آزاد' : 'پین'}</button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>
              <div style={{ padding:'10px 16px', borderTop:'1px solid #313244', background:'#0d1117' }}>
                {replyTo && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 8px', fontSize:12, color:'#7c3aed', marginBottom:4 }}>
                    ↪️ پاسخ به {replyTo.author?.displayName || replyTo.author?.username || 'کاربر'}: {replyTo.content?.slice(0,50)}...
                    <button onClick={() => setReplyTo(null)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}>✕</button>
                  </div>
                )}
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="file" ref={fileInput} onChange={uploadFile} style={{ display:'none' }} />
                  <button onClick={() => fileInput.current?.click()} disabled={uploading}
                    style={{ background:'none', border:'none', color:'#7c3aed', cursor:'pointer', fontSize:20 }}>{uploading ? '⏳' : '📎'}</button>
                  <input placeholder={activeChannel.type === 'announcement' ? 'اعلامیه...' : 'پیام...'} value={input} onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (activeChannel ? sendPost() : sendMessage())}
                    style={{ flex:1, background:'#1e1e2e', border:'1px solid #313244', borderRadius:24, padding:'10px 16px', color:'#e0e0e0', fontSize:14 }} />
                  <button onClick={activeChannel ? sendPost : sendMessage}
                    style={{ background:'#7c3aed', color:'white', border:'none', borderRadius:'50%', width:40, height:40, cursor:'pointer', fontSize:16 }}>➤</button>
                </div>
              </div>
            </>
          )}

          {/* Chat View */}
          {activeChat && (
            <>
              <div style={{ padding:'12px 20px', borderBottom:'1px solid #313244' }}>
                <h2 style={{ fontSize:16, margin:0 }}>💬 {activeChat.displayName || activeChat.username}</h2>
              </div>
              <div style={{ flex:1, overflow:'auto', padding:16 }}>
                {messages.map((m:any) => (
                  <div key={m._id} style={{ marginBottom:8, textAlign: m.sender?._id === user._id ? 'left' : 'right', position:'relative' }}>
                    <div style={{ display:'inline-block', background: m.sender?._id === user._id ? '#7c3aed' : '#1e1e2e', color: m.sender?._id === user._id ? 'white' : '#e0e0e0', padding:'8px 14px', borderRadius:14, fontSize:14, maxWidth:'70%', wordBreak:'break-word' }}>
                      {renderContent(m.content)}
                    </div>
                    {m.sender?._id === user._id && (
                      <button onClick={() => deleteMessage(m._id)} style={{ position:'absolute', top:-4, left:-4, background:'#ef4444', color:'white', border:'none', borderRadius:'50%', width:18, height:18, cursor:'pointer', fontSize:10, display:'none' }}
                        onMouseEnter={e => e.currentTarget.style.display='block'} onMouseLeave={e => e.currentTarget.style.display='none'}>✕</button>
                    )}
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>
              <div style={{ padding:'10px 16px', borderTop:'1px solid #313244', display:'flex', gap:8 }}>
                <input placeholder="پیام..." value={input} onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  style={{ flex:1, background:'#1e1e2e', border:'1px solid #313244', borderRadius:24, padding:'10px 16px', color:'#e0e0e0', fontSize:14 }} />
                <button onClick={sendMessage} style={{ background:'#7c3aed', color:'white', border:'none', borderRadius:'50%', width:40, height:40, cursor:'pointer', fontSize:16 }}>➤</button>
              </div>
            </>
          )}

          {/* Empty state */}
          {!activeChannel && !activeChat && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', color:'#6b7280' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🌐</div>
              <h2 style={{ color:'#7c3aed', margin:0 }}>خوش آمدی {user.displayName || user.username}!</h2>
              <p style={{ marginTop:8 }}>یه کانال انتخاب کن یا با یکی چت کن</p>
            </div>
          )}
        </main>
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 }}
          onClick={() => setShowCreateChannel(false)}>
          <div style={{ background:'#1e1e2e', border:'1px solid #313244', borderRadius:16, padding:24, width:400 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color:'#7c3aed', marginBottom:16 }}>کانال جدید</h2>
            <input placeholder="نام کانال" value={newChannel.name} onChange={e => setNewChannel({...newChannel, name:e.target.value})} style={s} />
            <input placeholder="توضیحات" value={newChannel.description} onChange={e => setNewChannel({...newChannel, description:e.target.value})} style={s} />
            <select value={newChannel.type} onChange={e => setNewChannel({...newChannel, type:e.target.value})} style={s}>
              <option value="text">📝 متنی</option><option value="announcement">📢 اعلامیه</option>
            </select>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button onClick={async () => {
                if (!newChannel.name) return;
                const res = await fetch('/api/channel/create', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify(newChannel) });
                const d = await res.json();
                if (d.channel) { setChannels(prev => [...prev, d.channel]); setShowCreateChannel(false); setNewChannel({ name:'', description:'', type:'text' }); }
              }} style={{ flex:1, background:'#7c3aed', color:'white', border:'none', padding:'10px', borderRadius:8, cursor:'pointer' }}>ایجاد</button>
              <button onClick={() => setShowCreateChannel(false)} style={{ flex:1, background:'#313244', color:'#a0a0b0', border:'none', padding:'10px', borderRadius:8, cursor:'pointer' }}>لغو</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer with MIT */}
      <footer style={{ textAlign:'center', padding:'8px', fontSize:11, color:'#6b7280', borderTop:'1px solid #313244', background:'#0d1117' }}>
        ساخته شده با ❤️ توسط <a href="https://t.me/llllxyz" style={{ color:'#7c3aed' }}>Mohammad</a> | 
        <a href="https://github.com/mamadiezad/gerd" style={{ color:'#6b7280', marginRight:4 }}>MIT License</a>
      </footer>
    </div>
  );
}

const s: any = { background:'#11111b', border:'1px solid #313244', borderRadius:8, padding:'10px 14px', color:'#e0e0e0', width:'100%', marginBottom:8, display:'block', fontSize:14 };
const tabBtn = (active: boolean) => ({ flex:1, padding:'6px', borderRadius:6, border:'none', cursor:'pointer', background: active ? '#7c3aed33' : 'transparent', color: active ? '#7c3aed' : '#6b7280', fontSize:12, fontWeight:600 });
const miniBtn = (color: string) => ({ background:color, color:'white', border:'none', padding:'4px 12px', borderRadius:6, cursor:'pointer', fontSize:12 });
const inputStyle: any = { background:'#11111b', border:'1px solid #313244', borderRadius:8, padding:'10px 14px', color:'#e0e0e0', width:'100%', marginBottom:8, display:'block', fontSize:14 };
