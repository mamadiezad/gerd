import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState<'login'|'register'>('login');
  const [form, setForm] = useState({ email:'', username:'', password:'', inviteCode:'GERD2024' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login' ? { email: form.email, password: form.password } : form;
      const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.token) { localStorage.setItem('token', data.token); router.push('/app'); }
      else setError(data.error || 'Error');
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', display:'flex', justifyContent:'center', alignItems:'center', padding:20 }}>
      <Head><title>Gerd — ورود</title></Head>
      <div style={{ background:'#1e1e2e', border:'1px solid #313244', borderRadius:16, padding:40, maxWidth:400, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:40 }}>🌐</div>
          <h1 style={{ color:'#7c3aed', margin:0, fontSize:24 }}>Gerd</h1>
          <p style={{ color:'#6b7280', fontSize:13 }}>شبکه اجتماعی خصوصی</p>
        </div>
        <div style={{ display:'flex', marginBottom:16, background:'#0d1117', borderRadius:8, overflow:'hidden' }}>
          <button onClick={() => setTab('login')} style={{ flex:1, padding:'10px', border:'none', cursor:'pointer', background: tab==='login' ? '#7c3aed' : 'transparent', color: tab==='login' ? 'white' : '#6b7280', fontWeight:600 }}>ورود</button>
          <button onClick={() => setTab('register')} style={{ flex:1, padding:'10px', border:'none', cursor:'pointer', background: tab==='register' ? '#7c3aed' : 'transparent', color: tab==='register' ? 'white' : '#6b7280', fontWeight:600 }}>ثبت‌نام</button>
        </div>
        <form onSubmit={handleSubmit}>
          <input placeholder="ایمیل" value={form.email} onChange={e => setForm({...form, email:e.target.value})} style={s} required />
          {tab === 'register' && <input placeholder="نام کاربری" value={form.username} onChange={e => setForm({...form, username:e.target.value})} style={s} required />}
          <input type="password" placeholder="رمز عبور" value={form.password} onChange={e => setForm({...form, password:e.target.value})} style={s} required />
          {tab === 'register' && <input placeholder="کد دعوت" value={form.inviteCode} onChange={e => setForm({...form, inviteCode:e.target.value})} style={s} />}
          {error && <p style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ background:'#7c3aed', color:'white', border:'none', width:'100%', padding:'12px', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer' }}>
            {loading ? '⏳' : tab === 'login' ? '🚀 ورود' : '📝 ثبت‌نام'}
          </button>
        </form>
        <p style={{ textAlign:'center', fontSize:12, color:'#6b7280', marginTop:24 }}>
          ساخته شده با ❤️ توسط <a href="https://t.me/llllxyz" style={{ color:'#7c3aed' }}>Mohammad</a>
        </p>
      </div>
    </div>
  );
}
const s: any = { background:'#11111b', border:'1px solid #313244', borderRadius:8, padding:'10px 14px', color:'#e0e0e0', width:'100%', marginBottom:12, display:'block', fontSize:14 };
