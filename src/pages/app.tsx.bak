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
      .then(r => r.json()).then(d => { if (d.user) setUser(d.user); else router.push('/'); }).catch(() => router.push('/'));
    fetch('/api/channel/list', { headers: { 'Authorization': 'Bearer ' + t } })
      .then(r => r.json()).then(d => setChannels(d.channels || [])).catch(() => {});
    fetch('/api/superadmin/users', { headers: { 'Authorization': 'Bearer ' + t } })
      .then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  function loadChannel(ch: any) {
    setActiveChannel(ch);
    setActiveChat(null);
    const token = localStorage.getItem('token');
    fetch(`/api/post/list?channel=${ch._id}`, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {});
  }

  function startChat(u: any) {
    setActiveChat(u);
    setActiveChannel(null);
  }

  async function sendPost() {
    if (!input.trim() || !activeChannel) return;
    const res = await fetch('/api/post/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ content: input, channel: activeChannel._id }),
    });
    const data = await res.json();
    if (data.post) setPosts(prev => [data.post, ...prev]);
    setInput('');
  }

  async function sendMessage() {
    if (!input.trim() || !activeChat) return;
    const res = await fetch('/api/chat/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ content: input, targetId: activeChat._id }),
    });
    const data = await res.json();
    if (data.message) setMessages(prev => [...prev, data.message]);
    setInput('');
  }

  async function createChannel() {
    if (!newChannel.name) return;
    const res = await fetch('/api/channel/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(newChannel),
    });
    const data = await res.json();
    if (data.channel) { setChannels(prev => [...prev, data.channel]); setShowCreateChannel(false); setNewChannel({ name:'', description:'', type:'text' }); }
  }

  if (!user) return <div style={{ padding:40, textAlign:'center', color:'#6b7280' }}>در حال بارگذاری...</div>;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Head><title>Gerd — {user.displayName || user.username}</title></Head>

      {/* Sidebar */}
      <aside style={{ width:240, background:'#1e1e2e', borderLeft:'1px solid #313244', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:16, borderBottom:'1px solid #313244', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div><span style={{ fontWeight:700, color:'#7c3aed' }}>🌐 Gerd</span></div>
          <div style={{ position:'relative' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'#7c3aed', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}
              onClick={() => router.push('/admin')}>{user.displayName?.[0] || 'U'}</div>
          </div>
        </div>

        <div style={{ display:'flex', padding:8, gap:4 }}>
          <button onClick={() => setTab('channels')} style={tabBtn(tab==='channels')}>📢 کانال‌ها</button>
          <button onClick={() => setTab('chats')} style={tabBtn(tab==='chats')}>💬 چت</button>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:8 }}>
          {tab === 'channels' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, padding:'4px 8px' }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>کانال‌ها</span>
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <button onClick={() => setShowCreateChannel(true)} style={{ background:'none', border:'none', color:'#7c3aed', cursor:'pointer', fontSize:18 }}>+</button>
                )}
              </div>
              {channels.map((ch:any) => (
                <div key={ch._id} onClick={() => loadChannel(ch)}
                  style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer', marginBottom:2,
                    background: activeChannel?._id === ch._id ? '#7c3aed33' : 'transparent',
                    color: activeChannel?._id === ch._id ? '#7c3aed' : '#a0a0b0', fontSize:14 }}>
                  # {ch.name}
                </div>
              ))}
            </>
          )}
          {tab === 'chats' && (
            <>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:8, padding:'4px 8px' }}>کاربران آنلاین</div>
              {users.filter((u:any) => u._id !== user._id).map((u:any) => (
                <div key={u._id} onClick={() => startChat(u)}
                  style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, display:'flex', alignItems:'center', gap:8,
                    background: activeChat?._id === u._id ? '#7c3aed33' : 'transparent', color:'#a0a0b0', fontSize:14 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background: u.isOnline ? '#22c55e' : '#6b7280', display:'inline-block' }} />
                  <span>{(u as any).displayName || (u as any).username}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ padding:'10px 16px', borderTop:'1px solid #313244', fontSize:12, color:'#6b7280', display:'flex', justifyContent:'space-between' }}>
          <span>@{user.username}</span>
          <a href="https://t.me/llllxyz" style={{ color:'#7c3aed', fontSize:11 }}>پشتیبانی</a>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, display:'flex', flexDirection:'column' }}>
        {/* Channel View */}
        {activeChannel && (
          <>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #313244' }}>
              <h2 style={{ fontSize:16, color:'#7c3aed', margin:0 }}># {activeChannel.name}</h2>
              <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{activeChannel.description}</p>
            </div>
            <div style={{ flex:1, overflow:'auto', padding:16 }}>
              {posts.map((post:any) => (
                <div key={post._id} style={{ padding:'12px 16px', background:'#1e1e2e', border:'1px solid #313244', borderRadius:8, marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{(post as any).author?.displayName || (post as any).author?.username || 'کاربر'}</span>
                    <span style={{ fontSize:11, color:'#6b7280' }}>{new Date(post.createdAt).toLocaleDateString('fa-IR')}</span>
                  </div>
                  <p style={{ fontSize:14, lineHeight:1.7, margin:0 }}>{post.content}</p>
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>
            <div style={{ padding:'12px 16px', borderTop:'1px solid #313244', display:'flex', gap:8 }}>
              <input placeholder="پیامت رو بنویس..." value={input} onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendPost()}
                style={{ flex:1, background:'#1e1e2e', border:'1px solid #313244', borderRadius:24, padding:'10px 16px', color:'#e0e0e0', fontSize:14 }} />
              <button onClick={sendPost} style={{ background:'#7c3aed', color:'white', border:'none', borderRadius:'50%', width:40, height:40, cursor:'pointer', fontSize:16 }}>➤</button>
            </div>
          </>
        )}

        {/* Chat View */}
        {activeChat && (
          <>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #313244' }}>
              <h2 style={{ fontSize:16, margin:0 }}>💬 {(activeChat as any).displayName || (activeChat as any).username}</h2>
            </div>
            <div style={{ flex:1, overflow:'auto', padding:16 }}>
              {messages.map((m:any) => (
                <div key={m._id} style={{ marginBottom:8, textAlign: m.sender?._id === user._id ? 'left' : 'right' }}>
                  <div style={{ display:'inline-block', background: m.sender?._id === user._id ? '#7c3aed' : '#1e1e2e', color: m.sender?._id === user._id ? 'white' : '#e0e0e0', padding:'8px 14px', borderRadius:14, fontSize:14, maxWidth:'70%' }}>
                    {m.content}
                  </div>
                  <div ref={messagesEnd} />
                </div>
              ))}
            </div>
            <div style={{ padding:'12px 16px', borderTop:'1px solid #313244', display:'flex', gap:8 }}>
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
            <p style={{ marginTop:8 }}>یک کانال انتخاب کن یا با یکی از کاربرا چت کن</p>
            {(user.role === 'admin' || user.role === 'superadmin') && (
              <button onClick={() => setShowCreateChannel(true)} style={{ marginTop:16, background:'#7c3aed', color:'white', border:'none', padding:'10px 24px', borderRadius:8, cursor:'pointer' }}>
                + اولین کانال رو بساز
              </button>
            )}
          </div>
        )}
      </main>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 }}
          onClick={() => setShowCreateChannel(false)}>
          <div style={{ background:'#1e1e2e', border:'1px solid #313244', borderRadius:16, padding:24, width:400 }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ color:'#7c3aed', marginBottom:16, fontSize:18 }}>کانال جدید</h2>
            <input placeholder="نام کانال" value={newChannel.name} onChange={e => setNewChannel({...newChannel, name:e.target.value})} style={s} />
            <input placeholder="توضیحات" value={newChannel.description} onChange={e => setNewChannel({...newChannel, description:e.target.value})} style={s} />
            <select value={newChannel.type} onChange={e => setNewChannel({...newChannel, type:e.target.value})} style={s}>
              <option value="text">📝 متنی</option>
              <option value="announcement">📢 اعلامیه</option>
            </select>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button onClick={createChannel} style={{ flex:1, background:'#7c3aed', color:'white', border:'none', padding:'10px', borderRadius:8, cursor:'pointer', fontWeight:600 }}>ایجاد</button>
              <button onClick={() => setShowCreateChannel(false)} style={{ flex:1, background:'#313244', color:'#a0a0b0', border:'none', padding:'10px', borderRadius:8, cursor:'pointer' }}>لغو</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: any = { background:'#11111b', border:'1px solid #313244', borderRadius:8, padding:'10px 14px', color:'#e0e0e0', width:'100%', marginBottom:8, display:'block', fontSize:14 };
const tabBtn = (active: boolean) => ({ flex:1, padding:'6px', borderRadius:6, border:'none', cursor:'pointer', background: active ? '#7c3aed33' : 'transparent', color: active ? '#7c3aed' : '#6b7280', fontSize:12, fontWeight:600 });
