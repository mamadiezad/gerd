import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const EMOJIS = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😜','🤔','🤗','🤩','😐','😑','😶','🙄','😏','😒','😔','😕','🙃','🤑','😲','☹️','😤','😢','😭','😈','👿','👍','👎','👊','✊','🤝','👏','🙌','💪','❤️','🧡','💛','💚','💙','💜','🖤','💝','💖','✨','🌟','⭐','🔥','💯','🎉','🎊','🎈','🎁','🚀','🛸','💎','🔐','⚡','🌍','🌈','☀️','🌙','⚽','🎵','🎶','🎬','📸','📱','💻','⌨️','🖥️','🖨️','📡','🔧','⚙️','🧰','📊','📈','📉','📋','📌','📍','✂️','🔗','🧩','🎯','🎲','♟️','🎭','🎨','🎪','🎤','🎧','🎼','🎹','🎮','🕹️','🎰','🎳','♠️','♥️','♦️','♣️','👑','🗿','🤖','👽','💀','☠️','🏆','🥇','🥈','🥉','🏅','🎖️'];

export default function AppPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName:'', bio:'' });
  const [showEmoji, setShowEmoji] = useState(false);
  const [notification, setNotification] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const messagesEnd = useRef<any>(null);
  const searchTimeout = useRef<any>(null);
  const emojiRef = useRef<any>(null);

  useEffect(() => { scrollToBottom(); }, [messages, posts]);
  function scrollToBottom() { setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior:'smooth' }), 100); }

  useEffect(() => {
    function handleClick(e: any) { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/'); return; }
    setToken(t);
    fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + t } }).then(r => r.json())
      .then(d => { if (d.user) { setUser(d.user); setProfileForm({ displayName: d.user.displayName || '', bio: d.user.bio || '' }); } else router.push('/'); });
    Promise.all([
      fetch('/api/channel/list', { headers: { 'Authorization': 'Bearer ' + t } }).then(r => r.json()),
      fetch('/api/superadmin/users', { headers: { 'Authorization': 'Bearer ' + t } }).then(r => r.json()),
    ]).then(([ch, us]) => { if (ch.channels) setChannels(ch.channels); if (us.users) setUsers(us.users); }).catch(() => {});
  }, []);

  function loadChannel(ch: any) {
    setActiveChannel(ch); setActiveChat(null); setReplyTo(null);
    fetch('/api/post/list?channel=' + ch._id, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {});
    if (window.innerWidth < 768) setSidebarOpen(false);
  }

  function startChat(u: any) {
    setActiveChat(u); setActiveChannel(null); setReplyTo(null); setMessages([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }

  async function sendPost() {
    if (!input.trim()) return;
    const res = await fetch('/api/post/create', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ content: input, channel: activeChannel._id, replyTo: replyTo?._id }) });
    const data = await res.json();
    if (data.post) setPosts(prev => [data.post, ...prev]);
    setInput(''); setReplyTo(null);
  }

  async function sendMessage() {
    if (!input.trim() || !activeChat) return;
    const res = await fetch('/api/chat/send', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ content: input, targetId: activeChat._id }) });
    const data = await res.json();
    if (data.message) setMessages(prev => [...prev, data.message]);
    setInput('');
  }

  async function uploadFile() {
    const files = fileInput.current?.files;
    if (!files || !files[0]) return;
    const file = files[0]; setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await fetch('/api/upload', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ fileData: base64, fileName: file.name, fileType: file.type }) });
      const data = await res.json();
      if (data.success) {
        const icon = data.file.type === 'image' ? '🖼️' : data.file.type === 'video' ? '🎬' : data.file.type === 'audio' ? '🎵' : '📎';
        setInput(prev => prev + '\n' + icon + ' ' + window.location.origin + data.file.url);
      }
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    };
    reader.readAsDataURL(file);
  }

  async function editPost(postId: string) {
    if (!editContent.trim()) return;
    await fetch('/api/post/update', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ postId, content: editContent }) });
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, content: editContent, updatedAt: new Date() } : p));
    setEditingPost(null); setEditContent('');
  }

  async function deletePost(postId: string) {
    if (!confirm('حذف شود؟')) return;
    await fetch('/api/post/delete', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ postId }) });
    setPosts(prev => prev.filter(p => p._id !== postId));
  }

  async function likePost(postId: string) {
    const res = await fetch('/api/post/like', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ postId }) });
    const data = await res.json();
    if (data.likes !== undefined) {
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, _likesCount: data.likes, _liked: data.liked } : p));
    }
  }

  async function deleteMessage(messageId: string) {
    await fetch('/api/message/delete', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ messageId }) });
    setMessages(prev => prev.filter(m => m._id !== messageId));
  }

  function addEmoji(emoji: string) { setInput(prev => prev + emoji); setShowEmoji(false); }
  function showNotif(msg: string) { setNotification(msg); setTimeout(() => setNotification(''), 3000); }

  async function doSearch(q: string) {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setSearchResults(null); return; }
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch('/api/search?q=' + encodeURIComponent(q), { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      setSearchResults(data);
    }, 300);
  }

  async function saveProfile() {
    const res = await fetch('/api/auth/profile', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify(profileForm) });
    const data = await res.json();
    if (data.user) { setUser((prev: any) => ({ ...prev, displayName: data.user.displayName, bio: data.user.bio })); showNotif('✅ پروفایل بروز شد'); }
    setShowProfileModal(false);
  }

  function renderContent(text: string) {
    if (!text) return null;
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('http')) {
        if (part.match(/\.(jpg|jpeg|png|gif|webp)/i)) return <img key={i} src={part} style={{ maxWidth:'100%', maxHeight:300, borderRadius:8, marginTop:4 }} loading="lazy" />;
        if (part.match(/\.(mp4|webm)/i)) return <video key={i} src={part} controls style={{ maxWidth:'100%', maxHeight:300, borderRadius:8, marginTop:4 }} />;
        if (part.match(/\.(mp3|ogg|wav)/i)) return <audio key={i} src={part} controls style={{ marginTop:4, width:250, maxWidth:'100%' }} />;
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color:'#7c3aed', wordBreak:'break-all' }}>{part}</a>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  if (!user) return <div style={{ padding:40, textAlign:'center', color:'#6b7280' }}>⏳ لطفاً صبر کنید...</div>;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', flexDirection:'column' }}>
      <Head><title>Gerd — {user.displayName || user.username}</title></Head>

      {notification && <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:9999, background:'#7c3aed', color:'white', padding:'10px 24px', borderRadius:12, boxShadow:'0 4px 20px rgba(0,0,0,0.4)', fontSize:14, animation:'fadeIn 0.3s' }}>{notification}</div>}

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} style={{ display: window.innerWidth < 768 ? 'block' : 'none', position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:5 }} />}

        <aside className="sidebar" style={{ width:260, background:'#1e1e2e', borderLeft:'1px solid #313244', display:'flex', flexDirection:'column', flexShrink:0, position: window.innerWidth < 768 ? 'fixed' : 'relative', zIndex:10, right: sidebarOpen ? 0 : '-280px', transition:'0.3s', height:'100%' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #313244', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontWeight:700, color:'#7c3aed', fontSize:18 }}>🌐 <span className="logotext">Gerd</span></span>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <button onClick={() => { setShowProfileModal(true); setProfileForm({ displayName: user.displayName || '', bio: user.bio || '' }); }}
                style={{ width:32, height:32, borderRadius:'50%', background:'#7c3aed', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', border:'none' }}>
                {user.displayName?.[0] || 'U'}
              </button>
              <button onClick={() => router.push('/admin')} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:16 }}>⚙️</button>
            </div>
          </div>

          <div style={{ padding:'8px 12px' }}>
            <input placeholder="🔍 جستجوی پیام و کاربر..." value={searchQuery} onChange={e => doSearch(e.target.value)}
              style={{ width:'100%', background:'#0d1117', border:'1px solid #313244', borderRadius:8, padding:'8px 12px', color:'#e0e0e0', fontSize:13 }} />
            {searchResults && searchQuery.length >= 2 && (
              <div style={{ position:'absolute', width:236, background:'#1e1e2e', border:'1px solid #313244', borderRadius:8, marginTop:4, maxHeight:200, overflow:'auto', zIndex:20 }}>
                {searchResults.posts?.length > 0 && <div style={{ padding:'8px', fontSize:12, color:'#7c3aed' }}>📝 پست‌ها</div>}
                {searchResults.posts?.slice(0,3).map((p: any) => (
                  <div key={p._id} style={{ padding:'6px 10px', fontSize:12, color:'#a0a0b0', cursor:'pointer', wordBreak:'break-all' }}
                    onClick={() => { setSearchQuery(''); setSearchResults(null); }}>{p.content?.slice(0, 60)}...</div>
                ))}
                {searchResults.users?.length > 0 && <div style={{ padding:'8px', fontSize:12, color:'#7c3aed' }}>👤 کاربران</div>}
                {searchResults.users?.map((u: any) => (
                  <div key={u._id} style={{ padding:'6px 10px', fontSize:12, color:'#a0a0b0', cursor:'pointer' }}>@{u.username}</div>
                ))}
                {(!searchResults.posts?.length && !searchResults.users?.length) && <div style={{ padding:8, fontSize:12, color:'#6b7280', textAlign:'center'}}>نتیجه‌ای نیست</div>}
              </div>
            )}
          </div>

          <div style={{ display:'flex', padding:'0 12px 8px', gap:4 }}>
            <button onClick={() => setTab('channels')} style={tabBtn(tab==='channels')}>📢 کانال‌ها</button>
            <button onClick={() => setTab('chats')} style={tabBtn(tab==='chats')}>💬 چت</button>
          </div>

          <div style={{ flex:1, overflow:'auto', padding:'0 8px' }}>
            {tab === 'channels' && (<>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 8px', marginBottom:4 }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>کانال‌ها</span>
                {(user.role === 'admin' || user.role === 'superadmin') && <button onClick={() => setShowCreateChannel(true)} style={{ background:'none', border:'none', color:'#7c3aed', cursor:'pointer', fontSize:16 }}>+</button>}
              </div>
              {channels.map((ch:any) => (
                <div key={ch._id} onClick={() => loadChannel(ch)} style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, background: activeChannel?._id === ch._id ? '#7c3aed33' : 'transparent', color: activeChannel?._id === ch._id ? '#7c3aed' : '#a0a0b0', fontSize:14 }}>
                  # {ch.name} {ch.type === 'announcement' ? '📢' : ''}
                </div>
              ))}
            </>)}
            {tab === 'chats' && (<>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:6, padding:'4px 8px' }}>کاربران</div>
              {users.filter((u:any) => u._id !== user._id).map((u:any) => (
                <div key={u._id} onClick={() => startChat(u)} style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, display:'flex', alignItems:'center', gap:8, background: activeChat?._id === u._id ? '#7c3aed33' : 'transparent', color:'#a0a0b0', fontSize:14 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background: u.isOnline ? '#22c55e' : '#6b7280', display:'inline-block', flexShrink:0 }} />
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.displayName || u.username}</span>
                </div>
              ))}
            </>)}
          </div>

          <div style={{ padding:'8px 16px', borderTop:'1px solid #313244', fontSize:12, color:'#6b7280', display:'flex', justifyContent:'space-between' }}>
            <span>@{user.username}</span>
            <a href="https://t.me/llllxyz" target="_blank" rel="noopener noreferrer" style={{ color:'#7c3aed', textDecoration:'none' }}>پشتیبانی</a>
          </div>
        </aside>

        <main style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          <div className="mheader" style={{ display:'none', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid #313244', gap:8 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', color:'#a0a0b0', cursor:'pointer', fontSize:22 }}>☰</button>
            <span style={{ color:'#7c3aed', fontWeight:600 }}>{activeChannel ? '# ' + activeChannel.name : activeChat ? '💬 ' + (activeChat.displayName || activeChat.username) : '🌐 Gerd'}</span>
          </div>

          {activeChannel && (<>
            <div style={{ padding:'10px 20px', borderBottom:'1px solid #313244' }}>
              <h2 style={{ fontSize:16, color:'#7c3aed', margin:0 }}># {activeChannel.name}</h2>
              <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{activeChannel.description}</p>
            </div>
            <div style={{ flex:1, overflow:'auto', padding:16 }}>
              {posts.filter(p => p.isPinned).slice(0,2).map((p:any) => (
                <div key={p._id} style={{ padding:'6px 12px', background:'#7c3aed11', border:'1px solid #7c3aed33', borderRadius:8, marginBottom:8, fontSize:13 }}>📌 {p.content?.slice(0,100)}</div>
              ))}
              {posts.map((post:any) => (
                <div key={post._id} style={{ padding:'12px 16px', background:'#1e1e2e', border:'1px solid #313244', borderRadius:8, marginBottom:8 }}>
                  {post.isPinned && <div style={{ fontSize:11, color:'#7c3aed', marginBottom:4 }}>📌 پین شده</div>}
                  {post.replyTo && <div style={{ fontSize:12, color:'#6b7280', padding:'4px 8px', background:'#0d1117', borderRadius:4, marginBottom:6 }}>↪️ پاسخ به پیام</div>}
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{post.author?.displayName || post.author?.username}</span>
                    <span style={{ fontSize:11, color:'#6b7280' }}>{new Date(post.createdAt).toLocaleString('fa-IR')}</span>
                    {post.updatedAt && <span style={{ fontSize:11, color:'#6b7280' }}>✏️</span>}
                    {post.author?._id === user._id && <span style={{ marginRight:'auto', display:'flex', gap:4 }}>
                      <button onClick={() => { setEditingPost(post._id); setEditContent(post.content); }} style={{ background:'none', border:'none', color:'#a0a0b0', cursor:'pointer' }}>✏️</button>
                      <button onClick={() => deletePost(post._id)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}>🗑️</button>
                    </span>}
                  </div>
                  {editingPost === post._id ? (
                    <div><textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width:'100%', background:'#0d1117', border:'1px solid #313244', borderRadius:8, padding:8, color:'#e0e0e0', fontSize:14, minHeight:60 }} />
                    <button onClick={() => editPost(post._id)} style={{ background:'#7c3aed', color:'white', border:'none', padding:'4px 12px', borderRadius:6, cursor:'pointer', marginTop:4, marginLeft:4 }}>ذخیره</button>
                    <button onClick={() => setEditingPost(null)} style={{ background:'#6b7280', color:'white', border:'none', padding:'4px 12px', borderRadius:6, cursor:'pointer', marginTop:4 }}>لغو</button></div>
                  ) : (<>
                    <p style={{ fontSize:14, lineHeight:1.7, margin:0, wordBreak:'break-word' }}>{renderContent(post.content)}</p>
                    <div style={{ display:'flex', gap:12, marginTop:8, alignItems:'center', flexWrap:'wrap' }}>
                      <button onClick={() => likePost(post._id)} style={{ background:'none', border:'none', color:'#a0a0b0', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:4 }}>❤️ {post._likesCount ?? post.likes?.length ?? 0}</button>
                      <button onClick={() => setReplyTo(post)} style={{ background:'none', border:'none', color:'#a0a0b0', cursor:'pointer', fontSize:13 }}>↪️ پاسخ</button>
                      {(user.role === 'admin' || user.role === 'superadmin') && <button onClick={async() => {
                        await fetch('/api/post/update', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ postId:post._id, isPinned:!post.isPinned }) });
                        loadChannel(activeChannel);
                      }} style={{ background:'none', border:'none', color:'#a0a0b0', cursor:'pointer', fontSize:13 }}>📌 {post.isPinned ? 'آزاد' : 'پین'}</button>}
                    </div>
                  </>)}
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>
            <div style={{ padding:'10px 16px', borderTop:'1px solid #313244', background:'#0d1117' }}>
              {replyTo && <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 8px', fontSize:12, color:'#7c3aed', marginBottom:4 }}>
                ↪️ پاسخ به {replyTo.author?.displayName}: {replyTo.content?.slice(0,30)}...
                <button onClick={() => setReplyTo(null)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}>✕</button>
              </div>}
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="file" ref={fileInput} onChange={uploadFile} style={{ display:'none' }} />
                <button onClick={() => fileInput.current?.click()} disabled={uploading} style={{ background:'none', border:'none', color:'#7c3aed', cursor:'pointer', fontSize:18, flexShrink:0 }} title="آپلود">{uploading ? '⏳' : '📎'}</button>
                <div style={{ position:'relative' }}>
                  <button onClick={() => setShowEmoji(!showEmoji)} style={{ background:'none', border:'none', color:'#a0a0b0', cursor:'pointer', fontSize:18, flexShrink:0 }}>😊</button>
                  {showEmoji && <div ref={emojiRef} style={{ position:'absolute', bottom:40, left:0, background:'#1e1e2e', border:'1px solid #313244', borderRadius:12, padding:8, width:280, maxHeight:200, overflow:'auto', zIndex:30, display:'flex', flexWrap:'wrap', gap:2 }}>
                    {EMOJIS.map(e => <span key={e} onClick={() => addEmoji(e)} style={{ cursor:'pointer', fontSize:20, padding:2, borderRadius:4 }}>{e}</span>)}
                  </div>}
                </div>
                <input placeholder="پیامت رو بنویس..." value={input} onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendPost()}
                  style={{ flex:1, background:'#1e1e2e', border:'1px solid #313244', borderRadius:24, padding:'10px 14px', color:'#e0e0e0', fontSize:14 }} />
                <button onClick={sendPost} style={{ background:'#7c3aed', color:'white', border:'none', borderRadius:'50%', width:38, height:38, cursor:'pointer', fontSize:16, flexShrink:0 }}>➤</button>
              </div>
            </div>
          </>)}

          {activeChat && (<>
            <div style={{ padding:'10px 20px', borderBottom:'1px solid #313244' }}><h2 style={{ fontSize:16, margin:0 }}>💬 {activeChat.displayName || activeChat.username}</h2></div>
            <div style={{ flex:1, overflow:'auto', padding:16 }}>
              {messages.map((m:any) => (
                <div key={m._id} style={{ marginBottom:8, textAlign: m.sender?._id === user._id ? 'left' : 'right' }}>
                  {m.sender?._id !== user._id && <span style={{ fontSize:11, color:'#6b7280', display:'block', marginBottom:2 }}>{m.sender?.displayName || m.sender?.username}</span>}
                  <div style={{ display:'inline-block', background: m.sender?._id === user._id ? '#7c3aed' : '#1e1e2e', color: m.sender?._id === user._id ? 'white' : '#e0e0e0', padding:'8px 14px', borderRadius:14, fontSize:14, maxWidth:'85%', wordBreak:'break-word' }}>
                    {renderContent(m.content)}
                  </div>
                  {m.sender?._id === user._id && <button onClick={() => deleteMessage(m._id)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:12, marginRight:4 }} title="حذف">✕</button>}
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>
            <div style={{ padding:'10px 16px', borderTop:'1px solid #313244', display:'flex', gap:8 }}>
              <input placeholder="پیام..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()}
                style={{ flex:1, background:'#1e1e2e', border:'1px solid #313244', borderRadius:24, padding:'10px 14px', color:'#e0e0e0', fontSize:14 }} />
              <button onClick={sendMessage} style={{ background:'#7c3aed', color:'white', border:'none', borderRadius:'50%', width:38, height:38, cursor:'pointer', fontSize:16, flexShrink:0 }}>➤</button>
            </div>
          </>)}

          {!activeChannel && !activeChat && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', color:'#6b7280', padding:20, textAlign:'center' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🌐</div>
              <h2 style={{ color:'#7c3aed', margin:0 }}>خوش آمدی {user.displayName || user.username}!</h2>
              <p style={{ marginTop:8 }}>یه کانال انتخاب کن یا با یکی از کاربرا چت کن</p>
              {(user.role === 'admin' || user.role === 'superadmin') && <button onClick={() => setShowCreateChannel(true)} style={{ marginTop:16, background:'#7c3aed', color:'white', border:'none', padding:'10px 24px', borderRadius:8, cursor:'pointer' }}>➕ کانال جدید</button>}
            </div>
          )}
        </main>
      </div>

      {showProfileModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100 }} onClick={() => setShowProfileModal(false)}>
          <div style={{ background:'#1e1e2e', borderRadius:16, padding:24, width:'90%', maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color:'#7c3aed', marginBottom:16 }}>👤 پروفایل</h2>
            <label style={{ fontSize:13, color:'#6b7280', display:'block', marginBottom:4 }}>نام نمایشی</label>
            <input value={profileForm.displayName} onChange={e => setProfileForm({...profileForm, displayName:e.target.value})} style={s} />
            <label style={{ fontSize:13, color:'#6b7280', display:'block', marginBottom:4, marginTop:12 }}>بیوگرافی</label>
            <textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio:e.target.value})} style={{...s, minHeight:80, resize:'vertical' }} />
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button onClick={saveProfile} style={btn}>💾 ذخیره</button>
              <button onClick={() => setShowProfileModal(false)} style={{...btn, background:'#313244' }}>لغو</button>
            </div>
          </div>
        </div>
      )}

      {showCreateChannel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100 }} onClick={() => setShowCreateChannel(false)}>
          <div style={{ background:'#1e1e2e', borderRadius:16, padding:24, width:'90%', maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color:'#7c3aed', marginBottom:16 }}>➕ کانال جدید</h2>
            <input placeholder="نام کانال" value={newChannel.name} onChange={e => setNewChannel({...newChannel, name:e.target.value})} style={s} />
            <input placeholder="توضیحات" value={newChannel.description} onChange={e => setNewChannel({...newChannel, description:e.target.value})} style={s} />
            <select value={newChannel.type} onChange={e => setNewChannel({...newChannel, type:e.target.value})} style={s}>
              <option value="text">📝 متنی</option><option value="announcement">📢 اعلامیه</option>
            </select>
            <button onClick={async() => {
              if (!newChannel.name) return;
              const res = await fetch('/api/channel/create', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify(newChannel) });
              const d = await res.json();
              if (d.channel) { setChannels(prev => [...prev, d.channel]); setShowCreateChannel(false); setNewChannel({ name:'', description:'', type:'text' }); }
            }} style={{...btn, marginTop:12, width:'100%' }}>✅ ایجاد</button>
          </div>
        </div>
      )}

      <footer style={{ textAlign:'center', padding:'6px', fontSize:11, color:'#6b7280', borderTop:'1px solid #313244', background:'#0d1117', flexShrink:0 }}>
        ساخته شده با ❤️ توسط <a href="https://t.me/llllxyz" target="_blank" rel="noopener noreferrer" style={{ color:'#7c3aed', textDecoration:'none' }}>Mohammad</a>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { position: fixed !important; z-index: 10; right: 0; height: 100%; }
          .logotext { display: none; }
          .mheader { display: flex !important; }
          .overlay { display: block !important; }
        }
        @media (min-width: 769px) {
          .mheader { display: none !important; }
          .overlay { display: none !important; }
        }
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(-10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}

const s: any = { background:'#11111b', border:'1px solid #313244', borderRadius:8, padding:'10px 14px', color:'#e0e0e0', width:'100%', marginBottom:8, display:'block', fontSize:14 };
const tabBtn = (active: boolean) => ({ flex:1, padding:'6px', borderRadius:6, border:'none', cursor:'pointer', background: active ? '#7c3aed33' : 'transparent', color: active ? '#7c3aed' : '#6b7280', fontSize:12, fontWeight:600 });
const btn: any = { background:'#7c3aed', color:'white', border:'none', padding:'10px 20px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13 };
