import React, { useState, useEffect } from 'react';
// FIREBASE
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, where, orderBy, Timestamp } from "firebase/firestore";

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
  UserCheck, TruckIcon, X, ArrowRight, Info, MapPin, Search, 
  PlusCircle, MinusCircle, Upload, ClipboardCheck, Clock, CreditCard, Menu, Home, 
  Store, History, User, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { SimplexSolver } from './lib/simplex';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('optimasi');
  const [uberCategory, setUberCategory] = useState<'bahan' | 'alat' | 'jasa'>('bahan');
  
  // STEP STATES
  const [activeStep, setActiveStep] = useState<'input' | 'payment' | 'upload' | 'result'>('input');
  const [checkoutStep, setCheckoutStep] = useState<'options' | 'qris' | 'loading'>('options');
  
  // DATA STATES
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // FORM STATES
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- STATE OPTIMASI ---
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Lahan (Ha)', koefs: [1], target: 10, type: '<=' }]);
  const [hasil, setHasil] = useState<any>(null);

  // AUTH & ORDER OBSERVER
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

  // Handle Image Preview
  useEffect(() => {
    if (!proofFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(proofFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  const handleAuth = async (type: 'login' | 'reg') => {
    try {
      if (type === 'login') await signInWithEmailAndPassword(auth, email, password);
      else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, createdAt: new Date() });
      }
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const solveSimplex = () => {
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
    } catch (e) { alert("Hitungan Gagal: Cek kembali input anda."); }
  };

  const submitOrder = async (isOptimasi = false) => {
    if (!previewUrl) return alert("Wajib upload bukti transfer!");
    
    setCheckoutStep('loading');
    const orderData = isOptimasi ? {
      itemName: 'Layanan Optimasi Laba',
      total: 5000,
      qty: 1,
      status: 'Pesanan Diterima'
    } : {
      itemName: checkoutItem.name,
      total: checkoutItem.totalPrice,
      qty: checkoutItem.qty,
      status: 'Pesanan Diterima',
      deliveryMode: checkoutItem.deliveryMode || 'Default',
      type: checkoutItem.type
    };

    await addDoc(collection(db, "orders"), {
      ...orderData,
      userId: user.uid,
      createdAt: Timestamp.now(),
      proof: 'uploaded_preview_mode' // In real app, upload to storage first
    });

    setTimeout(() => {
      setCheckoutItem(null);
      setProofFile(null);
      setCheckoutStep('options');
      if (isOptimasi) solveSimplex();
      else setTab('riwayat');
    }, 1500);
  };

  // DATA MASTER
  const dataUber = {
    bahan: [
      { id: 'b1', name: 'Pupuk Organik Cair', price: 150000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400', desc: 'Meningkatkan hasil panen hingga 30%.' },
      { id: 'b2', name: 'Benih Padi Unggul', price: 85000, img: 'https://images.unsplash.com/photo-1535242208474-9a28972a0d08?w=400', desc: 'Tahan hama wereng.' }
    ],
    alat: [
      { id: 'a1', name: 'Sewa Traktor G1000', price: 1200000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400', desc: 'Sewa harian traktor pembajak.' }
    ],
    jasa: [
      { id: 'j1', name: 'Manajemen Hama Pro', price: 500000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', desc: 'Pemantauan rutin lahan.' }
    ]
  };

  const dataHilir = [
    { id: 'h1', name: 'Beras Premium 10kg', price: 165000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', desc: 'Hasil petani binaan lokal.' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#052E16] flex items-center justify-center p-6 font-sans">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-green-900 tracking-tighter italic">AGRI-OPTIMA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Sustainable Farming</p>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-green-600" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-green-600" onChange={e => setPassword(e.target.value)} />
            <button onClick={() => handleAuth('login')} className="w-full bg-green-700 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-green-800 transition">LOGIN</button>
            <button onClick={() => handleAuth('reg')} className="w-full text-green-700 font-bold text-xs">DAFTAR AKUN BARU</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans text-slate-900 pb-32">
      
      {/* --- HEADER --- */}
      <header className="bg-white p-6 sticky top-0 z-40 border-b flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
           <div className="bg-green-900 p-2 rounded-xl text-yellow-400"><Layers size={18}/></div>
           <h2 className="font-black text-xl italic tracking-tight text-green-950">AGRI-OPTIMA</h2>
        </div>
        <button onClick={()=>signOut(auth)} className="p-2 bg-red-50 text-red-500 rounded-xl"><LogOut size={20}/></button>
      </header>

      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        
        {/* --- TAB OPTIMASI --- */}
        {tab === 'optimasi' && (
          <div className="space-y-6">
            {activeStep === 'input' && (
              <div className="animate-in fade-in">
                <div className="mb-8">
                  <h1 className="text-3xl font-black text-green-950">OPTIMASI LABA</h1>
                  <p className="text-slate-500 text-sm">Gunakan algoritma Simplex untuk hasil panen terbaik.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <InputCard title="Fungsi Tujuan" onAdd={()=>setTanaman([...tanaman, {id:Date.now(), nama:'', profit:0}])}>
                    {tanaman.map((t, i) => (
                      <div key={t.id} className="flex gap-2 bg-slate-50 p-3 rounded-2xl border">
                        <input placeholder="Tanaman" className="flex-1 bg-transparent font-bold text-sm" value={t.nama} onChange={e=>{const n=[...tanaman]; n[i].nama=e.target.value; setTanaman(n);}}/>
                        <div className="flex items-center bg-white px-2 rounded-xl">
                          <span className="text-[10px] font-black text-slate-400 mr-1">Rp</span>
                          <input type="number" className="w-20 font-black text-green-600 text-sm" value={t.profit} onChange={e=>{const n=[...tanaman]; n[i].profit=Number(e.target.value); setTanaman(n);}}/>
                        </div>
                      </div>
                    ))}
                  </InputCard>
                  <InputCard title="Batasan Kendala" onAdd={()=>setKendala([...kendala, {id:Date.now(), nama:'', koefs:Array(tanaman.length).fill(0), target:0, type:'<='}])}>
                    {kendala.map((k, i) => (
                      <div key={k.id} className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                        <div className="flex justify-between items-center">
                          <input className="font-black text-xs uppercase bg-transparent" value={k.nama} onChange={e=>{const n=[...kendala]; n[i].nama=e.target.value; setKendala(n);}}/>
                          <input type="number" className="w-16 bg-white rounded-lg text-center font-black text-xs p-1" value={k.target} onChange={e=>{const n=[...kendala]; n[i].target=Number(e.target.value); setKendala(n);}}/>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tanaman.map((t, ti) => (
                            <div key={ti} className="bg-white px-2 py-1 rounded-lg border text-[10px] flex items-center gap-1">
                              <span className="text-slate-400 uppercase font-bold">{t.nama?.slice(0,3)}</span>
                              <input type="number" className="w-8 text-center font-black" value={k.koefs[ti]} onChange={e=>{const n=[...kendala]; n[i].koefs[ti]=Number(e.target.value); setKendala(n);}} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </InputCard>
                </div>
                <button onClick={()=>setActiveStep('payment')} className="w-full mt-8 bg-green-900 text-white py-5 rounded-[2rem] font-black shadow-2xl hover:scale-[1.02] transition">MULAI ANALISIS</button>
              </div>
            )}

            {(activeStep === 'payment' || activeStep === 'upload') && (
              <div className="max-w-md mx-auto bg-white p-8 rounded-[3rem] shadow-2xl text-center space-y-6 animate-in zoom-in-95">
                <h3 className="font-black text-xl italic">AGRI-PAY</h3>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 inline-block">
                  <QrCode size={180} className="text-green-950"/>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl">
                   <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Biaya Konsultasi</p>
                   <p className="text-3xl font-black text-green-950 tracking-tighter">Rp 5.000</p>
                </div>

                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="relative group">
                      <img src={previewUrl} className="w-full h-48 object-cover rounded-3xl border-4 border-green-100 shadow-md" />
                      <button onClick={()=>setProofFile(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"><X size={16}/></button>
                    </div>
                    <button onClick={()=>submitOrder(true)} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-xl">KONFIRMASI BUKTI</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center p-10 border-4 border-dashed rounded-[2.5rem] cursor-pointer hover:bg-slate-50 transition border-slate-200">
                    <ImageIcon className="text-slate-300 mb-2" size={40}/>
                    <span className="font-black text-xs text-slate-400 uppercase">Upload Bukti Transfer</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e=>setProofFile(e.target.files?.[0] || null)} />
                  </label>
                )}
                <button onClick={()=>setActiveStep('input')} className="text-slate-400 font-bold text-xs uppercase">Batal</button>
              </div>
            )}

            {activeStep === 'result' && hasil && (
              <div className="animate-in slide-in-from-top-8 space-y-6">
                 <div className="bg-[#052E16] p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="bg-yellow-400 text-green-950 px-4 py-1 rounded-full text-[10px] font-black uppercase inline-block mb-6">OPTIMAL FOUND</div>
                      <h2 className="text-5xl font-black tracking-tighter">Rp {hasil.maxValue.toLocaleString()}</h2>
                      <p className="text-green-400 font-bold text-xs uppercase mt-1">Estimasi Laba Maksimum</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
                        {tanaman.map((t, i) => (
                          <div key={i} className="bg-white/10 p-6 rounded-3xl border border-white/5">
                            <p className="text-[10px] font-black text-green-400 uppercase">Rekomendasi</p>
                            <p className="font-black text-xl">{t.nama}</p>
                            <p className="text-3xl font-black text-yellow-400 mt-2">{hasil.solutions[i]?.toFixed(2)} <span className="text-xs text-white opacity-40">Unit/Ha</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
                 <button onClick={()=>setActiveStep('input')} className="mx-auto block text-green-700 font-black flex items-center gap-2"><ArrowRight className="rotate-180"/> ANALISIS ULANG</button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB UBER TANI --- */}
        {tab === 'uber' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-black text-green-950 uppercase">Uber Tani</h1>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <FilterBtn active={uberCategory==='bahan'} label="Bahan Bakunya" icon={<Package size={16}/>} onClick={()=>setUberCategory('bahan')}/>
                <FilterBtn active={uberCategory==='alat'} label="Sewa Alat" icon={<TruckIcon size={16}/>} onClick={()=>setUberCategory('alat')}/>
                <FilterBtn active={uberCategory==='jasa'} label="Manajemen" icon={<UserCheck size={16}/>} onClick={()=>setUberCategory('jasa')}/>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {dataUber[uberCategory].map((it: any) => (
                 <ProductCard key={it.id} item={it} onBuy={(x:any)=>setCheckoutItem({...x, qty:1, type: uberCategory, purchaseType: 'Normal', totalPrice: x.price})}/>
               ))}
            </div>
          </div>
        )}

        {/* --- TAB HILIRISASI --- */}
        {tab === 'hilir' && (
          <div className="space-y-8 animate-in fade-in">
            <h1 className="text-3xl font-black text-green-950 uppercase">Hilirisasi</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {dataHilir.map(it => (
                 <ProductCard key={it.id} item={it} onBuy={(x:any)=>setCheckoutItem({...x, qty:1, type: 'hilir', deliveryMode:'Ambil Sendiri', totalPrice: x.price})}/>
               ))}
            </div>
          </div>
        )}

        {/* --- TAB RIWAYAT --- */}
        {tab === 'riwayat' && (
          <div className="space-y-6 animate-in fade-in">
            <h1 className="text-3xl font-black text-green-950 uppercase">Pesanan Saya</h1>
            <div className="space-y-4">
               {userOrders.length === 0 ? (
                 <div className="p-20 text-center bg-white rounded-3xl border border-dashed text-slate-300 font-bold">Belum ada aktivitas.</div>
               ) : (
                 userOrders.map((ord: any) => (
                   <div key={ord.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                           <p className="font-black text-lg text-green-950 leading-tight">{ord.itemName}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ord.createdAt?.toDate().toLocaleString()}</p>
                        </div>
                        <p className="font-black text-green-600 italic">Rp {ord.total?.toLocaleString()}</p>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                           <span>Track Progres</span>
                           <span className="text-green-700">{ord.status}</span>
                         </div>
                         <div className="flex gap-1">
                            {[1,2,3,4,5].map(step => (
                              <div key={step} className={`h-2 flex-1 rounded-full ${getStatusWeight(ord.status) >= step ? 'bg-green-600' : 'bg-slate-100'}`}></div>
                            ))}
                         </div>
                         <div className="grid grid-cols-5 text-[7px] font-black text-center text-slate-400 uppercase leading-tight">
                            <span>Diterima</span>
                            <span>Proses</span>
                            <span>Antar</span>
                            <span>Sampai</span>
                            <span>Selesai</span>
                         </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}
      </main>

      {/* --- BOTTOM NAVIGATION (PROFESSIONAL) --- */}
      <nav className="fixed bottom-6 left-4 right-4 bg-green-950 text-white rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl z-50 md:max-w-md md:mx-auto">
         <NavBtn active={tab==='optimasi'} icon={<Calculator size={22}/>} label="Optima" onClick={()=>setTab('optimasi')}/>
         <NavBtn active={tab==='uber'} icon={<Truck size={22}/>} label="Uber" onClick={()=>setTab('uber')}/>
         <NavBtn active={tab==='hilir'} icon={<Store size={22}/>} label="Hilir" onClick={()=>setTab('hilir')}/>
         <NavBtn active={tab==='riwayat'} icon={<History size={22}/>} label="Riwayat" onClick={()=>setTab('riwayat')}/>
      </nav>

      {/* --- MODAL CHECKOUT COMPREHENSIVE --- */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center">
           <div className="bg-white w-full max-w-lg rounded-t-[3rem] md:rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-10">
              <div className="p-8 space-y-6">
                 {checkoutStep === 'options' && (
                   <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black italic tracking-tighter">CHECKOUT</h3>
                      <button onClick={()=>setCheckoutItem(null)} className="p-2 bg-slate-100 rounded-full"><X/></button>
                    </div>

                    <div className="flex gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <img src={checkoutItem.img} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                      <div className="flex-1">
                        <p className="font-black text-green-950 leading-tight">{checkoutItem.name}</p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{checkoutItem.desc}</p>
                        <p className="text-lg font-black text-green-600 mt-1">Rp {checkoutItem.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Jumlah</label>
                         <div className="flex items-center justify-between bg-slate-100 p-2 rounded-2xl">
                            <button onClick={()=>setCheckoutItem({...checkoutItem, qty: Math.max(1, checkoutItem.qty-1), totalPrice: Math.max(1, checkoutItem.qty-1) * checkoutItem.price})} className="bg-white p-2 rounded-xl"><MinusCircle size={20}/></button>
                            <span className="font-black text-lg">{checkoutItem.qty}</span>
                            <button onClick={()=>setCheckoutItem({...checkoutItem, qty: checkoutItem.qty+1, totalPrice: (checkoutItem.qty+1) * checkoutItem.price})} className="bg-white p-2 rounded-xl"><PlusCircle size={20}/></button>
                         </div>
                       </div>
                       
                       <div className="space-y-2 text-right">
                         <label className="text-[10px] font-black uppercase text-slate-400 mr-2">Subtotal</label>
                         <div className="pt-3 font-black text-2xl text-green-950">Rp {checkoutItem.totalPrice.toLocaleString()}</div>
                       </div>
                    </div>

                    {(checkoutItem.type === 'hilir' || checkoutItem.type === 'alat') && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Metode Pengiriman</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={()=>setCheckoutItem({...checkoutItem, deliveryMode:'Ambil Sendiri'})} className={`p-3 rounded-2xl font-bold text-xs border-2 transition ${checkoutItem.deliveryMode==='Ambil Sendiri'?'border-green-600 bg-green-50 text-green-700':'border-slate-100'}`}>AMBIL SENDIRI</button>
                          <button onClick={()=>setCheckoutItem({...checkoutItem, deliveryMode:'Diantar'})} className={`p-3 rounded-2xl font-bold text-xs border-2 transition ${checkoutItem.deliveryMode==='Diantar'?'border-blue-600 bg-blue-50 text-blue-700':'border-slate-100'}`}>DIANTAR</button>
                        </div>
                      </div>
                    )}

                    <button onClick={()=>setCheckoutStep('qris')} className="w-full bg-green-950 text-white py-5 rounded-[2rem] font-black shadow-xl hover:bg-black transition">BAYAR SEKARANG</button>
                   </>
                 )}

                 {checkoutStep === 'qris' && (
                    <div className="text-center space-y-6">
                       <h3 className="text-xl font-black italic">SCAN QRIS AGRI-PAY</h3>
                       <div className="bg-slate-50 p-6 rounded-[3rem] border-2 border-dashed inline-block"><QrCode size={180}/></div>
                       
                       {previewUrl ? (
                         <div className="space-y-4">
                           <div className="relative">
                             <img src={previewUrl} className="w-full h-44 object-cover rounded-3xl border-4 border-green-100" />
                             <button onClick={()=>setProofFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"><X size={16}/></button>
                           </div>
                           <button onClick={()=>submitOrder()} className="w-full bg-green-600 text-white py-5 rounded-[2rem] font-black shadow-xl">UPLOAD & SELESAIKAN</button>
                         </div>
                       ) : (
                         <label className="flex flex-col items-center p-8 border-4 border-dashed rounded-[3rem] cursor-pointer hover:bg-slate-50 border-slate-200">
                            <Upload className="text-slate-300 mb-2" size={32}/>
                            <span className="font-black text-[10px] text-slate-400 uppercase">Klik Untuk Upload Bukti</span>
                            <input type="file" className="hidden" accept="image/*" onChange={e=>setProofFile(e.target.files?.[0] || null)} />
                         </label>
                       )}
                       <button onClick={()=>setCheckoutStep('options')} className="text-slate-400 font-bold text-xs uppercase">Kembali</button>
                    </div>
                 )}

                 {checkoutStep === 'loading' && (
                    <div className="py-20 text-center space-y-6">
                       <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                       <p className="font-black text-green-950 uppercase tracking-tighter">Memproses Pesanan Anda...</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// UI SUB-COMPONENTS
function InputCard({ title, children, onAdd }: any) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-green-800 text-[10px] uppercase tracking-widest">{title}</h3>
        <button onClick={onAdd} className="p-2 bg-green-50 text-green-600 rounded-full"><Plus size={16}/></button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function NavBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-2xl transition ${active ? 'bg-white text-green-950' : 'text-green-100/50 hover:text-white'}`}>
      {icon} <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function FilterBtn({ active, label, icon, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs whitespace-nowrap transition border ${active ? 'bg-green-950 text-white border-green-950 shadow-lg scale-105' : 'bg-white text-slate-500 border-slate-100'}`}>
      {icon} {label}
    </button>
  );
}

function ProductCard({ item, onBuy }: any) {
  return (
    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
       <div className="relative h-44 rounded-[2rem] overflow-hidden mb-4 shadow-inner">
         <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
       </div>
       <div className="px-2 space-y-2">
         <h4 className="font-black text-green-950 leading-tight h-10 line-clamp-2">{item.name}</h4>
         <div className="flex justify-between items-center pt-2">
           <p className="font-black text-green-600 text-sm italic">Rp {item.price.toLocaleString()}</p>
           <button onClick={()=>onBuy(item)} className="bg-green-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition">PESAN</button>
         </div>
       </div>
    </div>
  );
}

function getStatusWeight(status: string) {
  const map: any = {
    'Pesanan Diterima': 1,
    'Pesanan Diproses': 2,
    'Pesanan Diantar': 3,
    'Pesanan Sampai Tujuan': 4,
    'Pesanan Selesai': 5
  };
  return map[status] || 1;
}