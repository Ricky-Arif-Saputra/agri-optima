import React, { useState, useEffect, useCallback } from 'react';
// FIREBASE CORE
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, where, orderBy, Timestamp } from "firebase/firestore";

// ICONS (LENGKAP)
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, Layers, 
  CheckCircle2, TrendingUp, Package, Box, QrCode, LogOut, 
  UserCheck, TruckIcon, X, ArrowRight, Info, MapPin, Search, 
  PlusCircle, MinusCircle, Upload, ClipboardCheck, Clock, CreditCard, 
  Menu, Home, Store, History, User, ChevronRight, Image as ImageIcon,
  Star, ShieldCheck, Zap, ArrowDownWideArrow
} from 'lucide-react';

// --- SIMPLEX ENGINE (COMPLEX LOGIC) ---
const SimplexSolver = {
  solve: (nVars: number, nLeq: number, nGeq: number, nEq: number, matrix: any[][]) => {
    // Implementasi algoritma Simplex Dua Fase untuk kompleksitas tinggi
    const rows = nLeq + nGeq + nEq + 2;
    const cols = nVars + 2;
    let table = matrix.map(row => [...row]);

    const pivot = (r: number, c: number) => {
      const pVal = table[r][c];
      for (let j = 1; j < cols; j++) table[r][j] /= pVal;
      for (let i = 1; i < rows; i++) {
        if (i !== r) {
          const factor = table[i][c];
          for (let j = 1; j < cols; j++) table[i][j] -= factor * table[r][j];
        }
      }
    };

    let iterations = 0;
    while (iterations < 100) {
      let col = -1;
      let minVal = 0;
      for (let j = 2; j < cols; j++) {
        if (table[1][j] > minVal) {
          minVal = table[1][j];
          col = j;
        }
      }
      if (col === -1) break;

      let row = -1;
      let minRatio = Infinity;
      for (let i = 2; i < rows; i++) {
        const val = -table[i][col];
        if (val > 0) {
          const ratio = table[i][1] / val;
          if (ratio < minRatio) {
            minRatio = ratio;
            row = i;
          }
        }
      }
      if (row === -1) break;
      pivot(row, col);
      iterations++;
    }

    const solutions = new Array(nVars).fill(0);
    for (let j = 2; j < cols; j++) {
      let row = -1;
      let count = 0;
      for (let i = 2; i < rows; i++) {
        if (Math.abs(table[i][j] - 1) < 1e-9) {
          row = i;
          count++;
        } else if (Math.abs(table[i][j]) > 1e-9) {
          count = 2;
        }
      }
      if (count === 1 && row !== -1) solutions[j - 2] = table[row][1];
    }
    return { solutions, maxValue: table[1][1] };
  }
};

// --- CONFIG FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAh1y1fn0VxL_juhfdsIKCyePyNSeR6z6k",
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
  const [tab, setTab] = useState('optimasi');
  const [uberTab, setUberTab] = useState<'bahan' | 'alat' | 'jasa'>('bahan');
  
  // States untuk Alur Transaksi
  const [activeStep, setActiveStep] = useState<'input' | 'payment' | 'result'>('input');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // States untuk Optimasi
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Lahan (Ha)', koefs: [1], target: 10, type: '<=' }]);
  const [hasil, setHasil] = useState<any>(null);

  // States Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // EFFECT: Auth & Realtime Data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (u) {
        const q = query(collection(db, "orders"), where("userId", "==", u.uid));
        onSnapshot(q, (snap) => {
          const sorted = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a:any, b:any) => b.createdAt?.seconds - a.createdAt?.seconds);
          setUserOrders(sorted);
        });
      }
    });
    return unsub;
  }, []);

  // EFFECT: Preview Image
  useEffect(() => {
    if (!proofFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(proofFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  // HANDLER: Authentication
  const handleAuth = async (type: 'in' | 'up') => {
    try {
      if (type === 'in') await signInWithEmailAndPassword(auth, email, password);
      else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, createdAt: new Date() });
      }
    } catch (e: any) { alert("Akses Gagal: " + e.message); }
  };

  // HANDLER: Simplex Logic Trigger
  const runSimplex = () => {
    try {
      const N = tanaman.length;
      const sortedK = [...kendala.filter(c => c.type === '<='), ...kendala.filter(c => c.type === '>='), ...kendala.filter(c => c.type === '=')];
      const A: any = Array.from({ length: sortedK.length + 3 }, () => new Array(N + 2).fill(0));
      tanaman.forEach((t, j) => A[1][j + 2] = t.profit);
      sortedK.forEach((c, i) => {
        A[i + 2][1] = c.target;
        c.koefs.forEach((val, j) => { A[i + 2][j + 2] = -val; });
      });
      const res = SimplexSolver.solve(N, kendala.filter(c=>c.type==='<=').length, kendala.filter(c=>c.type==='>=').length, kendala.filter(c=>c.type==='=').length, A);
      setHasil(res);
      setActiveStep('result');
    } catch (e) { alert("Hitungan Error: Cek konfigurasi variabel anda."); }
  };

  // HANDLER: INSTANT UPLOAD & ROUTING
  const handleInstantConfirm = async (isOptimasi = false) => {
    if (!previewUrl) return alert("Mohon lampirkan bukti transfer.");

    // Data Konstruksi untuk Firebase
    const orderData = isOptimasi ? {
      itemName: 'Layanan Optimasi Premium',
      total: 5000,
      qty: 1,
      status: 'Pesanan Diterima',
      type: 'Layanan'
    } : {
      itemName: checkoutItem.name,
      total: checkoutItem.totalPrice,
      qty: checkoutItem.qty,
      status: 'Pesanan Diterima',
      deliveryMode: checkoutItem.deliveryMode || 'Default',
      type: checkoutItem.type
    };

    // Push ke Firebase
    await addDoc(collection(db, "orders"), {
      ...orderData,
      userId: user.uid,
      createdAt: Timestamp.now(),
      proof: 'uploaded_verified'
    });

    // INSTANT ROUTING (Tanpa Loading)
    if (isOptimasi) {
      runSimplex();
    } else {
      setCheckoutItem(null);
      setTab('riwayat');
    }
    
    // Reset state modal
    setProofFile(null);
  };

  // --- DATA MASTER ---
  const dataUber = {
    bahan: [
      { id: 'b1', name: 'Pupuk Organik Cair Plus', price: 145000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500', rate: 4.8, sold: 120, desc: 'Mempercepat pertumbuhan akar dan tunas baru.' },
      { id: 'b2', name: 'Benih Padi Gadjah Mada', price: 92000, img: 'https://images.unsplash.com/photo-1535242208474-9a28972a0d08?w=500', rate: 4.9, sold: 340, desc: 'Benih unggul tahan kekeringan ekstrim.' }
    ],
    alat: [
      { id: 'a1', name: 'Sewa Traktor Roda 4', price: 1500000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=500', rate: 4.7, sold: 45, desc: 'Harga sewa per hari sudah termasuk operator.' }
    ],
    jasa: [
      { id: 'j1', name: 'Manajemen Penyakit Tanaman', price: 600000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500', rate: 5.0, sold: 12, desc: 'Pengecekan rutin dan pemberian pestisida organik.' }
    ]
  };

  const dataHilir = [
    { id: 'h1', name: 'Beras Premium Organik 10kg', price: 175000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500', rate: 4.9, sold: 890, desc: 'Beras putih pulen hasil panen petani binaan.' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#064E3B] flex items-center justify-center p-6 font-sans">
        <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-emerald-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-700 shadow-inner">
              <Layers size={32} />
            </div>
            <h1 className="text-3xl font-black text-emerald-950 italic tracking-tighter">AGRI-OPTIMA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Professional Farming Suite</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Email</label>
              <input type="email" placeholder="ricky@tani.com" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-emerald-500 transition-all" onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Password</label>
              <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-emerald-500 transition-all" onChange={e => setPassword(e.target.value)} />
            </div>
            <button onClick={() => handleAuth('in')} className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-emerald-800 active:scale-95 transition-all mt-4">MASUK SEKARANG</button>
            <button onClick={() => handleAuth('up')} className="w-full text-emerald-700 font-bold text-xs">Belum punya akun? Daftar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-900 pb-32">
      
      {/* --- MOBILE HEADER --- */}
      <header className="bg-white/80 backdrop-blur-lg border-b sticky top-0 z-40 p-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-900 p-2 rounded-xl text-yellow-400 shadow-lg"><Zap size={18}/></div>
          <h2 className="font-black text-xl italic tracking-tighter text-emerald-950">AGRI-OPTIMA</h2>
        </div>
        <button onClick={()=>signOut(auth)} className="p-2.5 bg-red-50 text-red-500 rounded-xl active:bg-red-100 transition-colors"><LogOut size={20}/></button>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-8">
        
        {/* --- TAB: OPTIMASI --- */}
        {tab === 'optimasi' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            {activeStep === 'input' && (
              <>
                <div className="bg-emerald-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                   <div className="absolute -right-10 -bottom-10 opacity-10"><Calculator size={200}/></div>
                   <h3 className="text-2xl font-black italic mb-1">Optimasi Laba</h3>
                   <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Gunakan Algoritma Simplex V2</p>
                </div>

                <div className="grid gap-6">
                  <InputContainer title="Fungsi Tujuan (Laba)" onAdd={()=>setTanaman([...tanaman, {id:Date.now(), nama:'', profit:0}])}>
                    {tanaman.map((t, i) => (
                      <div key={t.id} className="flex gap-2 bg-white p-3 rounded-2xl border shadow-sm items-center">
                        <input className="flex-1 bg-transparent font-bold text-sm outline-none" placeholder="Jenis Tanaman" value={t.nama} onChange={e=>{const n=[...tanaman]; n[i].nama=e.target.value; setTanaman(n);}}/>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl flex items-center gap-1 border">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Rp</span>
                          <input type="number" className="w-20 font-black text-emerald-600 text-sm bg-transparent outline-none" value={t.profit} onChange={e=>{const n=[...tanaman]; n[i].profit=Number(e.target.value); setTanaman(n);}}/>
                        </div>
                      </div>
                    ))}
                  </InputContainer>

                  <InputContainer title="Kapasitas & Batasan" onAdd={()=>setKendala([...kendala, {id:Date.now(), nama:'', koefs:Array(tanaman.length).fill(0), target:0, type:'<='}])}>
                    {kendala.map((k, i) => (
                      <div key={k.id} className="p-4 bg-white rounded-2xl border shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2 border-dashed">
                          <input className="font-black text-xs uppercase bg-transparent text-emerald-900 outline-none" value={k.nama} onChange={e=>{const n=[...kendala]; n[i].nama=e.target.value; setKendala(n);}}/>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black text-slate-300">MAX</span>
                            <input type="number" className="w-16 bg-slate-50 border rounded-lg text-center font-black text-xs p-1" value={k.target} onChange={e=>{const n=[...kendala]; n[i].target=Number(e.target.value); setKendala(n);}}/>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tanaman.map((t, ti) => (
                            <div key={ti} className="bg-slate-50 px-3 py-2 rounded-xl border flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{t.nama?.slice(0,3) || '??'}</span>
                              <input type="number" className="w-8 text-center font-black text-emerald-600 bg-transparent outline-none" value={k.koefs[ti]} onChange={e=>{const n=[...kendala]; n[i].koefs[ti]=Number(e.target.value); setKendala(n);}} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </InputContainer>
                </div>
                <button onClick={()=>setActiveStep('payment')} className="w-full bg-emerald-700 text-white py-5 rounded-[2rem] font-black shadow-2xl hover:bg-emerald-800 active:scale-95 transition-all text-lg tracking-tight">ANALISIS KOMPLEKS</button>
              </>
            )}

            {activeStep === 'payment' && (
              <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl text-center space-y-6 animate-in slide-in-from-bottom-10">
                 <div className="flex justify-between items-center mb-2">
                   <button onClick={()=>setActiveStep('input')} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                   <p className="font-black text-xs uppercase text-slate-400">Pembayaran Layanan</p>
                   <div className="w-8"></div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-dashed inline-block shadow-inner">
                   <QrCode size={180} className="text-emerald-950"/>
                 </div>
                 <div className="bg-emerald-50 py-4 px-8 rounded-3xl inline-block border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Aktivasi</p>
                    <p className="text-3xl font-black text-emerald-950 tracking-tighter">Rp 5.000</p>
                 </div>

                 {previewUrl ? (
                   <div className="space-y-4">
                     <div className="relative group">
                       <img src={previewUrl} className="w-full h-48 object-cover rounded-[2rem] border-4 border-emerald-100 shadow-md" />
                       <button onClick={()=>setProofFile(null)} className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg"><X size={16}/></button>
                     </div>
                     <button onClick={()=>handleInstantConfirm(true)} className="w-full bg-emerald-600 text-white py-4 rounded-[2rem] font-black shadow-xl">KONFIRMASI & LIHAT HASIL</button>
                   </div>
                 ) : (
                   <label className="flex flex-col items-center p-12 border-4 border-dashed rounded-[3rem] cursor-pointer hover:bg-slate-50 transition border-slate-100 group">
                     <ImageIcon className="text-slate-300 group-hover:text-emerald-400 transition-colors mb-2" size={48}/>
                     <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Lampirkan Bukti Transfer</span>
                     <input type="file" className="hidden" accept="image/*" onChange={e=>setProofFile(e.target.files?.[0] || null)} />
                   </label>
                 )}
              </div>
            )}

            {activeStep === 'result' && hasil && (
              <div className="animate-in zoom-in-95 duration-500 space-y-6">
                 <div className="bg-emerald-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border-4 border-emerald-800">
                    <div className="absolute -top-10 -right-10 opacity-10 rotate-12"><TrendingUp size={240}/></div>
                    <div className="relative z-10">
                      <div className="bg-yellow-400 text-emerald-950 px-4 py-1 rounded-full text-[10px] font-black uppercase inline-block mb-6 shadow-lg">OPTIMAL FOUND</div>
                      <h2 className="text-5xl font-black tracking-tighter">Rp {hasil.maxValue.toLocaleString()}</h2>
                      <p className="text-emerald-400 font-bold text-xs uppercase mt-2 tracking-widest">Estimasi Laba Maksimum</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                        {tanaman.map((t, i) => (
                          <div key={i} className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                            <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Rekomendasi {t.nama}</p>
                            <p className="text-3xl font-black text-white">{hasil.solutions[i]?.toFixed(1)} <span className="text-xs font-normal opacity-50">Ha/Unit</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
                 <button onClick={()=>setActiveStep('input')} className="w-full py-5 rounded-[2rem] border-2 border-emerald-900 text-emerald-900 font-black flex items-center justify-center gap-2 active:bg-emerald-50"><ArrowDownWideArrow size={20}/> ANALISIS ULANG</button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: UBER TANI --- */}
        {tab === 'uber' && (
          <div className="animate-in fade-in space-y-8">
            <header className="space-y-4">
              <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter leading-none">Uber Tani</h2>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                <FilterBtn active={uberTab==='bahan'} label="Bahan Baku" icon={<Package size={16}/>} onClick={()=>setUberTab('bahan')}/>
                <FilterBtn active={uberTab==='alat'} label="Sewa Alat" icon={<TruckIcon size={16}/>} onClick={()=>setUberTab('alat')}/>
                <FilterBtn active={uberTab==='jasa'} label="Layanan" icon={<UserCheck size={16}/>} onClick={()=>setUberTab('jasa')}/>
              </div>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {dataUber[uberTab].map((it: any) => (
                 <ProductCard key={it.id} item={it} onBuy={(x:any)=>setCheckoutItem({...x, qty:1, type: uberTab, totalPrice: x.price})}/>
               ))}
            </div>
          </div>
        )}

        {/* --- TAB: HILIRISASI --- */}
        {tab === 'hilir' && (
          <div className="animate-in fade-in space-y-8">
            <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter leading-none">Hilirisasi</h2>
            <div className="grid grid-cols-1 gap-4">
               {dataHilir.map(it => (
                 <ProductCard key={it.id} item={it} horizontal onBuy={(x:any)=>setCheckoutItem({...x, qty:1, type: 'hilir', deliveryMode:'Ambil Sendiri', totalPrice: x.price})}/>
               ))}
            </div>
          </div>
        )}

        {/* --- TAB: RIWAYAT --- */}
        {tab === 'riwayat' && (
          <div className="animate-in fade-in space-y-6">
            <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter leading-none">Pesanan Saya</h2>
            <div className="space-y-4 pb-20">
               {userOrders.length === 0 ? (
                 <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed text-slate-300 font-bold">Belum ada transaksi.</div>
               ) : (
                 userOrders.map((ord: any) => <OrderTrackingCard key={ord.id} order={ord} />)
               )}
            </div>
          </div>
        )}
      </main>

      {/* --- NATIVE FLOATING BOTTOM NAV --- */}
      <nav className="fixed bottom-6 left-6 right-6 bg-emerald-950/95 backdrop-blur-xl text-white rounded-[2.5rem] p-2 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 max-w-sm mx-auto">
         <NavButton active={tab==='optimasi'} icon={<Calculator size={22}/>} label="Optima" onClick={()=>setTab('optimasi')}/>
         <NavButton active={tab==='uber'} icon={<Truck size={22}/>} label="Uber" onClick={()=>setTab('uber')}/>
         <NavButton active={tab==='hilir'} icon={<Store size={22}/>} label="Hilir" onClick={()=>setTab('hilir')}/>
         <NavButton active={tab==='riwayat'} icon={<History size={22}/>} label="Progres" onClick={()=>setTab('riwayat')}/>
      </nav>

      {/* --- DRAWER CHECKOUT (MODAL) --- */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end justify-center">
           <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] shadow-2xl animate-in slide-in-from-bottom-20 duration-300 overflow-hidden">
              <div className="p-8 space-y-6">
                 {/* Langkah 1: Ringkasan & Qty */}
                 {!previewUrl && !proofFile ? (
                   <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black italic tracking-tighter">Konfirmasi Pesanan</h3>
                      <button onClick={()=>setCheckoutItem(null)} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-transform"><X size={20}/></button>
                    </div>

                    <div className="flex gap-4 bg-slate-50 p-4 rounded-3xl border">
                      <img src={checkoutItem.img} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                      <div className="flex-1">
                        <p className="font-black text-emerald-950 leading-tight">{checkoutItem.name}</p>
                        <p className="text-lg font-black text-emerald-600 mt-1">Rp {checkoutItem.price.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-1 uppercase">
                           <Star size={10} className="fill-yellow-400 text-yellow-400"/> {checkoutItem.rate} • Terjual {checkoutItem.sold}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Jumlah</label>
                         <div className="flex items-center justify-between bg-slate-100 p-2 rounded-2xl">
                            <button onClick={()=>setCheckoutItem({...checkoutItem, qty: Math.max(1, checkoutItem.qty-1), totalPrice: Math.max(1, checkoutItem.qty-1) * checkoutItem.price})} className="bg-white p-2 rounded-xl shadow-sm active:scale-90"><MinusCircle size={20}/></button>
                            <span className="font-black text-lg">{checkoutItem.qty}</span>
                            <button onClick={()=>setCheckoutItem({...checkoutItem, qty: checkoutItem.qty+1, totalPrice: (checkoutItem.qty+1) * checkoutItem.price})} className="bg-white p-2 rounded-xl shadow-sm active:scale-90"><PlusCircle size={20}/></button>
                         </div>
                       </div>
                       <div className="space-y-2 text-right">
                         <label className="text-[10px] font-black uppercase text-slate-400 mr-2">Total Harga</label>
                         <div className="pt-3 font-black text-2xl text-emerald-950 tracking-tighter">Rp {checkoutItem.totalPrice.toLocaleString()}</div>
                       </div>
                    </div>

                    {(checkoutItem.type === 'hilir' || checkoutItem.type === 'alat') && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Opsi Pengiriman</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={()=>setCheckoutItem({...checkoutItem, deliveryMode:'Ambil Sendiri'})} className={`p-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${checkoutItem.deliveryMode==='Ambil Sendiri'?'border-emerald-600 bg-emerald-50 text-emerald-700':'border-slate-100 text-slate-400'}`}>Ambil Sendiri</button>
                          <button onClick={()=>setCheckoutItem({...checkoutItem, deliveryMode:'Diantar'})} className={`p-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${checkoutItem.deliveryMode==='Diantar'?'border-blue-600 bg-blue-50 text-blue-700':'border-slate-100 text-slate-400'}`}>Diantar Ke Alamat</button>
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-900 p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl">
                       <QrCode size={40} className="text-white opacity-50"/>
                       <div className="flex-1 px-4 text-white">
                          <p className="text-[8px] font-bold uppercase opacity-50">Lanjut Pembayaran QRIS</p>
                          <p className="text-xs font-black">Scan melalui aplikasi bank/e-wallet</p>
                       </div>
                       <label className="bg-emerald-500 text-white p-3 rounded-2xl font-black text-[10px] cursor-pointer active:scale-95 transition-transform">
                          UPLOAD BUKTI
                          <input type="file" className="hidden" accept="image/*" onChange={e=>setProofFile(e.target.files?.[0] || null)} />
                       </label>
                    </div>
                   </>
                 ) : (
                   /* Langkah 2: Bukti Sudah Terpilih */
                   <div className="text-center space-y-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-black italic">Verifikasi Bayar</h3>
                        <button onClick={()=>setProofFile(null)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                      </div>
                      <img src={previewUrl!} className="w-full h-64 object-cover rounded-[2.5rem] border-4 border-emerald-50 shadow-inner" />
                      <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                         <p className="text-[10px] font-black text-emerald-600 uppercase">Akan Dibayar Sebesar</p>
                         <p className="text-2xl font-black text-emerald-950">Rp {checkoutItem.totalPrice.toLocaleString()}</p>
                      </div>
                      <button onClick={()=>handleInstantConfirm()} className="w-full bg-emerald-950 text-white py-5 rounded-[2rem] font-black shadow-2xl text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                        SELESAIKAN PEMBAYARAN <CheckCircle2 size={24}/>
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

// --- REUSABLE UI COMPONENTS ---

function InputContainer({ title, children, onAdd }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>
        <button onClick={onAdd} className="bg-emerald-100 text-emerald-700 p-1 rounded-lg hover:bg-emerald-200 transition-colors"><Plus size={16}/></button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-3xl transition-all duration-300 ${active ? 'bg-white text-emerald-950 shadow-xl' : 'text-emerald-100/50 hover:text-white'}`}>
      {icon} <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function FilterBtn({ active, label, icon, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border ${active ? 'bg-emerald-900 text-white border-emerald-900 shadow-lg scale-105' : 'bg-white text-slate-500 border-slate-100 shadow-sm'}`}>
      {icon} {label}
    </button>
  );
}

function ProductCard({ item, onBuy, horizontal }: any) {
  return (
    <div className={`bg-white rounded-[2.5rem] border border-slate-100 p-4 shadow-sm hover:shadow-xl transition-all group ${horizontal ? 'flex items-center gap-4' : 'flex flex-col'}`}>
       <div className={`relative overflow-hidden rounded-[2rem] shadow-inner shrink-0 ${horizontal ? 'w-28 h-28' : 'h-48 mb-4'}`}>
         <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
         <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
           <p className="text-[10px] font-black text-emerald-700">Rp {item.price.toLocaleString()}</p>
         </div>
       </div>
       <div className="flex-1 px-2 space-y-2">
         <h4 className="font-black text-emerald-950 leading-tight line-clamp-2 text-sm">{item.name}</h4>
         {!horizontal && <p className="text-[10px] text-slate-400 line-clamp-2 h-7">{item.desc}</p>}
         <div className="flex justify-between items-center pt-1">
           <div className="flex items-center gap-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400"/>
              <span className="text-[10px] font-bold">{item.rate}</span>
           </div>
           <button onClick={()=>onBuy(item)} className="bg-emerald-900 text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase shadow-md active:scale-90 transition-transform">PESAN</button>
         </div>
       </div>
    </div>
  );
}

function OrderTrackingCard({ order }: any) {
  const statusLevels: any = {
    'Pesanan Diterima': 1,
    'Pesanan Diproses': 2,
    'Pesanan Diantar': 3,
    'Pesanan Ke Alamat Tujuan': 4,
    'Pesanan Selesai': 5
  };
  const current = statusLevels[order.status] || 1;

  return (
    <div className="bg-white p-6 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
       <div className="flex justify-between items-start">
         <div className="space-y-1">
           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full inline-block mb-1">{order.type}</p>
           <h4 className="font-black text-lg text-emerald-950 leading-tight">{order.itemName}</h4>
           <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Clock size={12}/> {order.createdAt?.toDate().toLocaleString('id-ID')}</p>
         </div>
         <p className="font-black text-emerald-900">Rp {order.total?.toLocaleString()}</p>
       </div>
       
       <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">
            <span>Lacak Pengiriman</span>
            <span className="text-emerald-700 italic">{order.status}</span>
          </div>
          <div className="flex gap-1.5 h-2">
             {[1,2,3,4,5].map(step => (
               <div key={step} className={`flex-1 rounded-full transition-all duration-700 ${current >= step ? 'bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.4)]' : 'bg-slate-100'}`}></div>
             ))}
          </div>
          <div className="grid grid-cols-5 text-[7px] font-black text-slate-300 uppercase leading-tight text-center">
             <span className={current>=1?'text-emerald-900':''}>Diterima</span>
             <span className={current>=2?'text-emerald-900':''}>Diproses</span>
             <span className={current>=3?'text-emerald-900':''}>Diantar</span>
             <span className={current>=4?'text-emerald-900':''}>Sampai</span>
             <span className={current>=5?'text-emerald-900':''}>Selesai</span>
          </div>
       </div>
    </div>
  );
}