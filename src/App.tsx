import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, where, Timestamp } from "firebase/firestore";
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, Layers, 
  CheckCircle2, TrendingUp, Package, Box, QrCode, LogOut, 
  UserCheck, TruckIcon, X, ArrowRight, Info, MapPin, Search, 
  PlusCircle, MinusCircle, Upload, ClipboardCheck, Clock, CreditCard, 
  Menu, Home, Store, History, User, ChevronRight, Image as ImageIcon,
  AlertCircle, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Tambahkan framer-motion jika sudah install
import { SimplexSolver } from './lib/simplex';

// --- FIREBASE CONFIG ---
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

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('optimasi');
  const [uberCategory, setUberCategory] = useState<'bahan' | 'alat' | 'jasa'>('bahan');
  
  // LOGIC STATES
  const [activeStep, setActiveStep] = useState<'input' | 'payment' | 'result'>('input');
  const [checkoutStep, setCheckoutStep] = useState<'options' | 'qris' | 'processing'>('options');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // OPTIMASI DATA
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Lahan (Ha)', koefs: [1], target: 10, type: '<=' }]);
  const [hasil, setHasil] = useState<any>(null);

  // AUTH FORM
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  useEffect(() => {
    if (!proofFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(proofFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  // --- LOGIC HANDLERS ---
  const handleAuth = async (type: 'login' | 'reg') => {
    try {
      if (type === 'login') await signInWithEmailAndPassword(auth, email, password);
      else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, createdAt: new Date() });
      }
    } catch (err: any) { alert(err.message); }
  };

  const executeSimplex = () => {
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
    } catch (e) { alert("Input tidak valid untuk perhitungan."); }
  };

  const processTransaction = async (isOptimasi = false) => {
    if (!previewUrl) return;
    
    setCheckoutStep('processing');
    
    const finalData = isOptimasi ? {
      itemName: 'Layanan Optimasi Laba',
      total: 5000,
      qty: 1,
      status: 'Pesanan Diterima',
      type: 'layanan'
    } : {
      itemName: checkoutItem.name,
      total: checkoutItem.totalPrice,
      qty: checkoutItem.qty,
      status: 'Pesanan Diterima',
      deliveryMode: checkoutItem.deliveryMode || 'Standar',
      type: checkoutItem.type
    };

    try {
      await addDoc(collection(db, "orders"), {
        ...finalData,
        userId: user.uid,
        createdAt: Timestamp.now(),
        proofImg: 'verified_upload'
      });

      // Cleanup
      setTimeout(() => {
        setCheckoutStep('options');
        setCheckoutItem(null);
        setProofFile(null);
        
        if (isOptimasi) {
          executeSimplex();
        } else {
          setTab('riwayat');
        }
      }, 1200);
    } catch (err) {
      alert("Gagal memproses. Coba lagi.");
      setCheckoutStep('qris');
    }
  };

  // --- UI DATA ---
  const products = {
    bahan: [
      { id: 'b1', name: 'NPK Mutiara Premium', price: 185000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500', desc: 'Pupuk pertumbuhan vegetatif & generatif.' },
      { id: 'b2', name: 'Bibit Jagung Pioneer', price: 95000, img: 'https://images.unsplash.com/photo-1551731589-22244e847a19?w=500', desc: 'Varian tahan kemarau & hasil tinggi.' }
    ],
    alat: [
      { id: 'a1', name: 'Drone Sprayer DJI T40', price: 2500000, img: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500', desc: 'Sewa per hari inklusif operator.' },
      { id: 'a2', name: 'Traktor Quick G1000', price: 850000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=500', desc: 'Alat pengolah tanah bertenaga diesel.' }
    ],
    jasa: [
      { id: 'j1', name: 'Analisis Tanah Lab', price: 450000, img: 'https://images.unsplash.com/photo-1532187875605-1fc640c14f1d?w=500', desc: 'Laporan lengkap nutrisi tanah.' }
    ]
  };

  const hilirisasiData = [
    { id: 'h1', name: 'Beras Pandan Wangi 5kg', price: 85000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500', desc: 'Beras organik tanpa pemutih.' }
  ];

  if (!user) return <AuthPage email={email} setEmail={setEmail} pass={password} setPass={setPassword} onAuth={handleAuth} />;

  return (
    <div className="min-h-screen bg-[#FDFEFE] text-slate-900 pb-36">
      {/* HEADER */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-6 py-4 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-emerald-900 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-900/20">
             <Layers size={22} />
           </div>
           <div>
             <h1 className="text-xl font-black tracking-tight text-emerald-950 italic">AGRI-OPTIMA</h1>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Smart Farming System</p>
           </div>
        </div>
        <button onClick={()=>signOut(auth)} className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 transition">
          <LogOut size={18}/>
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-5 md:p-8">
        
        {/* --- TAB OPTIMASI --- */}
        {tab === 'optimasi' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeStep === 'input' && (
              <div className="space-y-8">
                <header>
                  <h2 className="text-3xl font-black text-emerald-950 leading-tight">Optimasi Laba <br/><span className="text-emerald-600">Maksimum.</span></h2>
                  <p className="text-slate-500 text-sm mt-2">Masukkan data luas lahan dan biaya produksi untuk hitungan akurat.</p>
                </header>

                <div className="grid md:grid-cols-2 gap-6">
                  <SectionCard title="Variabel Tanaman" onAdd={()=>setTanaman([...tanaman, {id:Date.now(), nama:'', profit:0}])}>
                    {tanaman.map((t, i) => (
                      <div key={t.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100 focus-within:border-emerald-500 transition">
                        <input className="flex-1 bg-transparent px-2 font-bold text-sm" placeholder="Contoh: Jagung" value={t.nama} onChange={e=>{const n=[...tanaman]; n[i].nama=e.target.value; setTanaman(n);}}/>
                        <div className="bg-white px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
                          <span className="text-[10px] font-black text-slate-300">Rp</span>
                          <input type="number" className="w-20 font-black text-emerald-700 text-sm outline-none" value={t.profit} onChange={e=>{const n=[...tanaman]; n[i].profit=Number(e.target.value); setTanaman(n);}}/>
                        </div>
                      </div>
                    ))}
                  </SectionCard>

                  <SectionCard title="Batasan Kapasitas" onAdd={()=>setKendala([...kendala, {id:Date.now(), nama:'', koefs:Array(tanaman.length).fill(0), target:0, type:'<='}])}>
                    {kendala.map((k, i) => (
                      <div key={k.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <input className="font-bold text-xs uppercase bg-transparent text-emerald-900" value={k.nama} onChange={e=>{const n=[...kendala]; n[i].nama=e.target.value; setKendala(n);}}/>
                          <div className="flex items-center gap-1">
                             <span className="text-[8px] font-bold text-slate-400">MAX</span>
                             <input type="number" className="w-16 bg-white rounded-lg text-center font-black text-xs p-1 shadow-sm" value={k.target} onChange={e=>{const n=[...kendala]; n[i].target=Number(e.target.value); setKendala(n);}}/>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tanaman.map((t, ti) => (
                            <div key={ti} className="bg-white/50 px-2 py-1 rounded-lg text-[9px] flex items-center gap-1">
                              <span className="text-slate-400 font-bold">{t.nama?.slice(0,3)}:</span>
                              <input type="number" className="w-8 text-center font-black text-emerald-600 bg-transparent" value={k.koefs[ti]} onChange={e=>{const n=[...kendala]; n[i].koefs[ti]=Number(e.target.value); setKendala(n);}} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </SectionCard>
                </div>
                <button onClick={()=>setActiveStep('payment')} className="w-full bg-emerald-950 text-white py-5 rounded-[2rem] font-black shadow-2xl hover:bg-black transition active:scale-95 flex items-center justify-center gap-3">
                  ANALISIS SEKARANG <ArrowUpRight size={20}/>
                </button>
              </div>
            )}

            {activeStep === 'payment' && (
              <PaymentModal 
                price={5000} 
                onClose={()=>setActiveStep('input')} 
                onConfirm={()=>processTransaction(true)} 
                previewUrl={previewUrl}
                setFile={setProofFile}
                isProcessing={checkoutStep === 'processing'}
              />
            )}

            {activeStep === 'result' && hasil && (
              <div className="animate-in zoom-in-95 duration-500 space-y-6">
                 <div className="bg-emerald-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border-4 border-emerald-800">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 bg-emerald-400 text-emerald-950 px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-6 shadow-lg shadow-emerald-400/20">
                        <TrendingUp size={14}/> Rekomendasi Teroptimal
                      </div>
                      <h2 className="text-6xl font-black tracking-tighter mb-2">Rp {hasil.maxValue.toLocaleString()}</h2>
                      <p className="text-emerald-400 font-bold text-sm uppercase opacity-80">Estimasi Laba per Periode Panen</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                        {tanaman.map((t, i) => (
                          <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{t.nama}</p>
                            <p className="text-4xl font-black text-white">{hasil.solutions[i]?.toFixed(1)} <span className="text-xs font-normal opacity-50">Unit</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
                 <button onClick={()=>setActiveStep('input')} className="w-full py-4 border-2 border-emerald-950 text-emerald-950 rounded-2xl font-black hover:bg-emerald-50 transition">MULAI ANALISIS BARU</button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB UBER TANI --- */}
        {tab === 'uber' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col gap-4">
              <h2 className="text-3xl font-black text-emerald-950">Uber Tani <span className="text-emerald-600">Market</span></h2>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <FilterTab active={uberCategory==='bahan'} label="Bahan Baku" icon={<Package size={16}/>} onClick={()=>setUberCategory('bahan')}/>
                <FilterTab active={uberCategory==='alat'} label="Sewa Alat" icon={<TruckIcon size={16}/>} onClick={()=>setUberCategory('alat')}/>
                <FilterTab active={uberCategory==='jasa'} label="Manajemen" icon={<UserCheck size={16}/>} onClick={()=>setUberCategory('jasa')}/>
              </div>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {products[uberCategory].map((it: any) => (
                 <ProductCard key={it.id} item={it} onBuy={(x:any)=>setCheckoutItem({...x, qty:1, type: uberCategory, totalPrice: x.price})}/>
               ))}
            </div>
          </div>
        )}

        {/* --- TAB HILIRISASI --- */}
        {tab === 'hilir' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-emerald-950">Hilirisasi <span className="text-emerald-600">Retail.</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {hilirisasiData.map(it => (
                 <ProductCard key={it.id} item={it} onBuy={(x:any)=>setCheckoutItem({...x, qty:1, type: 'hilir', deliveryMode:'Ambil Sendiri', totalPrice: x.price})}/>
               ))}
            </div>
          </div>
        )}

        {/* --- TAB RIWAYAT --- */}
        {tab === 'riwayat' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase">Track Pesanan</h2>
            <div className="grid gap-4">
               {userOrders.length === 0 ? (
                 <div className="p-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                   <Box className="mx-auto text-slate-300 mb-4" size={48}/>
                   <p className="font-bold text-slate-400">Belum ada pesanan aktif.</p>
                 </div>
               ) : (
                 userOrders.map((ord: any) => (
                   <OrderCard key={ord.id} order={ord} />
                 ))
               )}
            </div>
          </div>
        )}
      </main>

      {/* --- FLOATING BOTTOM NAV --- */}
      <div className="fixed bottom-8 left-0 right-0 px-6 z-50">
        <nav className="max-w-md mx-auto bg-emerald-950/95 backdrop-blur-xl border border-white/10 p-2 rounded-[2.5rem] flex justify-between items-center shadow-[0_20px_50px_rgba(6,78,59,0.3)]">
           <NavItem active={tab==='optimasi'} icon={<Calculator size={20}/>} label="Optima" onClick={()=>setTab('optimasi')}/>
           <NavItem active={tab==='uber'} icon={<Truck size={20}/>} label="Uber" onClick={()=>setTab('uber')}/>
           <NavItem active={tab==='hilir'} icon={<Store size={20}/>} label="Hilir" onClick={()=>setTab('hilir')}/>
           <NavItem active={tab==='riwayat'} icon={<History size={20}/>} label="Riwayat" onClick={()=>setTab('riwayat')}/>
        </nav>
      </div>

      {/* --- CHECKOUT DRAWER --- */}
      <AnimatePresence>
        {checkoutItem && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setCheckoutItem(null)} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" />
            <motion.div 
              initial={{y:'100%'}} 
              animate={{y:0}} 
              exit={{y:'100%'}} 
              transition={{type:'spring', damping:25, stiffness:200}}
              className="relative w-full max-w-lg bg-white rounded-t-[3.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="p-8">
                {checkoutStep === 'options' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black italic">Checkout</h3>
                      <button onClick={()=>setCheckoutItem(null)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                    </div>

                    <div className="flex gap-4 p-3 bg-slate-50 rounded-3xl border border-slate-100">
                      <img src={checkoutItem.img} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                      <div className="flex-1">
                        <p className="font-black text-emerald-900 leading-tight">{checkoutItem.name}</p>
                        <p className="text-lg font-black text-emerald-600 mt-1">Rp {checkoutItem.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-3xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Jumlah</span>
                        <div className="flex items-center justify-between">
                          <button onClick={()=>setCheckoutItem({...checkoutItem, qty: Math.max(1, checkoutItem.qty-1), totalPrice: Math.max(1, checkoutItem.qty-1)*checkoutItem.price})} className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center"><MinusCircle size={18}/></button>
                          <span className="font-black text-lg">{checkoutItem.qty}</span>
                          <button onClick={()=>setCheckoutItem({...checkoutItem, qty: checkoutItem.qty+1, totalPrice: (checkoutItem.qty+1)*checkoutItem.price})} className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center"><PlusCircle size={18}/></button>
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-3xl space-y-1 text-right">
                        <span className="text-[9px] font-black text-emerald-400 uppercase">Subtotal</span>
                        <p className="text-xl font-black text-emerald-900">Rp {checkoutItem.totalPrice.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <span className="text-[9px] font-black text-slate-400 uppercase ml-2">Metode Pengantaran</span>
                       <div className="grid grid-cols-2 gap-2">
                         <button onClick={()=>setCheckoutItem({...checkoutItem, deliveryMode:'Ambil Sendiri'})} className={`py-4 rounded-2xl font-black text-[10px] border-2 transition ${checkoutItem.deliveryMode === 'Ambil Sendiri' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400'}`}>AMBIL SENDIRI</button>
                         <button onClick={()=>setCheckoutItem({...checkoutItem, deliveryMode:'Diantar'})} className={`py-4 rounded-2xl font-black text-[10px] border-2 transition ${checkoutItem.deliveryMode === 'Diantar' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}>DIANTAR</button>
                       </div>
                    </div>

                    <button onClick={()=>setCheckoutStep('qris')} className="w-full bg-emerald-950 text-white py-5 rounded-[2rem] font-black shadow-xl">LANJUT PEMBAYARAN</button>
                  </div>
                )}

                {checkoutStep === 'qris' && (
                  <div className="text-center space-y-6">
                    <h3 className="text-xl font-black italic">Scan QRIS</h3>
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 inline-block shadow-inner">
                      <QrCode size={180} className="text-slate-800"/>
                    </div>
                    
                    {previewUrl ? (
                      <div className="space-y-4">
                        <div className="relative group mx-auto w-full max-w-[200px]">
                           <img src={previewUrl} className="w-full h-32 object-cover rounded-2xl border-4 border-emerald-100 shadow-md" />
                           <button onClick={()=>setProofFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={14}/></button>
                        </div>
                        <button onClick={()=>processTransaction()} className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black shadow-xl">KONFIRMASI PEMBAYARAN</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center p-10 border-4 border-dashed border-slate-200 rounded-[2.5rem] cursor-pointer hover:bg-slate-50 transition">
                        <Upload className="text-slate-300 mb-2" size={32}/>
                        <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Upload Bukti Transfer</span>
                        <input type="file" className="hidden" accept="image/*" onChange={e=>setProofFile(e.target.files?.[0] || null)} />
                      </label>
                    )}
                    <button onClick={()=>setCheckoutStep('options')} className="text-slate-400 font-bold text-xs uppercase">Kembali</button>
                  </div>
                )}

                {checkoutStep === 'processing' && (
                  <div className="py-20 text-center space-y-6">
                    <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="font-black text-emerald-950 uppercase tracking-widest text-xs">Menyimpan Pesanan Anda...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- REFINED SUB-COMPONENTS ---

function AuthPage({ email, setEmail, pass, setPass, onAuth }: any) {
  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-700 mx-auto mb-4">
            <Layers size={32} />
          </div>
          <h1 className="text-3xl font-black text-emerald-950 italic">AGRI-OPTIMA</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Versi 2.0 Pro</p>
        </div>
        <div className="space-y-4">
          <input type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-emerald-600 transition" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-emerald-600 transition" onChange={e => setPass(e.target.value)} />
          <button onClick={() => onAuth('login')} className="w-full bg-emerald-800 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-900 transition active:scale-95">MASUK</button>
          <button onClick={() => onAuth('reg')} className="w-full text-emerald-700 font-bold text-xs tracking-tight">BELUM PUNYA AKUN? DAFTAR</button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children, onAdd }: any) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-black text-emerald-900 text-[10px] uppercase tracking-[0.2em]">{title}</h3>
        <button onClick={onAdd} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition"><Plus size={18}/></button>
      </div>
      <div className="space-y-3 flex-1">{children}</div>
    </div>
  );
}

function PaymentModal({ price, onClose, onConfirm, previewUrl, setFile, isProcessing }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[3.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        {isProcessing ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-black text-emerald-950 text-xs uppercase tracking-widest">Memproses Pembayaran...</p>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <h3 className="text-xl font-black italic">Aktivasi Analisis</h3>
            <div className="bg-slate-50 p-5 rounded-[2.5rem] border-2 border-dashed border-slate-200 inline-block">
              <QrCode size={160} />
            </div>
            <div className="bg-emerald-50 py-3 px-6 rounded-2xl inline-block">
               <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Biaya Akses</p>
               <p className="text-2xl font-black text-emerald-950 tracking-tighter">Rp {price.toLocaleString()}</p>
            </div>
            
            {previewUrl ? (
               <div className="space-y-4">
                 <img src={previewUrl} className="w-full h-32 object-cover rounded-2xl border-4 border-emerald-50 shadow-sm" />
                 <button onClick={onConfirm} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg">KONFIRMASI & LIHAT HASIL</button>
               </div>
            ) : (
               <label className="flex flex-col items-center p-8 border-4 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer hover:bg-slate-50">
                 <Upload className="text-slate-300 mb-2" size={28}/>
                 <span className="font-black text-[9px] text-slate-400 uppercase tracking-widest">Upload Bukti Transfer</span>
                 <input type="file" className="hidden" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
               </label>
            )}
            <button onClick={onClose} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Batal</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ item, onBuy }: any) {
  return (
    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col h-full">
       <div className="relative h-48 rounded-[2rem] overflow-hidden mb-5">
         <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
         <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
           <p className="text-[10px] font-black text-emerald-700 italic">Rp {item.price.toLocaleString()}</p>
         </div>
       </div>
       <div className="px-2 flex-1 flex flex-col justify-between">
         <div>
           <h4 className="font-black text-emerald-950 leading-tight mb-2 text-lg">{item.name}</h4>
           <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{item.desc}</p>
         </div>
         <button onClick={()=>onBuy(item)} className="w-full bg-emerald-50 text-emerald-700 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-950 hover:text-white transition duration-300 shadow-sm active:scale-95">
           PESAN SEKARANG
         </button>
       </div>
    </div>
  );
}

function OrderCard({ order }: any) {
  const steps = ['Diterima', 'Diproses', 'Diantar', 'Sampai', 'Selesai'];
  const currentIdx = steps.findIndex(s => order.status?.includes(s)) || 0;

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest opacity-60">{order.type}</p>
          <h4 className="text-xl font-black text-emerald-950">{order.itemName}</h4>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
             <Clock size={12}/> {order.createdAt?.toDate().toLocaleDateString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
          </div>
        </div>
        <div className="text-right">
           <p className="text-lg font-black text-emerald-950 leading-none">Rp {order.total?.toLocaleString()}</p>
           <p className="text-[10px] font-bold text-slate-400 mt-1">{order.qty} Unit</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
           <span className="text-slate-400">Status Progres</span>
           <span className="text-emerald-700">{order.status}</span>
        </div>
        <div className="flex gap-1.5">
           {steps.map((_, i) => (
             <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-1000 ${i <= currentIdx ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-100'}`}></div>
           ))}
        </div>
        <div className="grid grid-cols-5 text-[8px] font-black text-slate-300 uppercase leading-tight text-center">
           {steps.map((s, i) => (
             <span key={i} className={i <= currentIdx ? 'text-emerald-900' : ''}>{s}</span>
           ))}
        </div>
      </div>
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-3xl transition-all duration-300 ${active ? 'bg-white text-emerald-950 shadow-xl' : 'text-emerald-100/40 hover:text-white'}`}>
      {icon} <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function FilterTab({ active, label, icon, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${active ? 'bg-emerald-900 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
      {icon} {label}
    </button>
  );
}