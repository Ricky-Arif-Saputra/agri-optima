import React, { useState, useEffect } from 'react';
// FIREBASE CORE
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, addDoc } from "firebase/firestore";

// CONFIGURASI FIREBASE RICKY
const firebaseConfig = {
  apiKey: "AIzaSyAh1y1fn0VxL_juhfdsIKCyePyNSeR6z6k",
  authDomain: "agri-optima-2026.firebaseapp.com",
  projectId: "agri-optima-2026",
  storageBucket: "agri-optima-2026.firebasestorage.app",
  messagingSenderId: "263003282029",
  appId: "1:263003282029:web:6e64c721ca62abdd69bd64"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ICONS
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, Layers, 
  CheckCircle2, TrendingUp, Package, Box, QrCode, LogOut, 
  UserCheck, TruckIcon, X, ArrowRight, Info, MapPin, Users
} from 'lucide-react';
import { SimplexSolver } from './lib/simplex';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('optimasi');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [orderProgress, setOrderProgress] = useState(0);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // AUTH & DATABASE OBSERVER
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (u) {
        // Ambil riwayat progres pesanan khusus akun ini
        const unsubDocs = onSnapshot(collection(db, "orders"), (snapshot) => {
          const orders = snapshot.docs
            .map(d => ({id: d.id, ...d.data()}))
            .filter((o: any) => o.userId === u.uid);
          setUserOrders(orders);
        });
        return () => unsubDocs();
      }
    });
    return unsubAuth;
  }, []);

  const handleAuth = async (type: 'login' | 'reg') => {
    try {
      if (type === 'login') await signInWithEmailAndPassword(auth, email, password);
      else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, createdAt: new Date() });
      }
    } catch (err: any) { alert("Akses Ditolak: " + err.message); }
  };

  // DATA MASTER
  const dataUber = {
    bahan: [{ id: 'b1', name: 'Pupuk NPK Mutiara', price: 650000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400', desc: 'Pupuk pertumbuhan kualitas tinggi untuk padi dan jagung.' }],
    alat: [{ id: 'a1', name: 'Traktor Quick G1000', price: 1500000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400', desc: 'Sewa harian traktor pembajak sawah handal.' }],
    jasa: [{ id: 'j1', name: 'Tim Buruh Tanam', price: 200000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', desc: 'Tenaga ahli tanam sistem borongan per hektar.' }]
  };

  const dataHilir = [
    { id: 'h1', name: 'Beras Pandan Wangi 5kg', price: 85000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', desc: 'Beras organik tanpa pemutih.' }
  ];

  // LOGIK SIMPAN PESANAN KE FIREBASE
  const finalizeOrder = async () => {
    setOrderProgress(20);
    const interval = setInterval(() => setOrderProgress(prev => prev + 20), 500);
    
    setTimeout(async () => {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        itemName: checkoutItem.name,
        total: checkoutItem.totalPrice,
        status: 'Diproses',
        date: new Date().toISOString()
      });
      clearInterval(interval);
      setOrderProgress(100);
    }, 2500);
  };

  // UI LOGIN
  if (!user) {
    return (
      <div className="min-h-screen bg-[#052E16] flex items-center justify-center p-6 font-sans">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95">
          <div className="text-center">
            <h1 className="text-4xl font-black text-green-900 tracking-tighter italic">AGRI-OPTIMA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Sistem Informasi Petani Modern</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Email Akun</label>
               <input type="email" placeholder="nama@email.com" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 ring-green-600" onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Kata Sandi</label>
               <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 ring-green-600" onChange={e => setPassword(e.target.value)} />
            </div>
            <button onClick={() => handleAuth('login')} className="w-full bg-green-700 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-green-800 transition">MASUK SEKARANG</button>
            <button onClick={() => handleAuth('reg')} className="w-full text-green-700 font-bold text-sm">Belum punya akun? Daftar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAF9] font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-72 bg-[#052E16] text-white fixed h-full p-8 flex flex-col z-30 shadow-2xl">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-yellow-400 p-2 rounded-xl text-green-950"><Layers size={24}/></div>
          <span className="hidden lg:block font-black text-2xl tracking-tighter italic">AGRI-OPTIMA</span>
        </div>
        <nav className="space-y-3 flex-1">
          <SideBtn active={tab==='optimasi'} icon={<Calculator/>} label="Optimasi Laba" onClick={()=>setTab('optimasi')}/>
          <SideBtn active={tab==='uber'} icon={<Truck/>} label="Uber Tani" onClick={()=>setTab('uber')}/>
          <SideBtn active={tab==='hilir'} icon={<ShoppingBag/>} label="Marketplace" onClick={()=>setTab('hilir')}/>
          <div className="pt-6 border-t border-white/10">
             <p className="hidden lg:block text-[10px] font-black text-white/40 mb-4 uppercase tracking-widest">Riwayat Akun</p>
             {userOrders.slice(0,3).map((o,i) => (
               <div key={i} className="hidden lg:flex items-center gap-2 mb-2 bg-white/5 p-2 rounded-lg text-[10px]">
                 <CheckCircle2 size={12} className="text-green-400"/> {o.itemName} - <span className="text-yellow-400">{o.status}</span>
               </div>
             ))}
          </div>
        </nav>
        <button onClick={()=>signOut(auth)} className="flex items-center gap-3 text-red-400 font-black text-xs uppercase tracking-widest pt-6 border-t border-white/10"><LogOut size={18}/> <span className="hidden lg:block">Keluar</span></button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-20 lg:ml-72 p-6 lg:p-12">
        {tab === 'uber' && (
          <div className="max-w-6xl mx-auto space-y-16">
            <header className="space-y-2">
              <h1 className="text-5xl font-black text-green-950 tracking-tighter">UBER TANI</h1>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">Layanan Hulu Pertanian Terintegrasi</p>
            </header>

            <Section title="Beli Bahan Tani" icon={<Package/>} color="green" items={dataUber.bahan} 
              onSelect={(it)=>setCheckoutItem({...it, type:'bahan', qty:1, mode:'langsung', address:''})}/>
            
            <Section title="Sewa Alat Modern" icon={<TrendingUp/>} color="blue" items={dataUber.alat} 
              onSelect={(it)=>setCheckoutItem({...it, type:'alat', qty:1, duration:1, address:''})}/>
            
            <Section title="Manajemen Tani" icon={<UserCheck/>} color="orange" items={dataUber.jasa} 
              onSelect={(it)=>setCheckoutItem({...it, type:'jasa', qty:1, location:''})}/>
          </div>
        )}

        {tab === 'hilir' && (
          <div className="max-w-6xl mx-auto space-y-12">
            <header><h1 className="text-5xl font-black text-green-950 tracking-tighter">MARKETPLACE</h1></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {dataHilir.map(it => (
                <Card key={it.id} item={it} onSelect={()=>setCheckoutItem({...it, type:'hilir', qty:1, delivery:'antar', address:''})}/>
              ))}
            </div>
          </div>
        )}

        {tab === 'optimasi' && (
          <div className="h-[80vh] flex flex-col items-center justify-center opacity-40 grayscale italic font-black">
             <Calculator size={100} className="mb-4 text-green-900"/>
             <h2 className="text-3xl uppercase tracking-tighter">Modul Simplex Standby</h2>
             <p className="text-sm tracking-widest mt-2">Siap menghitung laba maksimal lahan Anda</p>
          </div>
        )}
      </main>

      {/* DYNAMIC MODAL BOX */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-green-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            {orderProgress === 0 ? (
              <div className="flex flex-col md:flex-row h-full">
                {/* Info Produk */}
                <div className="w-full md:w-5/12 bg-slate-50 p-10 border-r">
                   <img src={checkoutItem.img} className="w-full aspect-square object-cover rounded-[2rem] shadow-lg mb-6" />
                   <h3 className="text-2xl font-black text-green-900 leading-tight">{checkoutItem.name}</h3>
                   <p className="text-xs font-bold text-slate-400 mt-4 leading-relaxed">{checkoutItem.desc}</p>
                   <div className="mt-8 pt-8 border-t border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Harga Dasar</p>
                      <p className="text-2xl font-black text-green-600 italic">Rp {checkoutItem.price.toLocaleString()}</p>
                   </div>
                </div>

                {/* Form Order */}
                <div className="w-full md:w-7/12 p-10 space-y-6 overflow-y-auto max-h-[80vh]">
                  <div className="flex justify-between items-center">
                    <span className="bg-yellow-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">Formulir Pesanan</span>
                    <button onClick={()=>setCheckoutItem(null)} className="text-slate-300 hover:text-red-500"><X size={24}/></button>
                  </div>

                  {/* Logika Tampilan sesuai tipe */}
                  {checkoutItem.type === 'bahan' && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sistem Pembelian</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                        <button onClick={()=>setCheckoutItem({...checkoutItem, mode:'langsung'})} className={`py-3 rounded-xl font-black text-[10px] ${checkoutItem.mode==='langsung'?'bg-green-700 text-white shadow-lg':'text-slate-400'}`}>BELI LANGSUNG</button>
                        <button onClick={()=>setCheckoutItem({...checkoutItem, mode:'grup'})} className={`py-3 rounded-xl font-black text-[10px] ${checkoutItem.mode==='grup'?'bg-yellow-400 text-green-900 shadow-lg':'text-slate-400'}`}>GRUP (UB TANI)</button>
                      </div>
                    </div>
                  )}

                  {checkoutItem.type === 'alat' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Durasi Sewa (Hari)</label>
                      <input type="number" min="1" className="w-full p-4 bg-slate-50 rounded-2xl border font-black" value={checkoutItem.duration} 
                        onChange={(e)=>setCheckoutItem({...checkoutItem, duration:Number(e.target.value)})}/>
                    </div>
                  )}

                  {checkoutItem.type === 'hilir' && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Metode Pengiriman</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                        <button onClick={()=>setCheckoutItem({...checkoutItem, delivery:'antar'})} className={`py-3 rounded-xl font-black text-[10px] ${checkoutItem.delivery==='antar'?'bg-green-700 text-white shadow-lg':'text-slate-400'}`}>ANTAR KE RUMAH</button>
                        <button onClick={()=>setCheckoutItem({...checkoutItem, delivery:'jemput'})} className={`py-3 rounded-xl font-black text-[10px] ${checkoutItem.delivery==='jemput'?'bg-yellow-400 text-green-900 shadow-lg':'text-slate-400'}`}>JEMPUT SENDIRI</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Jumlah Pesanan</label>
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border">
                      <button onClick={()=>setCheckoutItem({...checkoutItem, qty:Math.max(1, checkoutItem.qty-1)})} className="w-12 h-12 bg-white rounded-xl shadow-sm font-black border">-</button>
                      <span className="flex-1 text-center font-black text-xl">{checkoutItem.qty}</span>
                      <button onClick={()=>setCheckoutItem({...checkoutItem, qty:checkoutItem.qty+1})} className="w-12 h-12 bg-white rounded-xl shadow-sm font-black border">+</button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Lokasi / Alamat</label>
                    <textarea rows={2} className="w-full p-4 bg-slate-50 rounded-2xl border outline-none focus:ring-2 ring-green-600" 
                      placeholder="Masukkan alamat lengkap atau lokasi sawah..." onChange={(e)=>setCheckoutItem({...checkoutItem, address:e.target.value})}></textarea>
                  </div>

                  {/* Summary Bayar */}
                  {(() => {
                    const total = checkoutItem.price * checkoutItem.qty * (checkoutItem.duration || 1);
                    checkoutItem.totalPrice = total; // Inject ke state
                    return (
                      <div className="bg-[#052E16] p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Bayar</p>
                            <p className="text-3xl font-black italic tracking-tighter">Rp {total.toLocaleString()}</p>
                          </div>
                          <button onClick={()=>setOrderProgress(1)} className="bg-yellow-400 text-green-950 px-8 py-3 rounded-xl font-black uppercase text-xs hover:scale-105 transition active:scale-95">Bayar</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-16 text-center space-y-10 animate-in fade-in">
                {orderProgress === 1 ? (
                  <>
                    <h2 className="text-2xl font-black text-green-950 uppercase tracking-tighter">Selesaikan Pembayaran</h2>
                    <div className="bg-slate-50 p-6 rounded-[3rem] inline-block border-4 border-slate-100 shadow-inner">
                      <QrCode size={220} className="text-green-900"/>
                    </div>
                    <p className="text-sm font-medium text-slate-400 italic">Silakan scan kode QRIS diatas untuk memproses pesanan otomatis.</p>
                    <button onClick={finalizeOrder} className="w-full bg-green-700 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Konfirmasi Sudah Bayar</button>
                  </>
                ) : (
                  <div className="space-y-10 py-10">
                    <div className="relative w-48 h-48 mx-auto">
                      <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
                      <div className={`absolute inset-0 border-[6px] border-green-600 rounded-full border-t-transparent ${orderProgress < 100 ? 'animate-spin' : ''}`}></div>
                      <div className="absolute inset-0 flex items-center justify-center font-black text-green-600 text-2xl italic tracking-tighter">
                        {orderProgress < 100 ? `${orderProgress}%` : <CheckCircle2 size={60}/>}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-green-950 uppercase tracking-tighter">
                        {orderProgress < 100 ? 'Memvalidasi Dana...' : 'Pesanan Sukses!'}
                      </h3>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">
                        {orderProgress < 100 ? 'Proses Sinkronisasi Server' : 'Progres dicatat di akun anda'}
                      </p>
                    </div>
                    {orderProgress === 100 && (
                      <button onClick={()=>{setCheckoutItem(null); setOrderProgress(0)}} className="bg-green-900 text-white px-14 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Kembali ke Menu Utama</button>
                    )}
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

// COMPONENT HELPERS
function SideBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-white/10 text-yellow-400 shadow-inner' : 'text-green-100/60 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="hidden lg:block text-sm font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function Section({ title, icon, color, items, onSelect }: any) {
  const colors: any = { green: 'text-green-800 bg-green-50', blue: 'text-blue-800 bg-blue-50', orange: 'text-orange-800 bg-orange-50' };
  return (
    <section className="space-y-8">
      <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full font-black uppercase text-xs tracking-widest ${colors[color]}`}>
        {icon} {title}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((it: any) => <Card key={it.id} item={it} onSelect={onSelect} />)}
      </div>
    </section>
  );
}

function Card({ item, onSelect }: any) {
  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl transition-all group p-4">
      <div className="h-52 overflow-hidden rounded-[2rem] mb-6">
        <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
      </div>
      <div className="px-2 space-y-4">
        <h4 className="font-black text-green-950 text-xl tracking-tight leading-tight h-14">{item.name}</h4>
        <div className="flex justify-between items-center">
          <p className="font-black text-green-600 text-lg italic tracking-tighter">Rp {item.price.toLocaleString()}</p>
          <button onClick={onSelect} className="bg-green-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-green-900 transition">Pesan</button>
        </div>
      </div>
    </div>
  );
}