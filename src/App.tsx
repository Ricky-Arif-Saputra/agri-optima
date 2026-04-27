import React, { useState, useEffect } from 'react';
// FIREBASE
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc } from "firebase/firestore";

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
  const [activeStep, setActiveStep] = useState<'input' | 'payment' | 'result'>('input');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [orderProgress, setOrderProgress] = useState(0);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  
  // FORM STATES
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Lahan', koefs: [1], target: 10, type: '<=' }]);
  const [hasil, setHasil] = useState<any>(null);

  // AUTH OBSERVER
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (u) {
        onSnapshot(collection(db, "orders"), (snap) => {
          const orders = snap.docs.map(d => ({id: d.id, ...d.data()})).filter((o:any) => o.userId === u.uid);
          setUserOrders(orders);
        });
      }
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
    } catch (err: any) { alert("Eror: " + err.message); }
  };

  const confirmPaymentOptimasi = () => {
    const N = tanaman.length;
    const sortedK = [...kendala];
    const A: any = Array.from({ length: sortedK.length + 3 }, () => new Array(N + 2).fill(0));
    tanaman.forEach((t, j) => A[1][j + 2] = t.profit);
    sortedK.forEach((c, i) => {
      A[i + 2][1] = c.target;
      c.koefs.forEach((val, j) => { A[i + 2][j + 2] = -val; });
    });
    setHasil(SimplexSolver.solve(N, kendala.filter(c=>c.type==='<=').length, kendala.filter(c=>c.type==='>=').length, kendala.filter(c=>c.type==='=').length, A));
    setActiveStep('result');
  };

  const finalizeOrder = async () => {
    setOrderProgress(10);
    const itv = setInterval(() => setOrderProgress(p => p < 90 ? p + 20 : p), 500);
    setTimeout(async () => {
      await addDoc(collection(db, "orders"), { userId: user.uid, itemName: checkoutItem.name, status: 'Diproses', date: new Date().toISOString() });
      clearInterval(itv);
      setOrderProgress(100);
    }, 2000);
  };

  // DATA MOCKUP
  const dataUber = {
    bahan: [{ id: 'b1', name: 'Pupuk NPK Pro', price: 450000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400', desc: 'Pupuk lengkap untuk masa tanam.' }],
    alat: [{ id: 'a1', name: 'Sewa Traktor G1000', price: 1200000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400', desc: 'Sewa traktor harian include bensin.' }],
    jasa: [{ id: 'j1', name: 'Regu Tanam Padi', price: 250000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', desc: 'Jasa tanam profesional borongan.' }]
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#052E16] flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 shadow-2xl">
          <div className="text-center italic font-black text-3xl text-green-900 tracking-tighter">AGRI-OPTIMA</div>
          <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-2xl border" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-2xl border" onChange={e => setPassword(e.target.value)} />
          <button onClick={() => handleAuth('login')} className="w-full bg-green-700 text-white py-4 rounded-2xl font-black shadow-lg">MASUK</button>
          <button onClick={() => handleAuth('reg')} className="w-full text-green-700 font-bold text-sm">Daftar Akun Baru</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAF9] font-sans">
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-72 bg-[#052E16] text-white fixed h-full p-8 flex flex-col z-30 shadow-2xl">
        <div className="font-black text-2xl tracking-tighter italic mb-10 text-yellow-400">AGRI-OPTIMA</div>
        <nav className="space-y-3 flex-1">
          <SideBtn active={tab==='optimasi'} icon={<Calculator/>} label="Optimasi Laba" onClick={()=>setTab('optimasi')}/>
          <SideBtn active={tab==='uber'} icon={<Truck/>} label="Uber Tani" onClick={()=>setTab('uber')}/>
          <SideBtn active={tab==='hilir'} icon={<ShoppingBag/>} label="Marketplace" onClick={()=>setTab('hilir')}/>
        </nav>
        <button onClick={()=>signOut(auth)} className="flex items-center gap-3 text-red-400 font-black text-xs uppercase"><LogOut size={18}/> <span className="hidden lg:block">Keluar</span></button>
      </aside>

      <main className="flex-1 ml-20 lg:ml-72 p-6 lg:p-12">
        {tab === 'optimasi' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
             {activeStep === 'input' ? (
                <>
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black text-green-950 uppercase">Input Optimasi</h1>
                    <button onClick={()=>setActiveStep('payment')} className="bg-green-600 text-white px-6 py-3 rounded-xl font-black shadow-md">CEK HASIL</button>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border space-y-6">
                    <div className="flex justify-between font-black text-xs uppercase text-green-700"><span>Jenis Tanaman</span><button onClick={()=>setTanaman([...tanaman, {id:Date.now(), nama:'', profit:0}])}>+ Tambah</button></div>
                    {tanaman.map((t,i)=>(
                      <div key={t.id} className="flex gap-4"><input className="flex-1 p-3 bg-slate-50 rounded-xl border" value={t.nama} onChange={e=>{const n=[...tanaman]; n[i].nama=e.target.value; setTanaman(n);}} placeholder="Nama Tanaman"/><input type="number" className="w-32 p-3 bg-slate-50 rounded-xl border" value={t.profit} onChange={e=>{const n=[...tanaman]; n[i].profit=Number(e.target.value); setTanaman(n);}}/></div>
                    ))}
                  </div>
                </>
             ) : activeStep === 'payment' ? (
               <div className="max-w-sm mx-auto bg-white p-10 rounded-[3rem] text-center shadow-xl border">
                  <h2 className="font-black text-xl mb-6">PEMBAYARAN</h2>
                  <QrCode size={200} className="mx-auto mb-6 text-green-900"/>
                  <p className="font-black text-2xl text-green-600 mb-6">Rp 5.000</p>
                  <button onClick={confirmPaymentOptimasi} className="w-full bg-green-900 text-white py-4 rounded-2xl font-black">KONFIRMASI BAYAR</button>
               </div>
             ) : (
               <div className="bg-[#052E16] p-10 rounded-[3rem] text-white space-y-6 shadow-2xl">
                 <h2 className="text-yellow-400 font-black tracking-widest uppercase text-xs">Hasil Optimal</h2>
                 <p className="text-5xl font-black">Rp {hasil?.maxValue.toLocaleString()}</p>
                 <div className="grid grid-cols-2 gap-4">
                   {tanaman.map((t,i)=>(<div key={i} className="bg-white/10 p-4 rounded-2xl flex justify-between"><span>{t.nama}</span><span className="font-black text-yellow-400">{hasil?.solutions[i].toFixed(2)} Unit</span></div>))}
                 </div>
                 <button onClick={()=>setActiveStep('input')} className="text-white/50 text-xs font-bold underline">Ulangi Hitung</button>
               </div>
             )}
          </div>
        )}

        {tab === 'uber' && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in">
            <h1 className="text-4xl font-black text-green-950">LAYANAN UBER TANI</h1>
            <section className="space-y-4">
              <h2 className="font-black text-xs uppercase tracking-widest text-green-600">Beli Bahan</h2>
              <div className="grid grid-cols-3 gap-6">
                {dataUber.bahan.map(it => <Card key={it.id} item={it} onSelect={()=>setCheckoutItem({...it, type:'bahan', qty:1, mode:'langsung'})} />)}
              </div>
            </section>
            <section className="space-y-4">
              <h2 className="font-black text-xs uppercase tracking-widest text-blue-600">Sewa Alat</h2>
              <div className="grid grid-cols-3 gap-6">
                {dataUber.alat.map(it => <Card key={it.id} item={it} onSelect={()=>setCheckoutItem({...it, type:'alat', qty:1, duration:1})} />)}
              </div>
            </section>
            <section className="space-y-4">
              <h2 className="font-black text-xs uppercase tracking-widest text-orange-600">Manajemen Tani</h2>
              <div className="grid grid-cols-3 gap-6">
                {dataUber.jasa.map(it => <Card key={it.id} item={it} onSelect={()=>setCheckoutItem({...it, type:'jasa', qty:1})} />)}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* MODAL CHECKOUT */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 space-y-6">
             {orderProgress === 0 ? (
               <>
                 <div className="flex justify-between items-center"><h3 className="font-black text-2xl">Checkout</h3><button onClick={()=>setCheckoutItem(null)}><X/></button></div>
                 <div className="flex gap-4 bg-slate-50 p-4 rounded-2xl border">
                    <img src={checkoutItem.img} className="w-20 h-20 rounded-xl object-cover" />
                    <div><p className="font-black text-green-950">{checkoutItem.name}</p><p className="font-black text-green-600">Rp {checkoutItem.price.toLocaleString()}</p></div>
                 </div>
                 <textarea placeholder="Alamat Lengkap" className="w-full p-4 bg-slate-50 rounded-2xl border min-h-[100px]"></textarea>
                 {checkoutItem.type==='bahan' && <div className="flex gap-2 p-1 bg-slate-100 rounded-xl"><button onClick={()=>setCheckoutItem({...checkoutItem, mode:'langsung'})} className={`flex-1 py-2 rounded-lg font-bold text-xs ${checkoutItem.mode==='langsung'?'bg-green-600 text-white':'text-slate-400'}`}>LANGSUNG</button><button onClick={()=>setCheckoutItem({...checkoutItem, mode:'grup'})} className={`flex-1 py-2 rounded-lg font-bold text-xs ${checkoutItem.mode==='grup'?'bg-yellow-400 text-green-900':'text-slate-400'}`}>GRUP</button></div>}
                 <button onClick={finalizeOrder} className="w-full bg-green-900 text-white py-4 rounded-2xl font-black shadow-xl">BAYAR SEKARANG</button>
               </>
             ) : (
               <div className="text-center py-10 space-y-6">
                 <div className="w-32 h-32 border-4 border-green-600 border-t-transparent animate-spin rounded-full mx-auto flex items-center justify-center font-black">{orderProgress}%</div>
                 <h3 className="font-black text-xl uppercase tracking-widest">{orderProgress < 100 ? 'Memproses...' : 'Sukses!'}</h3>
                 {orderProgress === 100 && <button onClick={()=>setCheckoutItem(null)} className="bg-green-900 text-white px-10 py-3 rounded-xl font-black">Kembali</button>}
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
}

function SideBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-white/10 text-yellow-400 shadow-inner' : 'text-green-100/60 hover:text-white'}`}>
      {icon} <span className="hidden lg:block text-sm font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function Card({ item, onSelect }: any) {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border p-4 space-y-4 hover:shadow-xl transition-all">
      <img src={item.img} className="h-40 w-full object-cover rounded-xl" />
      <h4 className="font-black text-green-950 text-sm leading-tight h-10">{item.name}</h4>
      <div className="flex justify-between items-center">
        <p className="font-black text-green-600 text-sm">Rp {item.price.toLocaleString()}</p>
        <button onClick={onSelect} className="bg-green-700 text-white px-4 py-2 rounded-xl font-black text-[10px]">PESAN</button>
      </div>
    </div>
  );
}