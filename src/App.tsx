import React, { useState, useEffect, useMemo, useRef } from 'react';
// FIREBASE & ENGINE IMPORTS
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, where, orderBy, Timestamp, getDocs } from "firebase/firestore";

// UI ICONS
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, Layers, 
  CheckCircle2, TrendingUp, Package, Box, QrCode, LogOut, 
  UserCheck, TruckIcon, X, ArrowRight, Info, MapPin, Search, 
  PlusCircle, MinusCircle, Upload, ClipboardCheck, Clock, CreditCard, 
  Menu, Home, Store, History, User, ChevronRight, Image as ImageIcon,
  Star, ShieldCheck, Zap, ArrowDownWideArrow, Bell, Filter, Settings
} from 'lucide-react';

// --- ADVANCED SIMPLEX ENGINE (STRICT LOGIC) ---
const SimplexSolver = {
  solve: (nVars: number, nLeq: number, nGeq: number, nEq: number, matrix: any[][]) => {
    const rows = nLeq + nGeq + nEq + 2;
    const cols = nVars + 2;
    let table = JSON.parse(JSON.stringify(matrix));

    const performPivot = (r: number, c: number) => {
      const pVal = table[r][c];
      for (let j = 1; j < cols; j++) table[r][j] /= pVal;
      for (let i = 1; i < rows; i++) {
        if (i !== r) {
          const factor = table[i][c];
          for (let j = 1; j < cols; j++) table[i][j] -= factor * table[r][j];
        }
      }
    };

    let count = 0;
    while (count < 200) {
      let pivotCol = -1;
      let maxGrad = 0;
      for (let j = 2; j < cols; j++) {
        if (table[1][j] > maxGrad) {
          maxGrad = table[1][j];
          pivotCol = j;
        }
      }
      if (pivotCol === -1) break;

      let pivotRow = -1;
      let minRatio = Infinity;
      for (let i = 2; i < rows; i++) {
        const val = -table[i][pivotCol];
        if (val > 0) {
          const ratio = table[i][1] / val;
          if (ratio < minRatio) {
            minRatio = ratio;
            pivotRow = i;
          }
        }
      }
      if (pivotRow === -1) break;
      performPivot(pivotRow, pivotCol);
      count++;
    }

    const solutions = new Array(nVars).fill(0);
    for (let j = 2; j < cols; j++) {
      let activeRow = -1;
      let isBasic = true;
      for (let i = 2; i < rows; i++) {
        if (Math.abs(table[i][j] - 1) < 1e-9) {
          if (activeRow === -1) activeRow = i;
          else isBasic = false;
        } else if (Math.abs(table[i][j]) > 1e-9) {
          isBasic = false;
        }
      }
      if (isBasic && activeRow !== -1) solutions[j - 2] = table[activeRow][1];
    }
    return { solutions, maxValue: table[1][1] };
  }
};

// --- FIREBASE CONFIGURATION (FIXED API KEY ERROR) ---
// Gunakan API Key asli dari Console Firebase anda. Ini adalah format dummy yang valid secara struktur.
const firebaseConfig = {
  apiKey: "AIzaSyB_REPLACE_WITH_YOUR_ACTUAL_KEY_7890", 
  authDomain: "agri-optima-2026.firebaseapp.com",
  projectId: "agri-optima-2026",
  storageBucket: "agri-optima-2026.firebasestorage.app",
  messagingSenderId: "263003282029",
  appId: "1:263003282029:web:6e64c721ca62abdd69bd64"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [tab, setTab] = useState('optimasi');
  const [uberCat, setUberCat] = useState<'bahan' | 'alat' | 'jasa'>('bahan');
  
  // App States
  const [activeStep, setActiveStep] = useState<'input' | 'payment' | 'result'>('input');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Optimasi Data
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 12000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Lahan (Ha)', koefs: [1], target: 5, type: '<=' }]);
  const [hasil, setHasil] = useState<any>(null);

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Realtime Sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingApp(false);
      if (u) {
        const q = query(collection(db, "orders"), where("userId", "==", u.uid));
        return onSnapshot(q, (snap) => {
          const docs = snap.docs.map(d => ({id: d.id, ...d.data()}));
          setOrders(docs.sort((a:any, b:any) => b.createdAt?.seconds - a.createdAt?.seconds));
        });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!proof) return;
    const url = URL.createObjectURL(proof);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proof]);

  // --- BUSINESS LOGIC ---
  const handleAuth = async (mode: 'login' | 'register') => {
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, role: 'petani', joined: new Date() });
      }
    } catch (e: any) { alert("Auth Error: Pastikan kredensial benar dan API Key valid."); }
  };

  const processOptimasi = () => {
    const n = tanaman.length;
    const m = kendala.length;
    // Persiapan Matriks Simplex
    let A: any = Array.from({ length: m + 3 }, () => new Array(n + 2).fill(0));
    tanaman.forEach((t, j) => A[1][j + 2] = t.profit);
    kendala.forEach((k, i) => {
      A[i + 2][1] = k.target;
      k.koefs.forEach((val, j) => { A[i + 2][j + 2] = -val; });
    });
    const result = SimplexSolver.solve(n, m, 0, 0, A);
    setHasil(result);
    setActiveStep('result');
  };

  const handleInstantConfirm = async (isOpt = false) => {
    if (!preview) return alert("Silahkan pilih foto bukti transfer.");

    const payload = isOpt ? {
      itemName: "Analisis Laba Pro",
      total: 5000,
      qty: 1,
      status: "Pesanan Selesai",
      type: "Digital"
    } : {
      itemName: checkoutItem.name,
      total: checkoutItem.totalPrice,
      qty: checkoutItem.qty,
      status: "Diproses",
      type: checkoutItem.type,
      delivery: checkoutItem.delivery || 'Ambil'
    };

    await addDoc(collection(db, "orders"), {
      ...payload,
      userId: user.uid,
      createdAt: Timestamp.now()
    });

    // INSTANT REDIRECT & ACTION
    if (isOpt) {
      processOptimasi();
    } else {
      setCheckoutItem(null);
      setTab('riwayat');
    }
    setProof(null);
  };

  // --- MOCK DATA ---
  const MARKET_DATA = {
    bahan: [
      { id: 'b1', name: 'Pupuk NPK Mutiara 50kg', price: 650000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400', rate: 4.8, sold: 1200, desc: 'Pupuk kualitas impor untuk hasil panen maksimal.' },
      { id: 'b2', name: 'Benih Jagung Hibrida P35', price: 115000, img: 'https://images.unsplash.com/photo-1551348398-3829024f0c45?w=400', rate: 4.9, sold: 850, desc: 'Benih tahan banting di segala cuaca.' }
    ],
    alat: [
      { id: 'a1', name: 'Sewa Cultivator Mini', price: 250000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400', rate: 4.5, sold: 89, desc: 'Harga sewa per 8 jam kerja.' }
    ],
    jasa: [
      { id: 'j1', name: 'Konsultasi Tanah Pro', price: 500000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', rate: 5.0, sold: 45, desc: 'Analisis lab lengkap untuk tingkat kesuburan.' }
    ]
  };

  if (loadingApp) return <div className="h-screen flex items-center justify-center bg-emerald-950 text-white font-black italic">AGRI-OPTIMA...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#022C22] flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-sm rounded-[3rem] p-12 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-800"><Layers size={32}/></div>
            <h1 className="text-3xl font-black italic tracking-tighter text-emerald-950">AGRI-OPTIMA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Optimasi Pertanian Modern</p>
          </div>
          <div className="space-y-3">
            <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-emerald-600 transition-all font-medium text-sm" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
            <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-emerald-600 transition-all font-medium text-sm" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
            <button onClick={()=>handleAuth('login')} className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">MASUK</button>
            <button onClick={()=>handleAuth('register')} className="w-full text-emerald-700 font-bold text-xs">Belum punya akun? Daftar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F2] text-slate-900 pb-32 overflow-x-hidden">
      
      {/* MOBILE APP BAR */}
      <header className="bg-white/90 backdrop-blur-xl border-b sticky top-0 z-50 p-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-900 text-white p-2.5 rounded-2xl shadow-lg"><Zap size={20}/></div>
          <h2 className="font-black text-xl italic tracking-tighter text-emerald-950">AGRI-OPTIMA</h2>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 bg-slate-100 rounded-xl text-slate-500 relative"><Bell size={20}/><div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div></button>
          <button onClick={()=>signOut(auth)} className="p-2.5 bg-red-50 rounded-xl text-red-500"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="p-4 max-w-xl mx-auto space-y-10">
        
        {/* VIEW: OPTIMASI */}
        {tab === 'optimasi' && (
          <div className="space-y-6">
            {activeStep === 'input' && (
              <>
                <div className="bg-emerald-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute -right-16 -top-16 opacity-10"><Calculator size={250}/></div>
                  <h3 className="text-3xl font-black italic mb-2 leading-none">Optimasi Laba.</h3>
                  <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em]">Matrix Simplex Processor</p>
                </div>

                <Section title="Parameter Tanaman" onAdd={()=>setTanaman([...tanaman, {id:Date.now(), nama:'', profit:0}])}>
                  {tanaman.map((t, i) => (
                    <div key={t.id} className="flex gap-3 bg-white p-4 rounded-3xl border shadow-sm items-center animate-in slide-in-from-left">
                      <input className="flex-1 bg-transparent font-black text-sm outline-none" placeholder="Contoh: Padi" value={t.nama} onChange={e=>{const n=[...tanaman]; n[i].nama=e.target.value; setTanaman(n);}}/>
                      <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                        <span className="text-[10px] font-black text-emerald-600">Rp</span>
                        <input type="number" className="w-24 font-black text-emerald-950 text-sm bg-transparent outline-none" value={t.profit} onChange={e=>{const n=[...tanaman]; n[i].profit=Number(e.target.value); setTanaman(n);}}/>
                      </div>
                    </div>
                  ))}
                </Section>

                <Section title="Batasan Lahan/Modal" onAdd={()=>setKendala([...kendala, {id:Date.now(), nama:'', koefs:Array(tanaman.length).fill(0), target:0, type:'<='}])}>
                  {kendala.map((k, i) => (
                    <div key={k.id} className="p-6 bg-white rounded-[2.5rem] border shadow-sm space-y-4 animate-in slide-in-from-right">
                      <div className="flex justify-between items-center pb-3 border-b border-dashed">
                        <input className="font-black text-xs uppercase text-emerald-900 outline-none w-1/2" value={k.nama} onChange={e=>{const n=[...kendala]; n[i].nama=e.target.value; setKendala(n);}}/>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-300">MAX</span>
                          <input type="number" className="w-16 bg-slate-50 border rounded-xl text-center font-black text-xs p-2 outline-none" value={k.target} onChange={e=>{const n=[...kendala]; n[i].target=Number(e.target.value); setKendala(n);}}/>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {tanaman.map((t, ti) => (
                          <div key={ti} className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between border">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{t.nama || 'Tanaman'}</span>
                            <input type="number" className="w-8 text-right font-black text-emerald-600 bg-transparent outline-none" value={k.koefs[ti]} onChange={e=>{const n=[...kendala]; n[i].koefs[ti]=Number(e.target.value); setKendala(n);}} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </Section>
                <button onClick={()=>setActiveStep('payment')} className="w-full bg-emerald-700 text-white py-6 rounded-[2.5rem] font-black shadow-2xl hover:bg-emerald-800 active:scale-95 transition-all text-xl">HITUNG SEKARANG</button>
              </>
            )}

            {activeStep === 'payment' && (
              <div className="bg-white p-10 rounded-[4rem] shadow-2xl text-center space-y-8 animate-in zoom-in">
                 <div className="flex justify-between items-center">
                   <button onClick={()=>setActiveStep('input')} className="p-3 bg-slate-100 rounded-full active:scale-75 transition"><X size={20}/></button>
                   <p className="font-black text-xs text-slate-400 uppercase tracking-widest">Aktivasi Algoritma</p>
                   <div className="w-10"></div>
                 </div>
                 <div className="bg-slate-900 p-8 rounded-[3rem] inline-block shadow-inner">
                   <QrCode size={160} className="text-white"/>
                 </div>
                 <div className="space-y-1">
                    <p className="text-4xl font-black text-emerald-950 tracking-tighter">Rp 5.000</p>
                    <p className="text-[10px] font-black text-slate-300 uppercase">One-Time Activation</p>
                 </div>
                 {preview ? (
                   <div className="space-y-4">
                     <img src={preview} className="w-full h-48 object-cover rounded-[2.5rem] border-8 border-emerald-50 shadow-md" />
                     <button onClick={()=>handleInstantConfirm(true)} className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black shadow-xl">VERIFIKASI & PROSES</button>
                   </div>
                 ) : (
                   <label className="flex flex-col items-center p-12 border-4 border-dashed rounded-[3rem] cursor-pointer hover:bg-emerald-50 transition border-emerald-100 group">
                     <ImageIcon className="text-emerald-200 group-hover:scale-110 transition-transform mb-3" size={48}/>
                     <span className="font-black text-[10px] text-emerald-900 uppercase">Klik Upload Bukti Bayar</span>
                     <input type="file" className="hidden" accept="image/*" onChange={e=>setProof(e.target.files?.[0] || null)} />
                   </label>
                 )}
              </div>
            )}

            {activeStep === 'result' && hasil && (
              <div className="animate-in fade-in slide-in-from-bottom-10 space-y-6">
                 <div className="bg-gradient-to-br from-emerald-950 to-emerald-800 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="bg-yellow-400 text-emerald-950 px-4 py-1 rounded-full text-[10px] font-black uppercase inline-block mb-8 shadow-xl">HASIL OPTIMAL</div>
                      <h2 className="text-6xl font-black tracking-tighter mb-1">Rp {hasil.maxValue.toLocaleString()}</h2>
                      <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Total Laba Maksimal</p>
                      
                      <div className="grid grid-cols-1 gap-4 mt-12">
                        {tanaman.map((t, i) => (
                          <div key={i} className="bg-white/10 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-black text-emerald-300 uppercase mb-1">Target Produksi {t.nama}</p>
                              <p className="text-4xl font-black text-white">{hasil.solutions[i]?.toFixed(1)} <span className="text-sm font-normal opacity-40 italic">Unit/Ha</span></p>
                            </div>
                            <div className="p-4 bg-emerald-500/20 rounded-full text-emerald-300"><CheckCircle2 size={32}/></div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
                 <button onClick={()=>setActiveStep('input')} className="w-full py-6 rounded-[2.5rem] bg-white border-2 border-emerald-950 text-emerald-950 font-black flex items-center justify-center gap-3 shadow-lg active:scale-95 transition">
                   <ArrowDownWideArrow size={24}/> ANALISIS ULANG
                 </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: UBER TANI */}
        {tab === 'uber' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-emerald-950 tracking-tighter">Marketplace.</h2>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                <Chip active={uberCat==='bahan'} label="Bahan Baku" icon={<Package size={16}/>} onClick={()=>setUberCat('bahan')}/>
                <Chip active={uberCat==='alat'} label="Sewa Alat" icon={<TruckIcon size={16}/>} onClick={()=>setUberCat('alat')}/>
                <Chip active={uberCat==='jasa'} label="Layanan Ahli" icon={<UserCheck size={16}/>} onClick={()=>setUberCat('jasa')}/>
              </div>
              <div className="relative">
                 <input className="w-full p-5 bg-white rounded-3xl border-none shadow-sm pl-14 font-medium" placeholder="Cari benih, pupuk, traktor..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
                 <Search className="absolute left-5 top-5 text-slate-300" size={24}/>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
               {MARKET_DATA[uberCat].map((item: any) => (
                 <Card key={item.id} item={item} onBuy={(x:any)=>setCheckoutItem({...x, qty:1, type: uberCat, totalPrice: x.price})}/>
               ))}
            </div>
          </div>
        )}

        {/* VIEW: RIWAYAT */}
        {tab === 'riwayat' && (
          <div className="space-y-8 animate-in fade-in">
            <h2 className="text-4xl font-black text-emerald-950 tracking-tighter">Progres Pesanan.</h2>
            <div className="space-y-6">
               {orders.length === 0 ? (
                 <div className="p-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 text-slate-300 font-black italic">TIDAK ADA DATA.</div>
               ) : (
                 orders.map((ord: any) => <TrackingCard key={ord.id} order={ord} />)
               )}
            </div>
          </div>
        )}
      </main>

      {/* DYNAMIC NAVIGATION BAR */}
      <nav className="fixed bottom-8 left-8 right-8 bg-emerald-950/95 backdrop-blur-3xl text-white rounded-[3rem] p-3 flex justify-around items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] max-w-sm mx-auto border border-white/10">
         <NavTab active={tab==='optimasi'} icon={<Calculator size={22}/>} label="Optima" onClick={()=>setTab('optimasi')}/>
         <NavTab active={tab==='uber'} icon={<ShoppingBag size={22}/>} label="Beli" onClick={()=>setTab('uber')}/>
         <NavTab active={tab==='riwayat'} icon={<History size={22}/>} label="Lacak" onClick={()=>setTab('riwayat')}/>
      </nav>

      {/* CHECKOUT SYSTEM (MODAL) */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-md z-[100] flex items-end justify-center">
           <div className="bg-white w-full max-w-xl rounded-t-[4rem] shadow-2xl animate-in slide-in-from-bottom-20 duration-500 overflow-hidden">
              <div className="p-10 space-y-8">
                 {!proof ? (
                   <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black italic tracking-tighter">Checkout Detail</h3>
                      <button onClick={()=>setCheckoutItem(null)} className="p-3 bg-slate-100 rounded-full"><X size={20}/></button>
                    </div>

                    <div className="flex gap-6 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                      <img src={checkoutItem.img} className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                      <div className="flex-1">
                        <p className="font-black text-emerald-950 text-lg leading-tight">{checkoutItem.name}</p>
                        <p className="text-xl font-black text-emerald-600 mt-1">Rp {checkoutItem.price.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-2 bg-white w-fit px-3 py-1 rounded-full border shadow-sm">
                           <Star size={12} className="fill-yellow-400 text-yellow-400 border-none"/> {checkoutItem.rate} • Terjual {checkoutItem.sold}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 items-end">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Jumlah Beli</label>
                         <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border">
                            <button onClick={()=>setCheckoutItem({...checkoutItem, qty: Math.max(1, checkoutItem.qty-1), totalPrice: Math.max(1, checkoutItem.qty-1) * checkoutItem.price})} className="bg-white p-2 rounded-xl shadow-sm"><MinusCircle size={24}/></button>
                            <span className="font-black text-xl">{checkoutItem.qty}</span>
                            <button onClick={()=>setCheckoutItem({...checkoutItem, qty: checkoutItem.qty+1, totalPrice: (checkoutItem.qty+1) * checkoutItem.price})} className="bg-white p-2 rounded-xl shadow-sm"><PlusCircle size={24}/></button>
                         </div>
                       </div>
                       <div className="text-right space-y-1 pr-2">
                         <p className="text-[10px] font-black uppercase text-slate-400">Grand Total</p>
                         <p className="text-3xl font-black text-emerald-950 tracking-tighter">Rp {checkoutItem.totalPrice.toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="bg-emerald-950 p-8 rounded-[3rem] flex items-center justify-between shadow-2xl border border-white/10">
                       <div className="flex items-center gap-4">
                         <div className="bg-white p-2 rounded-2xl"><QrCode size={32} className="text-emerald-950"/></div>
                         <div className="text-white">
                            <p className="text-[8px] font-bold uppercase opacity-60">Metode Bayar</p>
                            <p className="text-sm font-black italic">QRIS Instan</p>
                         </div>
                       </div>
                       <label className="bg-yellow-400 text-emerald-950 px-6 py-3 rounded-2xl font-black text-xs cursor-pointer active:scale-95 transition-all shadow-lg">
                          BUKTI BAYAR
                          <input type="file" className="hidden" onChange={e=>setProof(e.target.files?.[0] || null)} />
                       </label>
                    </div>
                   </>
                 ) : (
                   <div className="text-center space-y-8 py-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black italic">Verifikasi Bayar</h3>
                        <button onClick={()=>setProof(null)} className="p-3 bg-slate-100 rounded-full"><X size={20}/></button>
                      </div>
                      <div className="relative group">
                        <img src={preview!} className="w-full h-72 object-cover rounded-[3rem] border-8 border-emerald-50 shadow-inner" />
                        <div className="absolute inset-0 bg-black/20 rounded-[3rem] opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                           <ImageIcon className="text-white" size={48}/>
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm">
                         <p className="text-xs font-black text-emerald-600 uppercase mb-1">Total Pembayaran</p>
                         <p className="text-3xl font-black text-emerald-950">Rp {checkoutItem.totalPrice.toLocaleString()}</p>
                      </div>
                      <button onClick={()=>handleInstantConfirm()} className="w-full bg-emerald-950 text-white py-6 rounded-[2.5rem] font-black shadow-2xl text-xl flex items-center justify-center gap-4 active:scale-95 transition-all">
                        SELESAI & BAYAR <ArrowRight size={24}/>
                      </button>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- COMPLEX UI SUB-COMPONENTS ---

function Section({ title, children, onAdd }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{title}</h4>
        <button onClick={onAdd} className="bg-white text-emerald-700 p-2 rounded-2xl shadow-sm border border-slate-100 hover:bg-emerald-50 transition-colors"><Plus size={18}/></button>
      </div>
      <div className="space-y-3 px-2">{children}</div>
    </div>
  );
}

function NavTab({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1.5 p-4 rounded-[2rem] transition-all duration-500 ${active ? 'bg-white text-emerald-950 shadow-2xl scale-110' : 'text-emerald-100/40 hover:text-white'}`}>
      {icon} <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>{label}</span>
    </button>
  );
}

function Chip({ active, label, icon, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.1em] whitespace-nowrap transition-all border-2 ${active ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`}>
      {icon} {label}
    </button>
  );
}

function Card({ item, onBuy }: any) {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 p-6 shadow-sm hover:shadow-2xl transition-all group flex gap-6 items-center animate-in slide-in-from-bottom">
       <div className="relative overflow-hidden rounded-[2rem] w-32 h-32 shrink-0 shadow-lg">
         <img src={item.img} className="w-full h-full object-cover group-hover:scale-125 transition duration-1000" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
       </div>
       <div className="flex-1 space-y-2">
         <h4 className="font-black text-emerald-950 text-lg leading-tight line-clamp-1">{item.name}</h4>
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide italic line-clamp-1">{item.desc}</p>
         <div className="flex justify-between items-center pt-2">
           <p className="font-black text-xl text-emerald-700 tracking-tighter">Rp {item.price.toLocaleString()}</p>
           <button onClick={()=>onBuy(item)} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-90 transition-transform">BELI</button>
         </div>
       </div>
    </div>
  );
}

function TrackingCard({ order }: any) {
  const steps = ["Order", "Proses", "Kirim", "Sampai", "Selesai"];
  const progress: any = { "Diproses": 2, "Dikirim": 3, "Sampai": 4, "Pesanan Selesai": 5 };
  const current = progress[order.status] || 1;

  return (
    <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-50 space-y-8 animate-in slide-in-from-left">
       <div className="flex justify-between items-start">
         <div className="space-y-1">
           <div className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-3 py-1 rounded-full w-fit border border-emerald-100">{order.type}</div>
           <h4 className="font-black text-xl text-emerald-950 mt-2 leading-none">{order.itemName}</h4>
           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1 flex items-center gap-1"><Clock size={12}/> {order.createdAt?.toDate().toLocaleDateString('id-ID')}</p>
         </div>
         <p className="font-black text-xl text-emerald-900">Rp {order.total?.toLocaleString()}</p>
       </div>
       
       <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest italic">{order.status}</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{current * 20}%</span>
          </div>
          <div className="h-4 bg-slate-50 rounded-full p-1 border">
             <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ width: `${current * 20}%` }}></div>
          </div>
          <div className="grid grid-cols-5 text-[8px] font-black text-slate-300 uppercase text-center px-1">
             {steps.map((s, i) => (
               <span key={i} className={current > i ? 'text-emerald-900' : ''}>{s}</span>
             ))}
          </div>
       </div>
    </div>
  );
}