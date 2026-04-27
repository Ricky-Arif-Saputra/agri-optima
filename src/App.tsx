import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, onAuthStateChanged, signOut, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { SimplexSolver } from './lib/simplex';
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, MapPin, 
  CreditCard, Layers, CheckCircle2, TrendingUp, Package, 
  Box, QrCode, ArrowRight, TruckIcon, User, LogOut, Clock
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('optimasi');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [orderProgress, setOrderProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- AUTH LOGIC ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        loadUserProgress(u.uid);
      } else { setUser(null); }
    });
    return unsub;
  }, []);

  const loadUserProgress = async (uid: string) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // Logic untuk meload progres jika ada di firebase
      console.log("Progress loaded:", docSnap.data());
    }
  };

  const handleAuth = async (type: 'login' | 'reg') => {
    try {
      if (type === 'login') await signInWithEmailAndPassword(auth, email, password);
      else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, progress: 0 });
      }
    } catch (err) { alert("Auth Error: " + err); }
  };

  // --- DATA MOCKUP ---
  const dataUber = {
    bahan: [{ id: 1, name: 'Pupuk NPK 50kg', price: 450000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400', desc: 'Pupuk NPK berkualitas untuk fase vegetatif.' }],
    alat: [{ id: 2, name: 'Sewa Combine Harvester', price: 1500000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400', desc: 'Mesin panen padi otomatis per hari.' }],
    jasa: [{ id: 3, name: 'Manajemen Jasa Tanam', price: 200000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', desc: 'Jasa tenaga kerja tanam padi borongan.' }]
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-green-950 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 shadow-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-black text-green-900 tracking-tighter">AGRI-OPTIMA</h1>
            <p className="text-slate-400 font-bold text-xs uppercase mt-2">Portal Pertanian Modern</p>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" onChange={e => setPassword(e.target.value)} />
            <button onClick={() => handleAuth('login')} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg">MASUK</button>
            <button onClick={() => handleAuth('reg')} className="w-full text-green-700 font-bold text-sm">Daftar Akun Baru</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F0F5F2]">
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 bg-[#052E16] text-white fixed h-full flex flex-col p-8 z-20">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-yellow-400 p-2 rounded-xl text-green-950"><Layers size={22}/></div>
          <span className="hidden lg:block font-black text-2xl tracking-tighter italic">AGRI-OPTIMA</span>
        </div>
        <nav className="space-y-4 flex-1">
          <NavItem active={tab === 'optimasi'} icon={<Calculator/>} label="Optimasi Laba" onClick={() => setTab('optimasi')}/>
          <NavItem active={tab === 'uber'} icon={<Truck/>} label="Uber Tani" onClick={() => setTab('uber')}/>
          <NavItem active={tab === 'hilir'} icon={<ShoppingBag/>} label="Marketplace" onClick={() => setTab('hilir')}/>
        </nav>
        <button onClick={() => signOut(auth)} className="flex items-center gap-4 text-red-300 font-black text-sm uppercase"><LogOut size={20}/> <span className="hidden lg:block">Keluar</span></button>
      </aside>

      <main className="flex-1 ml-20 lg:ml-72 p-6 lg:p-12">
        {/* MODUL UBER TANI */}
        {tab === 'uber' && (
          <div className="max-w-6xl mx-auto space-y-16">
            <header><h1 className="text-4xl font-black text-green-950">Layanan Uber Tani</h1></header>

            {/* Beli Bahan */}
            <section className="space-y-6">
              <h2 className="text-xl font-black flex items-center gap-3 text-green-800"><Package/> BELI BAHAN TANI</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dataUber.bahan.map(item => <ItemCard key={item.id} item={item} type="bahan" onBuy={() => setCheckoutItem({...item, type: 'bahan', qty: 1, mode: 'langsung', address: ''})} />)}
              </div>
            </section>

            {/* Sewa Alat */}
            <section className="space-y-6">
              <h2 className="text-xl font-black flex items-center gap-3 text-green-800"><TrendingUp/> SEWA ALAT MODERN</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dataUber.alat.map(item => <ItemCard key={item.id} item={item} type="alat" onBuy={() => setCheckoutItem({...item, type: 'alat', qty: 1, duration: 1, address: ''})} />)}
              </div>
            </section>

            {/* Manajemen Jasa */}
            <section className="space-y-6">
              <h2 className="text-xl font-black flex items-center gap-3 text-green-800"><UserCheck/> MANAJEMEN TANI</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dataUber.jasa.map(item => <ItemCard key={item.id} item={item} type="jasa" onBuy={() => setCheckoutItem({...item, type: 'jasa', qty: 1, address: ''})} />)}
              </div>
            </section>
          </div>
        )}

        {/* MODUL MARKETPLACE */}
        {tab === 'hilir' && (
          <div className="max-w-6xl mx-auto space-y-10">
            <header><h1 className="text-4xl font-black text-green-950 tracking-tighter">Marketplace Hilirisasi</h1></header>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <ItemCard 
                item={{id: 99, name: 'Beras Super 5kg', price: 85000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', desc: 'Beras pulen tanpa pemutih.'}} 
                type="hilir" 
                onBuy={() => setCheckoutItem({id: 99, name: 'Beras Super 5kg', price: 85000, type: 'hilir', qty: 1, delivery: 'antar', address: ''})} 
               />
            </div>
          </div>
        )}

        {/* --- OPTIMASI LABA PLACEHOLDER (Gunakan Logika Simplex Sebelumnya) --- */}
        {tab === 'optimasi' && <div className="p-20 text-center font-black text-slate-300">MODUL OPTIMASI AKTIF - Rp 5.000 / CEK</div>}
      </main>

      {/* CHECKOUT MODAL DYNAMIC */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-green-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            {orderProgress === 0 ? (
              <div className="p-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <img src={checkoutItem.img} className="w-20 h-20 rounded-2xl object-cover" />
                    <div>
                      <h3 className="font-black text-green-950 text-xl">{checkoutItem.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{checkoutItem.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => setCheckoutItem(null)} className="text-slate-300">X</button>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  {/* Beli Bahan Specific */}
                  {checkoutItem.type === 'bahan' && (
                    <div className="flex gap-2">
                       <button onClick={() => setCheckoutItem({...checkoutItem, mode: 'langsung'})} className={`flex-1 py-3 rounded-xl font-black text-[10px] ${checkoutItem.mode === 'langsung' ? 'bg-green-600 text-white' : 'bg-white'}`}>BELI LANGSUNG</button>
                       <button onClick={() => setCheckoutItem({...checkoutItem, mode: 'grup'})} className={`flex-1 py-3 rounded-xl font-black text-[10px] ${checkoutItem.mode === 'grup' ? 'bg-yellow-400 text-green-950' : 'bg-white'}`}>GABUNG GRUP</button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-500 uppercase">Jumlah</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setCheckoutItem({...checkoutItem, qty: Math.max(1, checkoutItem.qty - 1)})} className="bg-white w-8 h-8 rounded-full shadow-sm font-black">-</button>
                      <span className="font-black">{checkoutItem.qty}</span>
                      <button onClick={() => setCheckoutItem({...checkoutItem, qty: checkoutItem.qty + 1})} className="bg-white w-8 h-8 rounded-full shadow-sm font-black">+</button>
                    </div>
                  </div>

                  {checkoutItem.type === 'alat' && (
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-500 uppercase">Durasi (Hari)</span>
                      <input type="number" className="w-20 p-2 rounded-xl bg-white text-right font-black" value={checkoutItem.duration} onChange={e => setCheckoutItem({...checkoutItem, duration: Number(e.target.value)})}/>
                    </div>
                  )}

                  {checkoutItem.type === 'hilir' && (
                    <div className="flex gap-2">
                       <button onClick={() => setCheckoutItem({...checkoutItem, delivery: 'antar'})} className={`flex-1 py-3 rounded-xl font-black text-[10px] ${checkoutItem.delivery === 'antar' ? 'bg-green-600 text-white' : 'bg-white'}`}>DIANTAR</button>
                       <button onClick={() => setCheckoutItem({...checkoutItem, delivery: 'ambil'})} className={`flex-1 py-3 rounded-xl font-black text-[10px] ${checkoutItem.delivery === 'ambil' ? 'bg-green-600 text-white' : 'bg-white'}`}>AMBIL SENDIRI</button>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Alamat Lengkap</label>
                    <input className="w-full p-4 bg-white rounded-2xl mt-1 text-sm border border-slate-200" placeholder="Masukkan alamat..." onChange={e => setCheckoutItem({...checkoutItem, address: e.target.value})} />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-green-950 p-6 rounded-[2rem] text-white shadow-xl">
                  <div>
                    <p className="text-[10px] opacity-50 uppercase font-black">Total Bayar</p>
                    <p className="text-2xl font-black">Rp {(checkoutItem.price * checkoutItem.qty * (checkoutItem.duration || 1)).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setOrderProgress(10)} className="bg-yellow-400 text-green-950 px-8 py-3 rounded-xl font-black uppercase text-xs">Bayar Sekarang</button>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center space-y-10 animate-in fade-in">
                {orderProgress === 10 ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-black text-green-950">SCAN QRIS</h2>
                    <div className="bg-slate-100 p-6 rounded-[2rem] inline-block border-4 border-slate-50"><QrCode size={180} /></div>
                    <p className="text-sm font-medium text-slate-400">Menunggu pembayaran terdeteksi...</p>
                    <button onClick={() => setOrderProgress(50)} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black">KONFIRMASI BAYAR</button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="relative w-32 h-32 mx-auto">
                      <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center font-black text-green-600">PESANAN</div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-green-950 uppercase">Progres Pesanan Aktif</h3>
                      <p className="text-sm text-slate-400 mt-2 italic">Petani sedang menyiapkan pesanan untuk akun {user.email}</p>
                    </div>
                    <button onClick={() => {setCheckoutItem(null); setOrderProgress(0);}} className="bg-green-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl">KEMBALI KE BERANDA</button>
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

function NavItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-white/10 text-yellow-400 shadow-inner' : 'text-green-100/60 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="hidden lg:block text-sm font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function ItemCard({ item, onBuy, type }: any) {
  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 p-4 space-y-4 hover:shadow-xl transition-all">
      <img src={item.img} className="h-44 w-full object-cover rounded-[2rem]" />
      <div className="px-2">
        <h4 className="font-black text-green-950 text-lg leading-tight">{item.name}</h4>
        <p className="font-black text-green-600 mt-1">Rp {item.price.toLocaleString()} <span className="text-[10px] text-slate-300 font-normal">/ {type === 'alat' ? 'hari' : 'unit'}</span></p>
      </div>
      <button onClick={onBuy} className="w-full bg-green-50 text-green-700 py-4 rounded-[1.5rem] font-black text-xs hover:bg-green-600 hover:text-white transition">PESAN SEKARANG</button>
    </div>
  );
}