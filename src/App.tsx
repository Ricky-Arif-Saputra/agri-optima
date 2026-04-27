import React, { useState, useEffect } from 'react';
// FIREBASE CORE
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// CONFIGURASI MILIK RICKY
const firebaseConfig = {
  apiKey: "AIzaSyAh1y1fn0VxL_juhfdsIKCyePyNSeR6z6k",
  authDomain: "agri-optima-2026.firebaseapp.com",
  projectId: "agri-optima-2026",
  storageBucket: "agri-optima-2026.firebasestorage.app",
  messagingSenderId: "263003282029",
  appId: "1:263003282029:web:6e64c721ca62abdd69bd64"
};

// INITIALIZE
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ICONS & TOOLS
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, Layers, 
  CheckCircle2, TrendingUp, Package, Box, QrCode, LogOut, 
  UserCheck, TruckIcon, X, ArrowRight 
} from 'lucide-react';
import { SimplexSolver } from './lib/simplex';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('optimasi');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [orderProgress, setOrderProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // AUTH OBSERVER
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return unsub;
  }, []);

  const handleAuth = async (type: 'login' | 'reg') => {
    try {
      if (type === 'login') await signInWithEmailAndPassword(auth, email, password);
      else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, createdAt: new Date() });
      }
    } catch (err: any) { 
      alert("Gagal: " + err.message); 
    }
  };

  // DATA MOCKUP LENGKAP
  const dataUber = {
    bahan: [{ id: 1, name: 'Pupuk NPK Pro', price: 450000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400', desc: 'Pupuk NPK untuk pertumbuhan cepat.' }],
    alat: [{ id: 2, name: 'Sewa Traktor G1000', price: 1200000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400', desc: 'Sewa harian traktor bajak sawah.' }],
    jasa: [{ id: 3, name: 'Regu Tanam Padi', price: 250000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', desc: 'Jasa tanam padi sistem borongan.' }]
  };

  const dataHilir = [
    { id: 4, name: 'Beras Premium 5kg', price: 75000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', desc: 'Beras putih poles kualitas super.' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#052E16] flex items-center justify-center p-6 font-sans text-slate-900">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 shadow-2xl">
          <div className="text-center">
            <h1 className="text-4xl font-black text-green-900 tracking-tighter italic">AGRI-OPTIMA</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Portal Pertanian Modern</p>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="Email Anda" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 ring-green-600" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 ring-green-600" onChange={e => setPassword(e.target.value)} />
            <button onClick={() => handleAuth('login')} className="w-full bg-green-700 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-green-800 transition">MASUK</button>
            <button onClick={() => handleAuth('reg')} className="w-full text-green-700 font-bold text-sm">Belum punya akun? Daftar Sekarang</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F0F5F2] font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 bg-[#052E16] text-white fixed h-full p-8 flex flex-col z-20">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-yellow-400 p-2 rounded-xl text-green-900"><Layers size={22}/></div>
          <span className="hidden lg:block font-black text-2xl tracking-tighter italic">AGRI-OPTIMA</span>
        </div>
        <nav className="space-y-3 flex-1">
          <SideBtn active={tab === 'optimasi'} icon={<Calculator/>} label="Optimasi Laba" onClick={() => setTab('optimasi')}/>
          <SideBtn active={tab === 'uber'} icon={<Truck/>} label="Uber Tani" onClick={() => setTab('uber')}/>
          <SideBtn active={tab === 'hilir'} icon={<ShoppingBag/>} label="Marketplace" onClick={() => setTab('hilir')}/>
        </nav>
        <button onClick={() => signOut(auth)} className="flex items-center gap-3 text-red-300 font-black text-xs uppercase tracking-widest hover:text-red-100 transition"><LogOut size={18}/> <span className="hidden lg:block">Keluar Akun</span></button>
      </aside>

      <main className="flex-1 ml-20 lg:ml-72 p-6 lg:p-12">
        {/* TAB UBER TANI */}
        {tab === 'uber' && (
          <div className="max-w-6xl mx-auto space-y-12">
            <header><h1 className="text-4xl font-black text-green-950 uppercase">Layanan Uber Tani</h1></header>
            
            <UberSection title="Beli Bahan Tani" icon={<Package/>} items={dataUber.bahan} onBuy={(it) => setCheckoutItem({...it, type: 'bahan', qty: 1, mode: 'langsung'})} />
            <UberSection title="Sewa Alat Modern" icon={<TrendingUp/>} items={dataUber.alat} onBuy={(it) => setCheckoutItem({...it, type: 'alat', qty: 1, duration: 1})} />
            <UberSection title="Manajemen Tani" icon={<UserCheck/>} items={dataUber.jasa} onBuy={(it) => setCheckoutItem({...it, type: 'jasa', qty: 1})} />
          </div>
        )}

        {/* TAB MARKETPLACE */}
        {tab === 'hilir' && (
          <div className="max-w-6xl mx-auto space-y-10">
            <header><h1 className="text-4xl font-black text-green-950 uppercase">Pasar Hilirisasi</h1></header>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {dataHilir.map(it => <ProductCard key={it.id} item={it} onBuy={() => setCheckoutItem({...it, type: 'hilir', qty: 1, delivery: 'antar'})} />)}
            </div>
          </div>
        )}

        {/* TAB OPTIMASI */}
        {tab === 'optimasi' && (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
              <Calculator size={80}/>
              <h2 className="text-2xl font-black uppercase">Modul Perhitungan Aktif</h2>
              <p className="font-bold">Sistem Simplex Progresif - Rp 5.000 Per Cek</p>
           </div>
        )}
      </main>

      {/* DYNAMIC CHECKOUT MODAL */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-green-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            {orderProgress === 0 ? (
              <div className="p-10 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-green-950 text-2xl uppercase">Detail Pesanan</h3>
                  <button onClick={() => setCheckoutItem(null)} className="text-slate-300 hover:text-red-500"><X size={24}/></button>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border flex gap-6 items-center">
                  <img src={checkoutItem.img} className="w-24 h-24 rounded-2xl object-cover" />
                  <div>
                    <p className="font-black text-xl text-green-900 leading-tight">{checkoutItem.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{checkoutItem.desc}</p>
                    <p className="font-black text-green-600 mt-2 text-lg">Rp {checkoutItem.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {checkoutItem.type === 'bahan' && (
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                      <button onClick={() => setCheckoutItem({...checkoutItem, mode: 'langsung'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${checkoutItem.mode === 'langsung' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400'}`}>BELI LANGSUNG</button>
                      <button onClick={() => setCheckoutItem({...checkoutItem, mode: 'grup'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${checkoutItem.mode === 'grup' ? 'bg-yellow-400 text-green-900 shadow-lg' : 'text-slate-400'}`}>GABUNG GRUP (UB)</button>
                    </div>
                  )}

                  {checkoutItem.type === 'alat' && (
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border">
                      <span className="font-black text-xs uppercase text-slate-400">Durasi Sewa (Hari)</span>
                      <input type="number" className="w-16 bg-white p-2 rounded-xl text-center font-black outline-none" value={checkoutItem.duration} onChange={e => setCheckoutItem({...checkoutItem, duration: Number(e.target.value)})}/>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border">
                    <span className="font-black text-xs uppercase text-slate-400">Jumlah Pesanan</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setCheckoutItem({...checkoutItem, qty: Math.max(1, checkoutItem.qty - 1)})} className="bg-white w-10 h-10 rounded-full shadow-sm font-black border">-</button>
                      <span className="font-black text-xl w-6 text-center">{checkoutItem.qty}</span>
                      <button onClick={() => setCheckoutItem({...checkoutItem, qty: checkoutItem.qty + 1})} className="bg-white w-10 h-10 rounded-full shadow-sm font-black border">+</button>
                    </div>
                  </div>

                  <input className="w-full p-5 bg-slate-50 rounded-2xl border outline-none focus:border-green-600" placeholder="Alamat Pengiriman Lengkap" />
                </div>

                <div className="bg-green-900 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl">
                  <div>
                    <p className="text-[10px] opacity-60 font-black uppercase tracking-widest">Total Tagihan</p>
                    <p className="text-3xl font-black tracking-tight">Rp {(checkoutItem.price * checkoutItem.qty * (checkoutItem.duration || 1)).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setOrderProgress(1)} className="bg-yellow-400 text-green-950 px-10 py-4 rounded-2xl font-black uppercase text-xs hover:scale-105 transition active:scale-95 shadow-lg">Bayar Sekarang</button>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center space-y-8 animate-in fade-in">
                 {orderProgress === 1 ? (
                   <div className="space-y-6">
                      <h2 className="text-2xl font-black text-green-950 uppercase tracking-tight">Pindai QRIS</h2>
                      <div className="bg-slate-50 p-6 rounded-[3rem] inline-block border-4 border-slate-100 shadow-inner">
                        <QrCode size={200} />
                      </div>
                      <p className="text-sm font-medium text-slate-400">Selesaikan pembayaran untuk memproses pesanan.</p>
                      <button onClick={() => setOrderProgress(100)} className="w-full bg-green-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Konfirmasi Sudah Bayar</button>
                   </div>
                 ) : (
                   <div className="space-y-10">
                      <div className="relative w-40 h-40 mx-auto">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-green-600 italic">AKTIF</div>
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-green-950 uppercase tracking-tighter">Pesanan Diproses</h3>
                        <p className="text-slate-400 font-medium mt-2">Status pesanan untuk {user.email} tercatat di sistem AGRI-OPTIMA.</p>
                      </div>
                      <button onClick={() => {setCheckoutItem(null); setOrderProgress(0);}} className="bg-green-900 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Kembali ke Menu</button>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function SideBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-white/10 text-yellow-400 shadow-inner' : 'text-green-100/60 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="hidden lg:block text-sm font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function UberSection({ title, icon, items, onBuy }: any) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-black flex items-center gap-3 text-green-800 uppercase tracking-tight">{icon} {title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((it: any) => <ProductCard key={it.id} item={it} onBuy={() => onBuy(it)} />)}
      </div>
    </section>
  );
}

function ProductCard({ item, onBuy }: any) {
  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 p-4 space-y-4 hover:shadow-xl transition-all group">
      <div className="h-44 overflow-hidden rounded-[2rem]">
        <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
      </div>
      <div className="px-2">
        <h4 className="font-black text-green-950 text-lg leading-tight">{item.name}</h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 line-clamp-1">{item.desc}</p>
        <p className="font-black text-green-600 text-xl mt-3 tracking-tighter">Rp {item.price.toLocaleString()}</p>
      </div>
      <button onClick={onBuy} className="w-full bg-green-50 text-green-700 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-green-700 hover:text-white transition shadow-sm">Pesan Sekarang</button>
    </div>
  );
}