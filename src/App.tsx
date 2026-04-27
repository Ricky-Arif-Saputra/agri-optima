import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { 
  signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from 'firebase/auth';
import { SimplexSolver } from './lib/simplex';
import { 
  Leaf, Calculator, ShoppingBag, Store, User, 
  LogOut, Plus, Trash2, Download, Archive, 
  MessageCircle, CreditCard, ChevronRight, Clock
} from 'lucide-react';

// --- TAMPILAN COMPONENT KECIL ---
const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'petani' | 'pembeli'>('petani');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('optimasi');

  // State Optimasi
  const [tanaman, setTanaman] = useState([{ nama: 'Padi', harga: 15000 }]);
  const [kendala, setKendala] = useState([{ nama: 'Lahan', koef: [1], tanda: '<=', target: 10 }]);
  const [hasil, setHasil] = useState<any>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) { alert("Login Gagal: " + err.message); }
  };

  const tambahTanaman = () => {
    setTanaman([...tanaman, { nama: '', harga: 0 }]);
    setKendala(kendala.map(k => ({ ...k, koef: [...k.koef, 0] })));
  };

  const tambahKendala = () => {
    setKendala([...kendala, { nama: '', koef: tanaman.map(() => 0), tanda: '<=', target: 0 }]);
  };

  // --- HALAMAN LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9FBF9] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-green-50">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-yellow-400 p-4 rounded-3xl mb-4 shadow-lg shadow-yellow-100">
              <Leaf className="text-green-800 w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-green-900">AGRI OPTIMA</h1>
            <p className="text-gray-400 text-xs font-bold tracking-[0.2em] uppercase mt-2">Professional Farming System</p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
            <button onClick={() => setRole('petani')} className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${role === 'petani' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>PETANI</button>
            <button onClick={() => setRole('pembeli')} className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${role === 'pembeli' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>PEMBELI</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-green-500 text-sm" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-green-500 text-sm" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full bg-yellow-400 text-green-900 py-4 rounded-2xl font-black hover:bg-yellow-500 transition shadow-lg shadow-yellow-200">MASUK SEKARANG</button>
          </form>
        </div>
      </div>
    );
  }

  // --- TAMPILAN DASHBOARD (MOBILE RESPONSIVE) ---
  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24 md:pb-0 md:pl-64 font-sans">
      
      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:w-64 bg-white border-t md:border-r border-gray-100 z-50 flex md:flex-col justify-around md:justify-start p-2 md:p-6">
        <div className="hidden md:flex items-center gap-3 mb-10 px-2">
          <div className="bg-yellow-400 p-2 rounded-lg"><Leaf size={20} className="text-green-800"/></div>
          <span className="font-black text-green-900 text-xl tracking-tighter">AGRI OPTIMA</span>
        </div>
        
        <NavItem active={activeTab === 'optimasi'} icon={<Calculator/>} label="Optimasi" onClick={() => setActiveTab('optimasi')} hide={role === 'pembeli'} />
        <NavItem active={activeTab === 'uber'} icon={<ShoppingBag/>} label="Uber Tani" onClick={() => setActiveTab('uber')} hide={role === 'pembeli'} />
        <NavItem active={activeTab === 'hilirisasi'} icon={<Store/>} label="Hilirisasi" onClick={() => setActiveTab('hilirisasi')} />
        
        <div className="md:mt-auto flex items-center gap-2 p-2">
          <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-red-500 font-bold text-sm"><LogOut size={18}/> <span className="hidden md:block">Keluar</span></button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="p-4 md:p-10 max-w-5xl">
        
        {/* FITUR 1: OPTIMASI LABA */}
        {activeTab === 'optimasi' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
            <header>
              <h2 className="text-2xl font-black text-gray-900">Optimasi Laba</h2>
              <p className="text-gray-500 text-sm">Hitung keuntungan maksimal dengan metode Simplex.</p>
            </header>

            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-green-800 uppercase text-xs tracking-widest">Fungsi Tujuan (Tanaman)</h3>
                <button onClick={tambahTanaman} className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold">+ Tanaman</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tanaman.map((t, i) => (
                  <div key={i} className="flex gap-2 bg-gray-50 p-3 rounded-2xl">
                    <input placeholder="Nama" className="flex-1 bg-transparent border-none text-sm font-bold" value={t.nama} onChange={e => {const n=[...tanaman]; n[i].nama=e.target.value; setTanaman(n)}} />
                    <input type="number" placeholder="Harga/ton" className="w-24 bg-white px-3 py-1 rounded-xl text-sm border-none shadow-sm" onChange={e => {const n=[...tanaman]; n[i].harga=Number(e.target.value); setTanaman(n)}} />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-green-800 uppercase text-xs tracking-widest">Fungsi Kendala</h3>
                <button onClick={tambahKendala} className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold">+ Kendala</button>
              </div>
              <div className="space-y-4">
                {kendala.map((k, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-3">
                    <input placeholder="Nama Kendala (ex: Modal Benih)" className="w-full bg-transparent font-bold text-gray-700" value={k.nama} onChange={e => {const n=[...kendala]; n[i].nama=e.target.value; setKendala(n)}} />
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      {tanaman.map((t, ti) => (
                        <div key={ti} className="flex items-center gap-1 bg-white p-2 rounded-lg shadow-sm">
                          <span className="text-gray-400">{t.nama || 'T'+(ti+1)}:</span>
                          <input type="number" className="w-12 font-bold" onChange={e => {const n=[...kendala]; n[i].koef[ti]=Number(e.target.value); setKendala(n)}} />
                        </div>
                      ))}
                      <select className="bg-white p-2 rounded-lg font-bold shadow-sm" onChange={e => {const n=[...kendala]; n[i].tanda=e.target.value; setKendala(n)}}>
                        <option value="<=">&le;</option>
                        <option value="=">=</option>
                        <option value=">=">&ge;</option>
                      </select>
                      <input type="number" placeholder="Target" className="w-20 bg-white p-2 rounded-lg font-black text-green-600 shadow-sm" onChange={e => {const n=[...kendala]; n[i].target=Number(e.target.value); setKendala(n)}} />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setHasil(SimplexSolver.solve(tanaman.map(t=>t.harga), kendala.map(k=>({coeffs:k.koef, type:k.tanda, target:k.target}))))} className="w-full mt-6 bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-100 hover:scale-[1.02] transition-transform">HITUNG OPTIMASI</button>
            </Card>

            {hasil && (
              <div className="bg-green-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold">Hasil Rekomendasi</h3>
                    <div className="flex gap-2">
                      <button className="bg-white/10 p-2 rounded-xl"><Download size={20}/></button>
                      <button className="bg-white/10 p-2 rounded-xl"><Archive size={20}/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {tanaman.map((t, idx) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-green-300 text-[10px] font-bold uppercase tracking-widest mb-1">{t.nama}</p>
                        <p className="text-3xl font-black">{hasil.variables[idx]?.toFixed(2)} <span className="text-sm font-normal">Ha</span></p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-green-300 text-sm mb-1">Total Laba Maksimal:</p>
                    <p className="text-4xl font-black text-yellow-400">Rp {hasil.result.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FITUR 2: UBER TANI */}
        {activeTab === 'uber' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black">Uber Tani</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UberOption title="Beli Bahan" icon={<ShoppingBag/>} badge="Grup/Individu" color="bg-blue-500" />
              <UberOption title="Pesan Alat" icon={<CreditCard/>} badge="Sewa Harian" color="bg-orange-500" />
              <UberOption title="Jasa Tani" icon={<User/>} badge="Manajemen Orang" color="bg-green-500" />
            </div>
            
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold">Transaksi Aktif</h4>
                <MessageCircle className="text-green-600 cursor-pointer"/>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center font-bold">QR</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Pupuk NPK (Grup)</p>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                      <div className="bg-green-500 w-3/4 h-full rounded-full"></div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400"/>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* FITUR 3: HILIRISASI */}
        {activeTab === 'hilirisasi' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black">Hilirisasi</h2>
                {role === 'petani' && <button className="bg-yellow-400 text-green-900 px-4 py-2 rounded-xl font-bold text-sm">Upload Panen</button>}
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ProductCard name="Beras Pandan Wangi" price="15.000/kg" />
                <ProductCard name="Jagung Manis" price="9.000/kg" />
             </div>
          </div>
        )}

      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---
function NavItem({ icon, label, active, onClick, hide }: any) {
  if (hide) return null;
  return (
    <button onClick={onClick} className={`flex flex-col md:flex-row items-center gap-3 p-3 md:px-4 md:py-4 rounded-2xl transition-all ${active ? 'bg-green-600 text-white shadow-xl shadow-green-100 scale-105' : 'text-gray-400 hover:bg-gray-50'}`}>
      {icon} <span className="text-[10px] md:text-sm font-bold">{label}</span>
    </button>
  );
}

function UberOption({ title, icon, badge, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-50 hover:border-green-200 transition-all cursor-pointer group shadow-sm">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:rotate-12 transition-transform`}>{icon}</div>
      <h4 className="font-black text-gray-800 text-lg">{title}</h4>
      <span className="text-[10px] font-black uppercase text-gray-400">{badge}</span>
    </div>
  );
}

function ProductCard({ name, price }: any) {
  return (
    <Card className="overflow-hidden group cursor-pointer">
      <div className="h-32 bg-gray-100 group-hover:scale-110 transition-transform"></div>
      <div className="p-4">
        <h5 className="font-bold text-sm text-gray-800">{name}</h5>
        <p className="text-green-600 font-black text-lg">{price}</p>
        <button className="w-full mt-3 bg-gray-900 text-white py-2 rounded-xl text-xs font-bold">BELI</button>
      </div>
    </Card>
  );
}