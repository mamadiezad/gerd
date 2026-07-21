import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/'); return; }
    setToken(t);
    fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + t } })
      .then(r => r.json()).then(d => { if (!d.user || d.user.role === 'member') router.push('/app'); setUser(d.user); });
    fetch('/api/superadmin/users', { headers: { 'Authorization': 'Bearer ' + t } })
      .then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  async function toggleRole(userId: string, newRole: string) {
    await fetch('/api/superadmin/users/role', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ userId, role: newRole }),
    });
    setUsers(prev => prev.map((u:any) => u._id === userId ? { ...u, role: newRole } : u));
  }

  async function deleteUser(userId: string) {
    if (!confirm('حذف شود؟')) return;
    await fetch('/api/superadmin/users/remove', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ userId }),
    });
    setUsers(prev => prev.filter((u:any) => u._id !== userId));
  }

  return (
    <>
    <div style={{ padding:24, maxWidth:800, margin:'0 auto' }}>
      <Head><title>Gerd — پنل مدیریت</title></Head>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ color:'#7c3aed', margin:0, fontSize:24 }}>⚙️ پنل مدیریت</h1>
          <p style={{ color:'#6b7280', fontSize:13 }}>مدیریت کاربران و تنظیمات Gerd</p>
        </div>
        <button onClick={() => router.push('/app')} style={{ background:'#1e1e2e', border:'1px solid #313244', color:'#a0a0b0', padding:'8px 16px', borderRadius:8, cursor:'pointer' }}>🔙 بازگشت</button>
      </div>

      <div style={{ background:'#1e1e2e', border:'1px solid #313244', borderRadius:12, padding:20 }}>
        <h2 style={{ fontSize:16, marginBottom:16 }}>👥 کاربران ({users.length})</h2>
        <div style={{ display:'grid', gap:8 }}>
          {users.map((u:any) => (
            <div key={u._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#0d1117', borderRadius:8 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{u.displayName || u.username}</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>{u.email} — نقش: <span style={{ color: u.role === 'superadmin' ? '#7c3aed' : u.role === 'admin' ? '#22c55e' : '#a0a0b0' }}>{u.role}</span></div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {user?.role === 'superadmin' && u.role !== 'superadmin' && (
                  <>
                    <button onClick={() => toggleRole(u._id, u.role === 'admin' ? 'member' : 'admin')} style={btnStyle}>
                      {u.role === 'admin' ? '⬇ تنزل' : '⬆ ارتقا'}
                    </button>
                    <button onClick={() => deleteUser(u._id)} style={{...btnStyle, background:'#ef4444'}}>🗑 حذف</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'#1e1e2e', border:'1px solid #313244', borderRadius:12, padding:20, marginTop:16 }}>
        <h2 style={{ fontSize:16, marginBottom:12 }}>ℹ️ اطلاعات سیستم</h2>
        <p style={{ fontSize:13, color:'#6b7280' }}>نام پلتفرم: Gerd</p>
        <p style={{ fontSize:13, color:'#6b7280' }}>تعداد کاربران: {users.length}</p>
        <p style={{ fontSize:13, color:'#6b7280' }}>پشتیبانی: <a href="https://t.me/llllxyz" style={{ color:'#7c3aed' }}>@llllxyz</a></p>
      </div>
    </div>


      <footer style={{ textAlign:"center", padding:8, fontSize:11, color:"#6b7280", borderTop:"1px solid #313244", marginTop:20 }}>
        ساخته شده با ❤️ توسط <a href="https://t.me/llllxyz" style={{ color:"#7c3aed" }}>Mohammad</a>
      </footer>
    </>
  );
}
const btnStyle: any = { background:'#7c3aed', color:'white', border:'none', padding:'4px 12px', borderRadius:6, cursor:'pointer', fontSize:12 };
