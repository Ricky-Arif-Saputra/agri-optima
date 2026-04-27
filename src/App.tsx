import React, { useState, useEffect } from 'react';
// FIREBASE
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, where } from "firebase/firestore";

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
  UserCheck, TruckIcon, X, ArrowRight, Info, MapPin, Search, PlusCircle, MinusCircle
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
  
  // --- STATE OPTIMASI (Z & Kendala) ---
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Luas Lahan (Ha)', koefs: [1], target: 10, type: '<=' }]);
  const [hasil, setHasil] = useState<any>(null);

  // AUTH OBSERVER
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (u) {
        const q = query(collection(db, "orders"), where("userId", "==", u.uid));
        onSnapshot(q, (snap) => {
          setUserOrders(snap.docs.map(d => ({id: d.id, ...d.data()})));
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
    } catch (err: any) { alert("Akses Ditolak: " + err.message); }
  };

  const solveSimplex = () => {
    const N = tanaman.length;
    const M1 = kendala.filter(c => c.type === '<=').length;
    const M2 = kendala.filter(c => c.type === '>=').length;
    const M3 = kendala.filter(c => c.type === '=').length;
    
    // Sort constraints by type (<=, >=, =)
    const sortedK = [
      ...kendala.filter(c => c.type === '<='),
      ...kendala.filter(c => c.type === '>='),
      ...kendala.filter(c => c.type === '=')
    ];

    const A: any = Array.from({ length: sortedK.length + 3 }, () => new Array(N + 2).fill(0));
    
    // Objective Function (Z)
    tanaman.forEach((t, j) => A[1][j + 2] = t.profit);
    
    // Constraints
    sortedK.forEach((c, i) => {
      A[i + 2][1] = c.target;
      c.koefs.forEach((val, j) => {
        A[i + 2][j + 2] = -val;
      });
    });

    try {
      const res = SimplexSolver.solve(N, M1, M2, M3, A);
      setHasil(res);
      setActiveStep('result');
    } catch (e) {
      alert("Error: Pastikan input angka valid dan batasan tersedia.");
    }
  };

  const processPayment = async () => {
    setOrderProgress(5);
    const interval = setInterval(() => {
      setOrderProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 15;
      });
    }, 400);

    setTimeout(async () => {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        itemName: checkoutItem.name,
        qty: checkoutItem.qty,
        total: checkoutItem.price * checkoutItem.qty,
        status: 'Berhasil',
        createdAt: new Date().toISOString()
      });
    }, 2000);
  };

  // DATA MASTER
  const dataUber = {
    bahan: [
      { id: 'b1', name: 'Pupuk Organik Cair', price: 150000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400', desc: 'Meningkatkan hasil panen hingga 30%.' },
      { id: 'b2', name: 'Benih Padi Unggul', price: 85000, img: 'https://images.unsplash.com/photo-1535242208474-9a28972a0d08?w=400', desc: 'Tahan hama wereng dan kekeringan.' }
    ],
    alat: [
      { id: 'a1', name: 'Sewa Combine Harvester', price: 2500000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400', desc: 'Panen cepat dan efisien untuk lahan luas.' }
    ],
    jasa: [
      { id: 'j1', name: 'Manajemen Hama', price: 500000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', desc: 'Pemantauan dan penyemprotan rutin.' }
    ]
  };

  const dataHilir = [
    { id: 'h1', name: 'Beras Premium 10kg', price: 165000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', desc: 'Padi pilihan petani lokal, pulen dan wangi.' },
    { id: 'h2', name: 'Kripik Jagung Balado', price: 25000, img: 'https://images.unsplash.com/photo-1613554830385-a7c360170c72?w=400', desc: 'Hilirisasi jagung kualitas ekspor.' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#052E16] flex items-center justify-center p-6 font-sans">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-green-900 tracking-tighter italic">AGRI-OPTIMA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Sustainable Farming System</p>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="Email Akun" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-green-600 outline-none transition" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Kata Sandi" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-green-600 outline-none transition" onChange={e => setPassword(e.target.value)} />
            <button onClick={() => handleAuth('login')} className="w-full bg-green-700 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-green-800 transition transform active:scale-95">LOGIN</button>
            <button onClick={() => handleAuth('reg')} className="w-full text-green-700 font-bold text-sm">Buat Akun Baru</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F0F4F2] font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-72 bg-[#052E16] text-white fixed h-full p-8 flex flex-col z-30 shadow-2xl">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-yellow-400 p-2 rounded-xl text-green-950 shadow-lg"><Layers size={24}/></div>
          <span className="hidden lg:block font-black text-2xl tracking-tighter italic">AGRI-OPTIMA</span>
        </div>
        <nav className="space-y-2 flex-1">
          <SideBtn active={tab==='optimasi'} icon={<Calculator/>} label="Optimasi Laba" onClick={()=>setTab('optimasi')}/>
          <SideBtn active={tab==='uber'} icon={<Truck/>} label="Uber Tani" onClick={()=>setTab('uber')}/>
          <SideBtn active={tab==='hilir'} icon={<ShoppingBag/>} label="Hilirisasi" onClick={()=>setTab('hilir')}/>
        </nav>
        <div className="pt-6 border-t border-white/10">
          <button onClick={()=>signOut(auth)} className="flex items-center gap-3 text-red-400 font-black text-xs uppercase tracking-widest px-4 py-2 hover:bg-white/5 rounded-xl w-full">
            <LogOut size={18}/> <span className="hidden lg:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-20 lg:ml-72 p-6 lg:p-12">
        {/* OPTIMASI LABA SECTION */}
        {tab === 'optimasi' && (
          <div className="max-w-5xl mx-auto space-y-8">
            {activeStep === 'input' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                <header className="flex justify-between items-end">
                  <div>
                    <h1 className="text-5xl font-black text-green-950 tracking-tighter">OPTIMASI LABA</h1>
                    <p className="text-slate-500 font-medium">Gunakan Linear Programming untuk hasil maksimal.</p>
                  </div>
                  <button onClick={() => setActiveStep('payment')} className="bg-green-600 text-white px-10 py-4 rounded-[1.5rem] font-black shadow-2xl hover:bg-green-700 transition">HITUNG HASIL</button>
                </header>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* FUNGSI TUJUAN (Z) */}
                  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-green-700 text-xs uppercase tracking-widest">Fungsi Tujuan (Profit)</h3>
                      <button onClick={()=>setTanaman([...tanaman, {id:Date.now(), nama:'', profit:0}])} className="bg-green-50 text-green-600 p-2 rounded-full hover:bg-green-100 transition"><Plus size={18}/></button>
                    </div>
                    <div className="space-y-4">
                      {tanaman.map((t, i) => (
                        <div key={t.id} className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <input placeholder="Nama Tanaman" className="flex-1 bg-transparent font-bold outline-none" value={t.nama} onChange={e=>{
                            const n = [...tanaman]; n[i].nama = e.target.value; setTanaman(n);
                          }}/>
                          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl shadow-sm">
                            <span className="text-[10px] font-black text-slate-400">Rp</span>
                            <input type="number" className="w-24 font-black text-green-600 outline-none" value={t.profit} onChange={e=>{
                              const n = [...tanaman]; n[i].profit = Number(e.target.value); setTanaman(n);
                            }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FUNGSI KENDALA */}
                  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-green-700 text-xs uppercase tracking-widest">Fungsi Kendala (Resource)</h3>
                      <button onClick={()=>setKendala([...kendala, {id:Date.now(), nama:'', koefs:Array(tanaman.length).fill(0), target:0, type:'<='}])} className="bg-green-50 text-green-600 p-2 rounded-full hover:bg-green-100 transition"><Plus size={18}/></button>
                    </div>
                    <div className="space-y-6">
                      {kendala.map((k, i) => (
                        <div key={k.id} className="p-6 bg-slate-50 rounded-[2rem] space-y-4">
                          <div className="flex justify-between items-center">
                            <input placeholder="Nama Kendala" className="bg-transparent font-black text-sm uppercase tracking-tight outline-none" value={k.nama} onChange={e=>{
                              const n = [...kendala]; n[i].nama = e.target.value; setKendala(n);
                            }}/>
                            <div className="flex items-center gap-2">
                              <select className="bg-white p-1 rounded-lg text-xs font-bold" value={k.type} onChange={e=>{
                                const n = [...kendala]; n[i].type = e.target.value; setKendala(n);
                              }}>
                                <option value="<=">≤</option><option value=">=">≥</option><option value="=">=</option>
                              </select>
                              <input type="number" className="w-16 bg-white p-1 rounded-lg text-center font-black text-xs" value={k.target} onChange={e=>{
                                const n = [...kendala]; n[i].target = Number(e.target.value); setKendala(n);
                              }}/>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tanaman.map((t, ti) => (
                              <div key={ti} className="bg-white px-3 py-1 rounded-xl border flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase">{t.nama || 'Tanaman'}</span>
                                <input type="number" className="w-8 text-center font-black text-green-600 text-xs" value={k.koefs[ti]} onChange={e=>{
                                  const n = [...kendala]; n[i].koefs[ti] = Number(e.target.value); setKendala(n);
                                }}/>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'payment' && (
              <div className="max-w-md mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl text-center space-y-8 animate-in zoom-in-95">
                <h2 className="text-2xl font-black text-green-950 italic">AGRI-PAY</h2>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] inline-block border-2 border-dashed border-slate-200">
                  <QrCode size={220} className="text-green-900 mx-auto"/>
                </div>
                <div className="bg-green-50 p-6 rounded-[2rem]">
                  <p className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em] mb-1">Fee Konsultasi</p>
                  <p className="text-3xl font-black text-green-900 tracking-tighter">Rp 5.000</p>
                </div>
                <button onClick={solveSimplex} className="w-full bg-green-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-black transition uppercase tracking-widest text-xs">Konfirmasi & Lihat Hasil</button>
                <button onClick={()=>setActiveStep('input')} className="text-slate-400 font-bold text-xs uppercase hover:text-green-600 transition">Kembali ke Input</button>
              </div>
            )}

            {activeStep === 'result' && hasil && (
              <div className="animate-in slide-in-from-top-8 duration-700 space-y-8">
                <div className="bg-[#052E16] p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="bg-yellow-400 text-green-950 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-4">OPTIMAL FOUND</div>
                        <h2 className="text-6xl font-black tracking-tighter">Rp {hasil.maxValue.toLocaleString()}</h2>
                        <p className="text-green-400 font-bold text-xs uppercase tracking-widest mt-2">Estimasi Laba Maksimum Per Musim</p>
                      </div>
                      <TrendingUp size={60} className="text-yellow-400 opacity-50"/>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tanaman.map((t, i) => (
                        <div key={i} className="bg-white/10 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
                          <p className="text-[10px] font-black text-green-400 uppercase mb-1">Rekomendasi Tanam</p>
                          <p className="font-black text-xl">{t.nama}</p>
                          <p className="text-3xl font-black text-yellow-400 mt-2">{hasil.solutions[i]?.toFixed(2)} <span className="text-xs text-white opacity-50">Unit/Ha</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={()=>setActiveStep('input')} className="mx-auto block text-green-700 font-black flex items-center gap-2 hover:gap-4 transition-all"> <ArrowRight className="rotate-180"/> EDIT DATA ULANG</button>
              </div>
            )}
          </div>
        )}

        {/* UBER TANI & HILIRISASI */}
        {(tab === 'uber' || tab === 'hilir') && (
          <div className="max-w-6xl mx-auto space-y-12">
            <header>
              <h1 className="text-5xl font-black text-green-950 tracking-tighter uppercase">{tab === 'uber' ? 'Uber Tani' : 'Hilirisasi'}</h1>
              <p className="text-slate-500 font-medium">Pesan kebutuhan hulu dan produk olahan petani.</p>
            </header>

            {tab === 'uber' ? (
              <div className="space-y-16">
                <ProductGrid title="Bahan Pertanian" items={dataUber.bahan} onBuy={(it)=>setCheckoutItem({...it, qty:1, total:it.price})}/>
                <ProductGrid title="Sewa Alat" items={dataUber.alat} onBuy={(it)=>setCheckoutItem({...it, qty:1, total:it.price})}/>
                <ProductGrid title="Jasa & Manajemen" items={dataUber.jasa} onBuy={(it)=>setCheckoutItem({...it, qty:1, total:it.price})}/>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {dataHilir.map(it => <Card key={it.id} item={it} onBuy={()=>setCheckoutItem({...it, qty:1, total:it.price})}/>)}
              </div>
            )}
          </div>
        )}
      </main>

      {/* GLOBAL CHECKOUT MODAL */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-green-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {orderProgress === 0 ? (
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black text-green-950 tracking-tighter uppercase italic">Checkout</h3>
                  <button onClick={()=>setCheckoutItem(null)} className="text-slate-300 hover:text-red-500 transition"><X size={30}/></button>
                </div>

                <div className="flex gap-6 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                  <img src={checkoutItem.img} className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                  <div className="flex-1">
                    <h4 className="font-black text-xl text-green-950 leading-tight">{checkoutItem.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">{checkoutItem.desc}</p>
                    <p className="text-2xl font-black text-green-600 mt-2">Rp {checkoutItem.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 items-end">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Jumlah Pesanan</label>
                     <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl">
                        <button onClick={()=>setCheckoutItem({...checkoutItem, qty: Math.max(1, checkoutItem.qty-1)})} className="bg-white p-2 rounded-xl shadow-sm hover:text-green-600 transition"><MinusCircle/></button>
                        <span className="flex-1 text-center font-black text-xl">{checkoutItem.qty}</span>
                        <button onClick={()=>setCheckoutItem({...checkoutItem, qty: checkoutItem.qty+1})} className="bg-white p-2 rounded-xl shadow-sm hover:text-green-600 transition"><PlusCircle/></button>
                     </div>
                   </div>
                   <div className="text-right pb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</p>
                      <p className="text-3xl font-black text-green-900 tracking-tighter">Rp {(checkoutItem.price * checkoutItem.qty).toLocaleString()}</p>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Alamat Pengiriman</label>
                  <textarea rows={2} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-green-600 outline-none transition" placeholder="Masukkan alamat lengkap..."></textarea>
                </div>

                <button onClick={processPayment} className="w-full bg-green-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:bg-black transition transform active:scale-95">Bayar & Proses Sekarang</button>
              </div>
            ) : (
              <div className="p-20 text-center space-y-8 animate-in fade-in">
                <div className="relative w-40 h-40 mx-auto">
                   <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin" style={{clipPath: `inset(0 ${100-orderProgress}% 0 0)`}}></div>
                   <div className="absolute inset-0 flex items-center justify-center font-black text-3xl text-green-600 italic">{orderProgress}%</div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-green-950 uppercase tracking-tighter">
                    {orderProgress < 100 ? 'Memproses Pesanan...' : 'Pesanan Berhasil!'}
                  </h3>
                  <p className="text-slate-400 font-medium mt-2">
                    {orderProgress < 100 ? 'Sedang memverifikasi pembayaran Anda.' : `Terima kasih! Pesanan ${checkoutItem.name} sedang kami siapkan.`}
                  </p>
                </div>
                {orderProgress === 100 && (
                  <button onClick={()=>setCheckoutItem(null)} className="bg-green-950 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Kembali ke Beranda</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENTS
function SideBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-white/10 text-yellow-400 shadow-inner scale-105' : 'text-green-100/60 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="hidden lg:block text-sm font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function ProductGrid({ title, items, onBuy }: any) {
  return (
    <section className="space-y-6">
      <h3 className="font-black text-xs uppercase tracking-[0.3em] text-green-600 flex items-center gap-3">
        <div className="h-px w-8 bg-green-600"></div> {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((it: any) => <Card key={it.id} item={it} onBuy={() => onBuy(it)}/>)}
      </div>
    </section>
  );
}

function Card({ item, onBuy }: any) {
  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl transition-all group p-4">
      <div className="relative h-48 overflow-hidden rounded-[2rem] mb-6 shadow-inner">
        <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
      </div>
      <div className="px-2 space-y-4">
        <h4 className="font-black text-green-950 text-xl tracking-tight leading-tight">{item.name}</h4>
        <p className="text-xs text-slate-400 font-medium line-clamp-2">{item.desc}</p>
        <div className="flex justify-between items-center pt-2">
          <p className="font-black text-green-600 text-lg italic tracking-tighter">Rp {item.price.toLocaleString()}</p>
          <button onClick={onBuy} className="bg-green-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all transform active:scale-90">Pesan</button>
        </div>
      </div>
    </div>
  );
}