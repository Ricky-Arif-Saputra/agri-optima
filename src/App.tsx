import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, where, Timestamp, orderBy } from "firebase/firestore";
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, Layers, 
  CheckCircle2, TrendingUp, Package, Box, QrCode, LogOut, 
  UserCheck, TruckIcon, X, ArrowRight, MapPin, 
  PlusCircle, MinusCircle, Upload, Clock, Store, History, 
  ChevronRight, Image as ImageIcon, Sparkles, Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  // Logic States
  const [activeStep, setActiveStep] = useState<'input' | 'payment' | 'result'>('input');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [isQrisMode, setIsQrisMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // Optimasi Data
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Lahan (Ha)', koefs: [1], target: 10, type: '<=' }]);
  const [hasil, setHasil] = useState<any>(null);

  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Firebase Observers
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

  // --- ACTIONS ---
  const handleAuth = async (type: 'login' | 'reg') => {
    try {
      if (type === 'login') await signInWithEmailAndPassword(auth, email, password);
      else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, createdAt: new Date() });
      }
    } catch (err: any) { alert(err.message); }
  };

  const solveNow = () => {
    try {
      const N = tanaman.length;
      const sortedK = [...kendala.filter(c => c.type === '<='), ...kendala.filter(c => c.type === '>='), ...kendala.filter(c => c.type === '=')];
      const A: any = Array.from({ length: sortedK.length + 3 }, () => new Array(N + 2).fill(0));
      tanaman.forEach((t, j) => A[1][j + 2] = t.profit);
      sortedK.forEach((c, i) => {
        A[i + 2][1] = c.target;
        c.koefs.forEach((val, j) => { A[i + 2][j + 2] = -val; });
      });
      setHasil(SimplexSolver.solve(N, kendala.filter(c=>c.type==='<=').length, kendala.filter(c=>c.type==='>=').length, kendala.filter(c=>c.type==='=').length, A));
      setActiveStep('result');
    } catch (e) { alert("Data input tidak valid."); }
  };

  const fastUpload = async (isOptimasi = false) => {
    // Instant Progress: Simpan ke Firebase tanpa nunggu animasi loading
    const orderData = isOptimasi ? {
      itemName: 'Layanan Optimasi Pro',
      total: 5000, qty: 1, status: 'Pesanan Diterima', type: 'Layanan'
    } : {
      itemName: checkoutItem.name,
      total: checkoutItem.totalPrice,
      qty: checkoutItem.qty,
      status: 'Pesanan Diterima',
      deliveryMode: checkoutItem.deliveryMode || 'Diantar',
      type: checkoutItem.type
    };

    addDoc(collection(db, "orders"), {
      ...orderData,
      userId: user.uid,
      createdAt: Timestamp.now(),
    });

    // Instant UI Switching
    if (isOptimasi) {
      solveNow();
    } else {
      setCheckoutItem(null);
      setIsQrisMode(false);
      setTab('riwayat');
    }
    setPreviewUrl(null);
  };

  const dataUber = {
    bahan: [
      { id: 'b1', name: 'Pupuk Bio-Organik', price: 125000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500', desc: 'Nutrisi mikro lengkap.' },
      { id: 'b2', name: 'Benih Padi IR64', price: 75000, img: 'https://images.unsplash.com/photo-1535242208474-9a28972a0d08?w=500', desc: 'Sertifikat unggul nasional.' }
    ],
    alat: [
      { id: 'a1', name: 'Sewa Hand Traktor', price: 450000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=500', desc: 'Sewa harian (8 jam kerja).' }
    ],
    jasa: [
      { id: 'j1', name: 'Konsultasi Agronom', price: 200000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500', desc: 'Analisis kesehatan tanaman.' }
    ]
  };

  if (!user) return <AuthUI onAuth={handleAuth} email={email} setEmail={setEmail} pass={password} setPass={setPassword} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-100">
      
      {/* HEADER - CLEAN & COMPACT */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md z-40 border-b border-slate-100 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Layers size={18} />
          </div>
          <span className="font-black text-lg tracking-tighter text-emerald-950 italic">AGRI-OPTIMA</span>
        </div>
        <button onClick={()=>signOut(auth)} className="text-slate-400 hover:text-red-500 transition"><LogOut size={20}/></button>
      </header>

      <main className="pt-20 pb-32 px-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB OPTIMASI */}
          {tab === 'optimasi' && (
            <motion.div key="opt" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
              {activeStep === 'input' && (
                <>
                  <div className="px-2">
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">Optimasi <span className="text-emerald-600">Laba.</span></h2>
                    <p className="text-slate-500 text-sm">Hitung alokasi lahan terbaik secara instan.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <CardSection title="Variabel Tanaman" onAdd={()=>setTanaman([...tanaman, {id:Date.now(), nama:'', profit:0}])}>
                      {tanaman.map((t, i) => (
                        <div key={t.id} className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                          <input className="flex-1 font-bold text-sm bg-transparent outline-none" placeholder="Padi / Jagung" value={t.nama} onChange={e=>{const n=[...tanaman]; n[i].nama=e.target.value; setTanaman(n);}}/>
                          <div className="bg-emerald-50 px-3 py-1 rounded-xl text-emerald-700 font-black text-xs flex items-center gap-1">
                            Rp <input type="number" className="w-16 bg-transparent outline-none" value={t.profit} onChange={e=>{const n=[...tanaman]; n[i].profit=Number(e.target.value); setTanaman(n);}}/>
                          </div>
                        </div>
                      ))}
                    </CardSection>

                    <CardSection title="Kapasitas & Batasan" onAdd={()=>setKendala([...kendala, {id:Date.now(), nama:'', koefs:Array(tanaman.length).fill(0), target:0, type:'<='}])}>
                      {kendala.map((k, i) => (
                        <div key={k.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                          <div className="flex justify-between items-center">
                            <input className="font-bold text-xs uppercase text-slate-400 bg-transparent" value={k.nama} onChange={e=>{const n=[...kendala]; n[i].nama=e.target.value; setKendala(n);}}/>
                            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                              <span className="text-[10px] font-bold">Limit:</span>
                              <input type="number" className="w-12 bg-transparent text-center font-black text-xs" value={k.target} onChange={e=>{const n=[...kendala]; n[i].target=Number(e.target.value); setKendala(n);}}/>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tanaman.map((t, ti) => (
                              <div key={ti} className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">
                                {t.nama || 'Tanaman'}: <input type="number" className="w-6 bg-transparent text-center" value={k.koefs[ti]} onChange={e=>{const n=[...kendala]; n[i].koefs[ti]=Number(e.target.value); setKendala(n);}}/>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardSection>
                  </div>
                  <button onClick={()=>setActiveStep('payment')} className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-emerald-200 active:scale-95 transition flex items-center justify-center gap-2">
                    HITUNG HASIL TERBAIK <Sparkles size={18}/>
                  </button>
                </>
              )}

              {activeStep === 'payment' && (
                <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={()=>setActiveStep('input')} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button>
                    <span className="font-black text-sm text-emerald-600 uppercase tracking-widest">Pembayaran</span>
                    <div className="w-8" />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 inline-block">
                    <QrCode size={180}/>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">Rp 5.000</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Aktivasi Algoritma Simplex</p>
                  </div>
                  
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img src={previewUrl} className="w-full h-40 object-cover rounded-3xl border-4 border-emerald-50" />
                      <button onClick={()=>fastUpload(true)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg">KONFIRMASI SEKARANG</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer hover:bg-slate-50">
                      <Upload className="text-slate-300 mb-2" size={32}/>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Upload Bukti</span>
                      <input type="file" className="hidden" accept="image/*" onChange={e=>setPreviewUrl(URL.createObjectURL(e.target.files![0]))}/>
                    </label>
                  )}
                </div>
              )}

              {activeStep === 'result' && hasil && (
                <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="space-y-6">
                  <div className="bg-emerald-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-20"><TrendingUp size={100}/></div>
                    <div className="relative z-10">
                      <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-2">Laba Maksimum Estimasi</p>
                      <h2 className="text-5xl font-black tracking-tighter mb-8">Rp {hasil.maxValue.toLocaleString()}</h2>
                      <div className="grid grid-cols-2 gap-4">
                        {tanaman.map((t, i) => (
                          <div key={i} className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                            <p className="text-[9px] font-bold opacity-60 uppercase">{t.nama}</p>
                            <p className="text-2xl font-black text-emerald-300">{hasil.solutions[i]?.toFixed(1)} <span className="text-[10px] text-white">Unit</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>setActiveStep('input')} className="w-full py-4 border-2 border-emerald-900 text-emerald-900 rounded-2xl font-black uppercase text-xs">Ulang Analisis</button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* TAB UBER TANI */}
          {tab === 'uber' && (
            <motion.div key="uber" initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                <FilterChip active={uberCategory==='bahan'} label="Bahan" icon={<Package size={14}/>} onClick={()=>setUberCategory('bahan')}/>
                <FilterChip active={uberCategory==='alat'} label="Sewa Alat" icon={<TruckIcon size={14}/>} onClick={()=>setUberCategory('alat')}/>
                <FilterChip active={uberCategory==='jasa'} label="Layanan" icon={<UserCheck size={14}/>} onClick={()=>setUberCategory('jasa')}/>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {dataUber[uberCategory].map((p: any) => (
                  <ProductRow key={p.id} item={p} onBuy={(x:any)=>setCheckoutItem({...x, qty:1, totalPrice: x.price, type: uberCategory})}/>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB RIWAYAT */}
          {tab === 'riwayat' && (
            <motion.div key="history" initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 px-2">Pesanan <span className="text-emerald-600">Aktif.</span></h2>
              {userOrders.length === 0 ? (
                <div className="py-20 text-center text-slate-300 font-bold">Belum ada transaksi.</div>
              ) : (
                userOrders.map((ord: any) => <OrderCard key={ord.id} order={ord} />)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- MOBILE BOTTOM NAV (APP STYLE) --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 pb-8 pt-3 z-50 flex justify-between items-center">
        <NavIcon active={tab==='optimasi'} icon={<Calculator size={22}/>} label="Optima" onClick={()=>setTab('optimasi')}/>
        <NavIcon active={tab==='uber'} icon={<ShoppingBag size={22}/>} label="Market" onClick={()=>setTab('uber')}/>
        <NavIcon active={tab==='riwayat'} icon={<History size={22}/>} label="Riwayat" onClick={()=>setTab('riwayat')}/>
      </nav>

      {/* --- CHECKOUT DRAWER --- */}
      <AnimatePresence>
        {checkoutItem && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={()=>setCheckoutItem(null)}/>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring', damping:30, stiffness:300}} className="relative w-full max-w-xl bg-white rounded-t-[3rem] p-8 shadow-2xl">
              {!isQrisMode ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <img src={checkoutItem.img} className="w-16 h-16 rounded-2xl object-cover" />
                      <div>
                        <h4 className="font-black text-slate-900">{checkoutItem.name}</h4>
                        <p className="text-emerald-600 font-black text-lg">Rp {checkoutItem.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <button onClick={()=>setCheckoutItem(null)} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                    <span className="font-bold text-xs text-slate-500 uppercase">Jumlah</span>
                    <div className="flex items-center gap-4">
                      <button onClick={()=>setCheckoutItem({...checkoutItem, qty: Math.max(1, checkoutItem.qty-1), totalPrice: Math.max(1, checkoutItem.qty-1)*checkoutItem.price})} className="bg-white p-1 rounded-lg border shadow-sm"><MinusCircle size={20}/></button>
                      <span className="font-black">{checkoutItem.qty}</span>
                      <button onClick={()=>setCheckoutItem({...checkoutItem, qty: checkoutItem.qty+1, totalPrice: (checkoutItem.qty+1)*checkoutItem.price})} className="bg-white p-1 rounded-lg border shadow-sm"><PlusCircle size={20}/></button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-dashed pt-4">
                    <span className="font-bold text-slate-400">Total Bayar</span>
                    <span className="text-2xl font-black text-slate-900">Rp {checkoutItem.totalPrice.toLocaleString()}</span>
                  </div>

                  <button onClick={()=>setIsQrisMode(true)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-xl">LANJUT KE PEMBAYARAN</button>
                </div>
              ) : (
                <div className="text-center space-y-6 py-4">
                  <h3 className="font-black text-xl italic">SCAN & UPLOAD</h3>
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-dashed inline-block"><QrCode size={160}/></div>
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img src={previewUrl} className="w-full h-32 object-cover rounded-2xl" />
                      <button onClick={()=>fastUpload()} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg">KONFIRMASI & LIHAT PROGRESS</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer">
                       <Upload className="text-slate-300 mb-2" size={28}/>
                       <span className="text-[10px] font-black text-slate-400">Pilih Bukti Transfer</span>
                       <input type="file" className="hidden" onChange={e=>setPreviewUrl(URL.createObjectURL(e.target.files![0]))}/>
                    </label>
                  )}
                  <button onClick={()=>setIsQrisMode(false)} className="text-slate-400 font-bold text-xs uppercase">Kembali</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB COMPONENTS ---

function AuthUI({ onAuth, email, setEmail, pass, setPass }: any) {
  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-6">
      <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white w-full max-w-md rounded-[3.5rem] p-12 text-center shadow-2xl">
        <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-700 mx-auto mb-6">
          <Layers size={32} />
        </div>
        <h1 className="text-3xl font-black text-emerald-950 italic mb-10">AGRI-OPTIMA</h1>
        <div className="space-y-3">
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-emerald-600" placeholder="Email" onChange={e=>setEmail(e.target.value)}/>
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-emerald-600" type="password" placeholder="Password" onChange={e=>setPass(e.target.value)}/>
          <button onClick={()=>onAuth('login')} className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-900/20 mt-4">MASUK</button>
          <button onClick={()=>onAuth('reg')} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Daftar Akun Baru</button>
        </div>
      </motion.div>
    </div>
  );
}

function CardSection({ title, children, onAdd }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-2">
        <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-widest">{title}</h3>
        <button onClick={onAdd} className="p-1 bg-emerald-100 text-emerald-700 rounded-lg"><Plus size={16}/></button>
      </div>
      {children}
    </div>
  );
}

function ProductRow({ item, onBuy }: any) {
  return (
    <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-transform">
      <img src={item.img} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
      <div className="flex-1">
        <h4 className="font-black text-slate-900 leading-tight">{item.name}</h4>
        <p className="text-xs text-slate-400 line-clamp-1 mb-2">{item.desc}</p>
        <div className="flex justify-between items-center">
          <span className="font-black text-emerald-600">Rp {item.price.toLocaleString()}</span>
          <button onClick={()=>onBuy(item)} className="bg-slate-900 text-white px-4 py-1.5 rounded-xl font-black text-[10px] uppercase">Pesan</button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }: any) {
  const steps = ['Diterima', 'Proses', 'Antar', 'Sampai', 'Selesai'];
  const progress = steps.findIndex(s => order.status?.includes(s)) + 1;

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500 tracking-widest">{order.type || 'Uber Tani'}</span>
          <h4 className="font-black text-slate-900 text-lg mt-1">{order.itemName}</h4>
        </div>
        <p className="font-black text-emerald-600">Rp {order.total?.toLocaleString()}</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase text-emerald-700">
          <span>Progress Tracking</span>
          <span>{order.status}</span>
        </div>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full ${i <= progress ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-slate-100'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NavIcon({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}>
      {icon}
      <span className={`text-[8px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
    </button>
  );
}

function FilterChip({ active, label, icon, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs whitespace-nowrap transition-all border ${active ? 'bg-emerald-900 text-white border-emerald-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`}>
      {icon} {label}
    </button>
  );
}