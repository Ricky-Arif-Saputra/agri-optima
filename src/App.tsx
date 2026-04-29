import React, { useState, useEffect } from 'react';
// FIREBASE
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, where, orderBy } from "firebase/firestore";

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
  PlusCircle, MinusCircle, Upload, ClipboardCheck, Clock, CreditCard, Menu
} from 'lucide-react';
import { SimplexSolver } from './lib/simplex';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('optimasi');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // STEP STATES
  const [activeStep, setActiveStep] = useState<'input' | 'payment' | 'upload' | 'result'>('input');
  const [checkoutStep, setCheckoutStep] = useState<'options' | 'qris' | 'success'>('options');
  
  // DATA STATES
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [proofFile, setProofFile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- STATE OPTIMASI ---
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Luas Lahan (Ha)', koefs: [1], target: 10, type: '<=' }]);
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

  // LOGIKA AUTH
  const handleAuth = async (type: 'login' | 'reg') => {
    try {
      if (type === 'login') await signInWithEmailAndPassword(auth, email, password);
      else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, createdAt: new Date() });
      }
    } catch (err: any) { alert("Error: " + err.message); }
  };

  // LOGIKA SIMPLEX
  const solveSimplex = () => {
    const N = tanaman.length;
    const M1 = kendala.filter(c => c.type === '<=').length;
    const M2 = kendala.filter(c => c.type === '>=').length;
    const M3 = kendala.filter(c => c.type === '=').length;
    const sortedK = [...kendala.filter(c => c.type === '<='), ...kendala.filter(c => c.type === '>='), ...kendala.filter(c => c.type === '=')];
    const A: any = Array.from({ length: sortedK.length + 3 }, () => new Array(N + 2).fill(0));
    tanaman.forEach((t, j) => A[1][j + 2] = t.profit);
    sortedK.forEach((c, i) => {
      A[i + 2][1] = c.target;
      c.koefs.forEach((val, j) => { A[i + 2][j + 2] = -val; });
    });
    setHasil(SimplexSolver.solve(N, M1, M2, M3, A));
    setActiveStep('result');
  };

  // SUBMIT ORDER KE FIREBASE
  const submitFinalOrder = async () => {
    if (!proofFile) return alert("Silakan upload bukti transfer terlebih dahulu!");
    
    await addDoc(collection(db, "orders"), {
      userId: user.uid,
      itemName: checkoutItem.name,
      qty: checkoutItem.qty,
      total: checkoutItem.totalPrice,
      status: 'Verifikasi', // Status Awal
      purchaseType: checkoutItem.purchaseType || 'Normal',
      deliveryMode: checkoutItem.deliveryMode || 'Default',
      createdAt: new Date(),
      address: checkoutItem.address || ''
    });
    setCheckoutStep('success');
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
      { id: 'j1', name: 'Regu Tanam Pro', price: 300000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', desc: 'Jasa tanam padi borongan.' }
    ]
  };

  const dataHilir = [
    { id: 'h1', name: 'Beras Premium 10kg', price: 165000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', desc: 'Beras pulen hasil petani lokal.' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#052E16] flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-green-900 italic">AGRI-OPTIMA</h1>
            <p className="text-xs font-bold text-slate-400 mt-1">SMART FARMING SYSTEM</p>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-2xl border outline-none focus:ring-2 ring-green-500 transition" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-2xl border outline-none focus:ring-2 ring-green-500 transition" onChange={e => setPassword(e.target.value)} />
            <button onClick={() => handleAuth('login')} className="w-full bg-green-700 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-green-800 transition">LOGIN</button>
            <button onClick={() => handleAuth('reg')} className="w-full text-green-700 font-bold text-sm">Daftar Akun Baru</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7F5] font-sans text-slate-900 overflow-x-hidden">
      
      {/* SIDEBAR (Responsive) */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-72 bg-[#052E16] text-white h-full min-h-screen p-8 flex flex-col z-50 transition-transform duration-300 shadow-2xl`}>
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
             <div className="bg-yellow-400 p-2 rounded-xl text-green-900"><Layers size={20}/></div>
             <span className="font-black text-xl italic">AGRI-OPTIMA</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X/></button>
        </div>
        <nav className="space-y-2 flex-1">
          <SideBtn active={tab==='optimasi'} icon={<Calculator/>} label="Optimasi Laba" onClick={()=>{setTab('optimasi'); setSidebarOpen(false);}}/>
          <SideBtn active={tab==='uber'} icon={<Truck/>} label="Uber Tani" onClick={()=>{setTab('uber'); setSidebarOpen(false);}}/>
          <SideBtn active={tab==='hilir'} icon={<ShoppingBag/>} label="Hilirisasi" onClick={()=>{setTab('hilir'); setSidebarOpen(false);}}/>
          <SideBtn active={tab==='pesanan'} icon={<ClipboardCheck/>} label="Riwayat Pesanan" onClick={()=>{setTab('pesanan'); setSidebarOpen(false);}}/>
        </nav>
        <button onClick={()=>signOut(auth)} className="flex items-center gap-3 text-red-400 font-black text-xs uppercase p-4 hover:bg-white/5 rounded-2xl"><LogOut size={18}/> Keluar</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 lg:p-12 w-full">
        {/* Mobile Header */}
        <header className="lg:hidden flex justify-between items-center mb-8">
          <h2 className="font-black text-green-900">AGRI-OPTIMA</h2>
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white rounded-xl shadow-md"><Menu/></button>
        </header>

        {/* --- TAB OPTIMASI --- */}
        {tab === 'optimasi' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {activeStep === 'input' && (
               <div className="space-y-8 animate-in fade-in">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                       <h1 className="text-4xl font-black text-green-950 uppercase tracking-tighter">Optimasi Laba</h1>
                       <p className="text-slate-500 font-medium">Hitung alokasi lahan terbaik untuk hasil maksimal.</p>
                    </div>
                    <button onClick={()=>setActiveStep('payment')} className="w-full md:w-auto bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl">ANALISIS SEKARANG</button>
                 </div>
                 <div className="grid lg:grid-cols-2 gap-6">
                    <CardContainer title="Fungsi Tujuan (Profit)" onAdd={()=>setTanaman([...tanaman, {id:Date.now(), nama:'', profit:0}])}>
                       {tanaman.map((t, i) => (
                         <div key={t.id} className="flex gap-2 bg-slate-50 p-3 rounded-xl border">
                           <input placeholder="Nama" className="flex-1 bg-transparent font-bold" value={t.nama} onChange={e=>{const n=[...tanaman]; n[i].nama=e.target.value; setTanaman(n);}}/>
                           <input type="number" className="w-24 bg-white px-2 rounded-lg font-black text-green-600" value={t.profit} onChange={e=>{const n=[...tanaman]; n[i].profit=Number(e.target.value); setTanaman(n);}}/>
                         </div>
                       ))}
                    </CardContainer>
                    <CardContainer title="Fungsi Kendala" onAdd={()=>setKendala([...kendala, {id:Date.now(), nama:'', koefs:Array(tanaman.length).fill(0), target:0, type:'<='}])}>
                       {kendala.map((k, i) => (
                         <div key={k.id} className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                           <div className="flex justify-between items-center">
                             <input className="font-black text-xs uppercase" value={k.nama} onChange={e=>{const n=[...kendala]; n[i].nama=e.target.value; setKendala(n);}}/>
                             <input type="number" className="w-12 text-center rounded-lg" value={k.target} onChange={e=>{const n=[...kendala]; n[i].target=Number(e.target.value); setKendala(n);}}/>
                           </div>
                           <div className="flex flex-wrap gap-2">
                             {tanaman.map((t, ti) => (
                               <input key={ti} type="number" className="w-10 p-1 rounded-lg text-center text-xs border" value={k.koefs[ti]} onChange={e=>{const n=[...kendala]; n[i].koefs[ti]=Number(e.target.value); setKendala(n);}} />
                             ))}
                           </div>
                         </div>
                       ))}
                    </CardContainer>
                 </div>
               </div>
            )}

            {activeStep === 'payment' && (
              <div className="max-w-md mx-auto bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl text-center space-y-6">
                <h3 className="font-black text-xl">PEMBAYARAN LAYANAN</h3>
                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200">
                   <QrCode size={200} className="mx-auto text-green-900"/>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl">
                   <p className="text-[10px] font-black text-green-600 uppercase">Total Biaya</p>
                   <p className="text-3xl font-black text-green-950">Rp 5.000</p>
                </div>
                <button onClick={()=>setActiveStep('upload')} className="w-full bg-green-900 text-white py-4 rounded-2xl font-black shadow-lg">SAYAN SUDAH BAYAR</button>
                <button onClick={()=>setActiveStep('input')} className="text-slate-400 font-bold text-xs uppercase">Batal</button>
              </div>
            )}

            {activeStep === 'upload' && (
              <div className="max-w-md mx-auto bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl text-center space-y-6">
                <h3 className="font-black text-xl uppercase">UPLOAD BUKTI TF</h3>
                <label className="flex flex-col items-center p-10 border-4 border-dashed rounded-[2.5rem] cursor-pointer hover:bg-slate-50 transition">
                   <Upload className="text-green-600 mb-4" size={40}/>
                   <span className="font-black text-xs text-slate-400 uppercase">Pilih Foto Bukti Transaksi</span>
                   <input type="file" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0])} />
                </label>
                {proofFile && <p className="text-green-600 font-bold text-xs">File Terpilih: {proofFile.name}</p>}
                <button onClick={solveSimplex} className={`w-full py-4 rounded-2xl font-black transition ${proofFile ? 'bg-green-600 text-white shadow-xl' : 'bg-slate-200 text-slate-400 pointer-events-none'}`}>KONFIRMASI & LIHAT HASIL</button>
              </div>
            )}

            {activeStep === 'result' && hasil && (
              <div className="animate-in slide-in-from-top-10 duration-700 space-y-6">
                 <div className="bg-[#052E16] p-8 md:p-12 rounded-[3.5rem] text-white shadow-2xl">
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <span className="bg-yellow-400 text-green-900 px-3 py-1 rounded-full text-[10px] font-black uppercase">Hasil Analisis</span>
                        <h2 className="text-5xl font-black tracking-tighter mt-4">Rp {hasil.maxValue.toLocaleString()}</h2>
                        <p className="text-green-400 font-bold text-xs mt-1">KEUNTUNGAN MAKSIMAL PER MUSIM</p>
                      </div>
                      <TrendingUp size={48} className="text-yellow-400 opacity-50"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {tanaman.map((t, i) => (
                         <div key={i} className="bg-white/10 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                           <p className="text-[10px] font-black text-green-400 uppercase mb-1">Rekomendasi Lahan</p>
                           <p className="font-black text-xl">{t.nama}</p>
                           <p className="text-3xl font-black text-yellow-400 mt-2">{hasil.solutions[i]?.toFixed(2)} <span className="text-xs text-white opacity-40">Ha</span></p>
                         </div>
                       ))}
                    </div>
                 </div>
                 <button onClick={()=>setActiveStep('input')} className="mx-auto block text-green-700 font-black flex items-center gap-2"><ArrowRight className="rotate-180"/> ULANGI HITUNG</button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB UBER & HILIR --- */}
        {(tab === 'uber' || tab === 'hilir') && (
          <div className="max-w-6xl mx-auto space-y-12">
            <header>
               <h1 className="text-4xl md:text-5xl font-black text-green-950 tracking-tighter uppercase">{tab} Tani</h1>
               <p className="text-slate-500 font-medium">Solusi lengkap kebutuhan hulu ke hilir pertanian.</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {tab === 'uber' ? (
                <>
                  {dataUber.bahan.map(it => <ProductCard key={it.id} item={it} type="bahan" onBuy={(x)=>setCheckoutItem({...x, qty:1, type:'bahan', purchaseType:'Langsung', totalPrice: x.price})}/>)}
                  {dataUber.alat.map(it => <ProductCard key={it.id} item={it} type="alat" onBuy={(x)=>setCheckoutItem({...x, qty:1, type:'alat', deliveryMode:'Ambil Sendiri', totalPrice: x.price})}/>)}
                  {dataUber.jasa.map(it => <ProductCard key={it.id} item={it} type="jasa" onBuy={(x)=>setCheckoutItem({...x, qty:1, type:'jasa', totalPrice: x.price})}/>)}
                </>
              ) : (
                dataHilir.map(it => <ProductCard key={it.id} item={it} onBuy={(x)=>setCheckoutItem({...x, qty:1, totalPrice: x.price})}/>)
              )}
            </div>
          </div>
        )}

        {/* --- TAB PESANAN --- */}
        {tab === 'pesanan' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-4xl font-black text-green-950 uppercase tracking-tighter">Riwayat Pesanan</h1>
            <div className="space-y-4">
               {userOrders.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-slate-400 font-bold">Belum ada pesanan aktif.</div>
               ) : (
                 userOrders.map((ord: any) => (
                   <div key={ord.id} className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-lg">{ord.itemName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{ord.createdAt?.toDate().toLocaleDateString()}</p>
                        </div>
                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${ord.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {ord.status}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold"><span>Status Progres:</span> <span>{ord.status}</span></div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 bg-green-600 ${ord.status==='Verifikasi'?'w-1/4':ord.status==='Diproses'?'w-1/2':ord.status==='Dikirim'?'w-3/4':'w-full'}`}></div>
                        </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL CHECKOUT PRO --- */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-green-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh]">
              {checkoutStep === 'options' && (
                <div className="p-8 md:p-10 space-y-6">
                  <div className="flex justify-between">
                    <h3 className="text-2xl font-black italic">CHECKOUT</h3>
                    <button onClick={()=>setCheckoutItem(null)}><X/></button>
                  </div>
                  
                  {/* Info Item */}
                  <div className="flex gap-4 bg-slate-50 p-4 rounded-2xl border">
                    <img src={checkoutItem.img} className="w-20 h-20 rounded-xl object-cover" />
                    <div><p className="font-black">{checkoutItem.name}</p><p className="font-black text-green-600">Rp {checkoutItem.price.toLocaleString()}</p></div>
                  </div>

                  {/* OPSI SPESIFIK */}
                  {checkoutItem.type === 'bahan' && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Pilih Sistem Pembelian</label>
                       <div className="grid grid-cols-2 gap-2">
                          <button onClick={()=>setCheckoutItem({...checkoutItem, purchaseType:'Langsung', totalPrice: checkoutItem.price * checkoutItem.qty})} className={`p-3 rounded-xl font-bold text-xs border-2 transition ${checkoutItem.purchaseType==='Langsung'?'border-green-600 bg-green-50 text-green-600':'border-slate-100'}`}>BELI LANGSUNG</button>
                          <button onClick={()=>setCheckoutItem({...checkoutItem, purchaseType:'Grup', totalPrice: (checkoutItem.price * 0.8) * checkoutItem.qty})} className={`p-3 rounded-xl font-bold text-xs border-2 transition ${checkoutItem.purchaseType==='Grup'?'border-yellow-500 bg-yellow-50 text-yellow-700':'border-slate-100'}`}>GRUP (DISKON 20%)</button>
                       </div>
                    </div>
                  )}

                  {checkoutItem.type === 'alat' && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Pilihan Pengambilan</label>
                       <div className="grid grid-cols-2 gap-2">
                          <button onClick={()=>setCheckoutItem({...checkoutItem, deliveryMode:'Ambil Sendiri', totalPrice: checkoutItem.price})} className={`p-3 rounded-xl font-bold text-xs border-2 transition ${checkoutItem.deliveryMode==='Ambil Sendiri'?'border-green-600 bg-green-50 text-green-600':'border-slate-100'}`}>AMBIL SENDIRI</button>
                          <button onClick={()=>setCheckoutItem({...checkoutItem, deliveryMode:'Antar Ke Lahan', totalPrice: checkoutItem.price + 50000})} className={`p-3 rounded-xl font-bold text-xs border-2 transition ${checkoutItem.deliveryMode==='Antar Ke Lahan'?'border-blue-600 bg-blue-50 text-blue-600':'border-slate-100'}`}>DIANTAR (+50rb)</button>
                       </div>
                    </div>
                  )}

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400">Alamat Pengiriman / Lahan</label>
                     <textarea rows={2} className="w-full p-4 bg-slate-50 rounded-2xl border" placeholder="Jl. Raya Pertanian No. 1..." onChange={e=>setCheckoutItem({...checkoutItem, address: e.target.value})}></textarea>
                  </div>

                  <div className="flex justify-between items-center border-t pt-6">
                     <div><p className="text-xs font-bold text-slate-400">TOTAL BAYAR</p><p className="text-2xl font-black text-green-900">Rp {checkoutItem.totalPrice.toLocaleString()}</p></div>
                     <button onClick={()=>setCheckoutStep('qris')} className="bg-green-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl">BAYAR SEKARANG</button>
                  </div>
                </div>
              )}

              {checkoutStep === 'qris' && (
                <div className="p-8 md:p-10 text-center space-y-6">
                  <h3 className="text-xl font-black">SCAN QRIS UNTUK BAYAR</h3>
                  <div className="bg-slate-50 p-4 rounded-3xl border-2 border-dashed inline-block"><QrCode size={180}/></div>
                  <div className="space-y-4">
                    <label className="flex flex-col items-center p-6 border-2 border-dashed rounded-2xl cursor-pointer">
                       <Upload size={24} className="text-green-600 mb-2"/>
                       <span className="text-[10px] font-black uppercase text-slate-400">{proofFile ? proofFile.name : 'Upload Bukti TF'}</span>
                       <input type="file" className="hidden" onChange={e=>setProofFile(e.target.files?.[0])} />
                    </label>
                    <button onClick={submitFinalOrder} className={`w-full py-4 rounded-2xl font-black transition ${proofFile ? 'bg-green-600 text-white shadow-xl' : 'bg-slate-200 text-slate-400'}`}>KONFIRMASI PEMBAYARAN</button>
                    <button onClick={()=>setCheckoutStep('options')} className="text-slate-400 font-bold text-xs uppercase">Batal</button>
                  </div>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="p-16 text-center space-y-6">
                   <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={40}/></div>
                   <h3 className="text-2xl font-black">PESANAN DIPROSES</h3>
                   <p className="text-slate-500 font-medium">Terima kasih, pembayaran Anda sedang kami verifikasi. Silakan cek menu "Riwayat Pesanan".</p>
                   <button onClick={()=>{setCheckoutItem(null); setCheckoutStep('options'); setTab('pesanan'); setProofFile(null);}} className="bg-green-950 text-white px-10 py-4 rounded-2xl font-black">Tutup</button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

// SUB-COMPONENTS
function SideBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-white/10 text-yellow-400 shadow-inner' : 'text-green-100/60 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="text-sm font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function CardContainer({ title, children, onAdd }: any) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border h-fit">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-green-700 text-xs uppercase tracking-widest">{title}</h3>
        <button onClick={onAdd} className="bg-green-50 text-green-600 p-2 rounded-full hover:bg-green-100 transition"><Plus size={18}/></button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ProductCard({ item, onBuy, type }: any) {
  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border p-4 hover:shadow-2xl transition-all group">
      <div className="relative h-44 overflow-hidden rounded-[2rem] mb-4">
        <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
      </div>
      <div className="space-y-3 px-2">
        <h4 className="font-black text-green-950 text-lg leading-tight h-12 line-clamp-2">{item.name}</h4>
        <div className="flex justify-between items-center">
          <p className="font-black text-green-600 text-base italic">Rp {item.price.toLocaleString()}</p>
          <button onClick={() => onBuy(item)} className="bg-green-700 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-90 transition">PESAN</button>
        </div>
      </div>
    </div>
  );
}