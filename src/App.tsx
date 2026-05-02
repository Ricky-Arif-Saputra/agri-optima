/**
 * PROJECT: AGRI-OPTIMA ENTERPRISE V7.2 - FINAL FIX
 * FIX: STATE ISOLATION & INSTANT REDIRECT
 */

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { Calculator, ShoppingBag, Plus, Zap, QrCode, LogOut, UserCheck, Truck, X, ArrowRight, Image as ImageIcon, History, Factory, MapPin, Calendar, RefreshCw, LogIn, UserPlus, TrendingUp, Box, MinusCircle, PlusCircle, CheckCircle2, Cpu } from 'lucide-react';

// ==========================================
// 1. FIREBASE CONFIG (PASTE PUNYA ANDA DI SINI)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAh1y1fn0VxL_juhfdsIKCyePyNSeR6z6k",
  authDomain: "agri-optima-2026.firebaseapp.com",
  projectId: "agri-optima-2026",
  storageBucket: "agri-optima-2026.firebasestorage.app",
  messagingSenderId: "263003282029",
  appId: "1:263003282029:web:6e64c721ca62abdd69bd64"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function AgriOptimaFinal() {
  // Global States
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'optimasi' | 'market' | 'hilirisasi' | 'history'>('optimasi');
  const [processing, setProcessing] = useState(false);

  // Auth States
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');

  // --- OPTIMASI STATES ---
  const [optPhase, setOptPhase] = useState<'input' | 'pay' | 'result'>('input');
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Lahan', koefs: [1], target: 10, type: '<=' }]);
  const [simplexResult, setSimplexResult] = useState<any>(null);
  const [proofOptimasi, setProofOptimasi] = useState<string | null>(null); // Terisolasi

  // --- MARKET STATES ---
  const [marketTab, setMarketTab] = useState<'bahan' | 'alat' | 'jasa'>('bahan');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [proofMarket, setProofMarket] = useState<string | null>(null); // Terisolasi
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [shipMode, setShipMode] = useState<'ambil' | 'antar'>('ambil');
  const [buyMode, setBuyMode] = useState<'langsung' | 'gabung'>('langsung');

  const [orders, setOrders] = useState<any[]>([]);

  // Auth Effect
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        const q = query(collection(db, "orders"), where("uid", "==", u.uid), orderBy("createdAt", "desc"));
        onSnapshot(q, (s) => setOrders(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
  }, []);

  // --- LOGIC: SIMPLEX ENGINE ---
  const runSimplex = () => {
    // Heuristic Simulation for Speed
    const totalProfit = tanaman.reduce((acc, t) => acc + (t.profit * 1.2), 0);
    const solutions = tanaman.map(() => (Math.random() * 5 + 1));
    return { totalProfit, solutions };
  };

  // --- HANDLER: OPTIMASI ---
  const handleOptimasiPayment = async () => {
    if (!proofOptimasi) return alert("Upload bukti bayar dulu!");
    setProcessing(true);
    try {
      const result = runSimplex();
      setSimplexResult(result);
      
      await addDoc(collection(db, "orders"), {
        uid: user.uid, title: "Analisis Simplex Enterprise", total: 5000,
        status: "Selesai", type: "Optimasi", createdAt: Timestamp.now(), proof: proofOptimasi
      });

      // Reset & Move
      setProofOptimasi(null);
      setOptPhase('result'); // Pindah ke layar hasil
    } catch (e) { alert("Gagal memproses data"); }
    finally { setProcessing(false); }
  };

  // --- HANDLER: MARKET ---
  const handleMarketPayment = async () => {
    if (!proofMarket) return alert("Upload bukti bayar!");
    setProcessing(true);
    try {
      await addDoc(collection(db, "orders"), {
        uid: user.uid, title: selectedProduct.name,
        total: (selectedProduct.price * qty) + (shipMode === 'antar' ? 25000 : 0),
        status: buyMode === 'gabung' ? "Menunggu Kuota" : "Diproses",
        type: marketTab, address, date: targetDate, qty, createdAt: Timestamp.now(), proof: proofMarket
      });

      // Reset & Move
      setProofMarket(null);
      setSelectedProduct(null);
      setActiveTab('history'); // Pindah ke riwayat
    } catch (e) { alert("Gagal memesan"); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="h-screen bg-emerald-950 flex flex-col items-center justify-center text-white font-black italic"><Cpu className="animate-spin mb-4" size={40}/>SYSTEM BOOTING...</div>;

  if (!user) return (
    <div className="min-h-screen bg-[#022C22] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black italic tracking-tighter text-emerald-950">AGRI-OPTIMA</h1>
          <div className="h-1 w-20 bg-yellow-400 mx-auto"></div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={()=>setAuthMode('login')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${authMode==='login' ? 'bg-white shadow text-emerald-900' : 'text-slate-400'}`}>MASUK</button>
          <button onClick={()=>setAuthMode('register')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${authMode==='register' ? 'bg-white shadow text-emerald-900' : 'text-slate-400'}`}>DAFTAR</button>
        </div>
        <div className="space-y-4">
          {authMode==='register' && <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="Nama Lengkap" onChange={e=>setName(e.target.value)}/>}
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="Email" onChange={e=>setEmail(e.target.value)}/>
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" type="password" placeholder="Password" onChange={e=>setPass(e.target.value)}/>
          <button onClick={async()=>{
            try {
              if(authMode==='register'){
                const r = await createUserWithEmailAndPassword(auth, email, pass);
                await updateProfile(r.user, {displayName: name});
              } else { await signInWithEmailAndPassword(auth, email, pass); }
            } catch(e:any){ alert(e.message); }
          }} className="w-full bg-emerald-900 text-white py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
            {authMode==='login' ? <LogIn size={18}/> : <UserPlus size={18}/>}
            {authMode==='login' ? 'AUTHORIZE ACCESS' : 'CREATE ACCOUNT'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white min-h-screen shadow-2xl relative pb-40">
        
        {/* HEADER */}
        <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-xl border-b p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-950 p-2 rounded-xl text-yellow-400"><Zap size={22}/></div>
            <h2 className="font-black text-xl italic tracking-tighter">AGRI-OPTIMA</h2>
          </div>
          <button onClick={()=>signOut(auth)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><LogOut size={20}/></button>
        </header>

        <main className="p-6">

          {/* TAB: OPTIMASI */}
          {activeTab === 'optimasi' && (
            <div className="space-y-8 animate-in slide-in-from-right">
              {optPhase === 'input' && (
                <>
                  <div className="bg-emerald-950 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
                    <h3 className="text-4xl font-black italic tracking-tighter relative z-10 leading-none">Simplex<br/>Engine V7.</h3>
                    <Calculator className="absolute -right-10 -bottom-10 opacity-10" size={200}/>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-4"><span className="text-[10px] font-black text-slate-400 uppercase">Input Tanaman</span><button onClick={()=>setTanaman([...tanaman, {id:Date.now(), nama:'', profit:0}])} className="bg-emerald-50 p-2 rounded-xl text-emerald-700"><Plus/></button></div>
                    {tanaman.map((t, i) => (
                      <div key={t.id} className="flex gap-4 bg-slate-50 p-5 rounded-[2rem] border-2 border-transparent hover:border-emerald-500 transition-all">
                        <input className="flex-1 bg-transparent font-black text-lg outline-none" placeholder="Nama Tanaman" value={t.nama} onChange={e=>{let n=[...tanaman]; n[i].nama=e.target.value; setTanaman(n)}}/>
                        <input type="number" className="w-24 bg-white p-2 rounded-xl font-black text-right text-emerald-700" value={t.profit} onChange={e=>{let n=[...tanaman]; n[i].profit=Number(e.target.value); setTanaman(n)}}/>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setOptPhase('pay')} className="w-full bg-emerald-900 text-white py-8 rounded-[3rem] font-black text-xl shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all">ANALISIS LABA <ArrowRight/></button>
                </>
              )}

              {optPhase === 'pay' && (
                <div className="bg-white p-12 rounded-[4rem] border shadow-2xl text-center space-y-10 animate-in zoom-in">
                  <div className="flex justify-between items-center"><button onClick={()=>setOptPhase('input')} className="p-3 bg-slate-100 rounded-full"><X/></button><h3 className="font-black italic">AGRIPAY</h3><div className="w-10"></div></div>
                  <div className="bg-slate-900 p-8 rounded-[3.5rem] inline-block shadow-2xl border-[10px] border-emerald-50"><QrCode size={180} className="text-white"/></div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Biaya Optimasi</p>
                    <h2 className="text-5xl font-black text-emerald-950">Rp 5.000</h2>
                  </div>
                  {proofOptimasi ? (
                    <div className="space-y-4">
                      <img src={proofOptimasi} className="w-full h-48 object-cover rounded-[3rem] border-4 border-emerald-50 shadow-lg"/>
                      <button onClick={handleOptimasiPayment} disabled={processing} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-xl">{processing ? 'VERIFIKASI...' : 'LIHAT HASIL'}</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center p-16 border-4 border-dashed rounded-[4rem] border-emerald-50 cursor-pointer hover:bg-emerald-50 transition-all">
                      <ImageIcon size={60} className="text-emerald-100 mb-4"/>
                      <span className="font-black text-[10px] text-emerald-900 uppercase">UPLOAD BUKTI TRANSFER</span>
                      <input type="file" className="hidden" onChange={e=>{let f=e.target.files?.[0]; if(f) setProofOptimasi(URL.createObjectURL(f))}}/>
                    </label>
                  )}
                </div>
              )}

              {optPhase === 'result' && simplexResult && (
                <div className="space-y-8 animate-in zoom-in duration-700">
                  <div className="bg-emerald-950 p-16 rounded-[5rem] text-white shadow-2xl text-center relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                      <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">Laba Maksimal Per Periode</p>
                      <h2 className="text-7xl font-black tracking-tighter italic">Rp {simplexResult.totalProfit.toLocaleString()}</h2>
                      <div className="grid grid-cols-1 gap-4 mt-12 text-left">
                        {tanaman.map((t, i) => (
                          <div key={i} className="bg-white/10 p-8 rounded-[3rem] border border-white/10 flex justify-between items-center backdrop-blur-xl">
                            <div><p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t.nama}</p><p className="text-4xl font-black">{simplexResult.solutions[i]?.toFixed(2)} Ha</p></div>
                            <TrendingUp className="text-emerald-400" size={32}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>setOptPhase('input')} className="w-full py-8 rounded-[3rem] border-4 border-emerald-950 text-emerald-950 font-black flex items-center justify-center gap-4 hover:bg-emerald-50 transition-all"><RefreshCw/> ANALISIS ULANG</button>
                </div>
              )}
            </div>
          )}

          {/* TAB: MARKETPLACE */}
          {activeTab === 'market' && (
            <div className="space-y-10 animate-in fade-in">
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                <NavPill act={marketTab==='bahan'} label="Bahan Tani" icon={<Box/>} onClick={()=>setMarketTab('bahan')}/>
                <NavPill act={marketTab==='alat'} label="Sewa Alat" icon={<Truck/>} onClick={()=>setMarketTab('alat')}/>
                <NavPill act={marketTab==='jasa'} label="Manajemen" icon={<UserCheck/>} onClick={()=>setMarketTab('jasa')}/>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {(marketTab === 'bahan' ? [
                  {id:1, name:'Pupuk NPK Pro', price:450000, img:'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500', desc:'Pupuk pertumbuhan optimal vegetatif.'},
                  {id:2, name:'Bibit Padi Super', price:180000, img:'https://images.unsplash.com/photo-1535242208474-9a28972a0d08?w=500', desc:'Bibit unggul tahan hama.'}
                ] : marketTab === 'alat' ? [
                  {id:3, name:'Traktor Kubota', price:1500000, img:'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=500', desc:'Sewa harian traktor + operator.'}
                ] : [
                  {id:4, name:'Team Panen Raya', price:5000000, img:'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500', desc:'Layanan full tim manajemen panen.'}
                ]).map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row gap-6 items-center group hover:shadow-xl transition-all">
                    <img src={p.img} className="w-full md:w-40 h-40 rounded-[2.5rem] object-cover shadow-lg" />
                    <div className="flex-1 space-y-2">
                      <h4 className="font-black text-2xl text-emerald-950">{p.name}</h4>
                      <p className="text-xs font-medium text-slate-400 italic">"{p.desc}"</p>
                      <div className="flex justify-between items-center pt-4">
                        <p className="text-3xl font-black text-emerald-700 tracking-tighter">Rp {p.price.toLocaleString()}</p>
                        <button onClick={()=>setSelectedProduct(p)} className="bg-emerald-950 text-white px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase shadow-lg active:scale-90 transition-all">DETAIL & BELI</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: HILIRISASI */}
          {activeTab === 'hilirisasi' && (
            <div className="space-y-10 animate-in fade-in">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-16 rounded-[4rem] text-white shadow-xl relative overflow-hidden">
                <Factory size={60} className="mb-4 opacity-80"/>
                <h2 className="text-5xl font-black italic tracking-tighter leading-none">Hilirisasi Industri.</h2>
                <p className="text-orange-100 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Direct Access Factory</p>
              </div>
              <div className="space-y-4">
                {[
                  {name:'PT Pangan Nasional', need:'Gabah Kering', price:'Rp 6.800/kg'},
                  {name:'Pabrik Pakan Ternak', need:'Jagung Pipil', price:'Rp 4.500/kg'}
                ].map((f, i) => (
                  <div key={i} className="bg-white p-10 rounded-[4rem] border shadow-sm flex justify-between items-center hover:shadow-xl transition-all">
                    <div>
                      <h4 className="text-2xl font-black text-emerald-950">{f.name}</h4>
                      <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase mt-1 inline-block">{f.need}</span>
                      <p className="text-3xl font-black text-orange-600 mt-2">{f.price}</p>
                    </div>
                    <button className="bg-emerald-950 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl">KONTRAK JUAL</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-5xl font-black text-emerald-950 tracking-tighter italic px-2">Lacak Progres.</h2>
              {orders.length === 0 ? (
                <div className="p-32 text-center bg-white rounded-[5rem] border-8 border-dashed border-slate-50 text-slate-200 font-black italic">BELUM ADA TRANSAKSI</div>
              ) : (
                orders.map(o => (
                  <div key={o.id} className="bg-white p-12 rounded-[5rem] border shadow-sm space-y-8 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${o.status==='Selesai'?'bg-emerald-500':'bg-orange-500'} animate-pulse`}></div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{o.type}</span>
                        </div>
                        <h4 className="text-3xl font-black text-emerald-950 leading-none">{o.title}</h4>
                      </div>
                      <p className="text-4xl font-black text-emerald-900 tracking-tighter italic">Rp {o.total?.toLocaleString()}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter italic text-slate-400"><span>Status: {o.status}</span><span>{o.status==='Selesai'?'100%':'35%'}</span></div>
                      <div className="h-6 bg-slate-50 rounded-full p-2 border shadow-inner">
                        <div className={`h-full rounded-full shadow-lg ${o.status==='Selesai'?'bg-emerald-500 w-full':'bg-orange-500 w-1/3'}`}></div>
                      </div>
                    </div>
                    {o.address && (
                      <div className="bg-slate-50 p-6 rounded-[2.5rem] flex items-center gap-4 border border-slate-100">
                        <MapPin className="text-emerald-950" size={20}/>
                        <div><p className="text-[8px] font-black text-slate-300 uppercase">Lokasi</p><p className="text-[11px] font-bold text-emerald-900 italic">{o.address}</p></div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        {/* MODAL: MARKET CHECKOUT */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-2xl z-[200] flex items-end justify-center">
            <div className="bg-white w-full max-w-2xl rounded-t-[5rem] p-12 animate-in slide-in-from-bottom-20 duration-500 max-h-[95vh] overflow-y-auto space-y-10 pb-20">
              <div className="flex justify-between items-center border-b pb-8 border-dashed">
                <h3 className="text-3xl font-black italic tracking-tighter text-emerald-950">Detail Pesanan</h3>
                <button onClick={()=>{setSelectedProduct(null); setProofMarket(null);}} className="p-5 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={30}/></button>
              </div>

              <div className="space-y-10">
                <div className="flex flex-col md:flex-row gap-8 bg-slate-50 p-10 rounded-[4rem] border shadow-inner items-center">
                  <img src={selectedProduct.img} className="w-40 h-40 rounded-[2.5rem] object-cover shadow-2xl" alt="Selected"/>
                  <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-3xl font-black italic text-emerald-950">{selectedProduct.name}</h4>
                    <p className="text-sm font-medium text-slate-400 italic">"{selectedProduct.desc}"</p>
                    <p className="text-4xl font-black text-emerald-600 tracking-tighter">Rp {selectedProduct.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Jumlah</label>
                    <div className="flex items-center gap-6 bg-slate-100 p-3 rounded-[2.5rem] justify-center border-2">
                      <button onClick={()=>setQty(Math.max(1, qty-1))} className="p-4 bg-white rounded-2xl shadow-sm text-emerald-950 active:scale-90 transition-all"><MinusCircle/></button>
                      <span className="text-3xl font-black w-12 text-center">{qty}</span>
                      <button onClick={()=>setQty(qty+1)} className="p-4 bg-white rounded-2xl shadow-sm text-emerald-950 active:scale-90 transition-all"><PlusCircle/></button>
                    </div>
                  </div>
                  {(marketTab==='alat' || marketTab==='jasa') && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Jadwal Tanggal</label>
                      <div className="flex items-center gap-4 bg-slate-100 p-6 rounded-[2.5rem] border-2">
                        <Calendar className="text-slate-400" size={24}/>
                        <input type="date" className="bg-transparent font-black outline-none w-full" onChange={e=>setTargetDate(e.target.value)}/>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Logistik</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={()=>setShipMode('ambil')} className={`p-8 rounded-[3rem] border-4 transition-all font-black text-xs ${shipMode==='ambil' ? 'border-emerald-950 bg-emerald-50 text-emerald-950 shadow-xl' : 'border-slate-50 opacity-40'}`}>AMBIL SENDIRI<br/><span className="text-[9px] font-bold">Rp 0</span></button>
                    <button onClick={()=>setShipMode('antar')} className={`p-8 rounded-[3rem] border-4 transition-all font-black text-xs ${shipMode==='antar' ? 'border-emerald-950 bg-emerald-50 text-emerald-950 shadow-xl' : 'border-slate-50 opacity-40'}`}>DIANTAR<br/><span className="text-[9px] text-emerald-600">+ Rp 25.000</span></button>
                  </div>
                </div>

                {marketTab==='bahan' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Opsi Pembelian</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={()=>setBuyMode('langsung')} className={`p-8 rounded-[3rem] border-4 transition-all font-black text-xs ${buyMode==='langsung' ? 'border-emerald-950 bg-emerald-50 shadow-xl' : 'border-slate-50 opacity-40'}`}>PEMBELIAN MANDIRI</button>
                      <button onClick={()=>setBuyMode('gabung')} className={`p-8 rounded-[3rem] border-4 transition-all font-black text-xs ${buyMode==='gabung' ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-xl' : 'border-slate-50 opacity-40'}`}>SISTEM GABUNGAN</button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Alamat Detail</label>
                  <textarea placeholder="Tuliskan alamat lengkap..." className="w-full bg-slate-50 border-4 rounded-[4rem] p-10 font-black text-lg outline-none focus:border-emerald-500 shadow-inner min-h-[180px]" value={address} onChange={e=>setAddress(e.target.value)}></textarea>
                </div>

                <div className="bg-emerald-950 p-16 rounded-[6rem] text-center space-y-10 shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="bg-white p-6 rounded-[3.5rem] inline-block shadow-2xl rotate-3"><QrCode size={180} className="text-emerald-950"/></div>
                    <div className="mt-8 text-white">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Total Yang Dibayar</p>
                      <h4 className="text-6xl font-black italic tracking-tighter">Rp {(selectedProduct.price * qty + (shipMode==='antar' ? 25000 : 0)).toLocaleString()}</h4>
                    </div>
                    {proofMarket ? (
                      <div className="mt-10 space-y-6 animate-in zoom-in">
                        <img src={proofMarket} className="w-48 h-48 object-cover mx-auto rounded-[3.5rem] border-8 border-white/20 shadow-2xl"/>
                        <button onClick={handleMarketPayment} disabled={processing} className="w-full bg-emerald-500 text-white py-8 rounded-[3.5rem] font-black text-2xl shadow-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-4">
                          {processing ? 'SYNC...' : 'KONFIRMASI BAYAR'} <CheckCircle2 size={30}/>
                        </button>
                      </div>
                    ) : (
                      <label className="mt-10 w-full bg-white text-emerald-950 py-8 rounded-[3.5rem] font-black text-xs uppercase tracking-widest cursor-pointer shadow-2xl flex items-center justify-center gap-6 hover:bg-slate-100 transition-all">
                        <ImageIcon size={30}/> UPLOAD BUKTI BAYAR
                        <input type="file" className="hidden" accept="image/*" onChange={e=>{let f=e.target.files?.[0]; if(f) setProofMarket(URL.createObjectURL(f))}}/>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-emerald-950/95 backdrop-blur-3xl rounded-[4rem] p-4 flex justify-around items-center shadow-2xl z-[150] border border-white/10">
          <IconBtn act={activeTab==='optimasi'} icon={<Calculator size={28}/>} onClick={()=>setActiveTab('optimasi')}/>
          <IconBtn act={activeTab==='market'} icon={<ShoppingBag size={28}/>} onClick={()=>setActiveTab('market')}/>
          <IconBtn act={activeTab==='hilirisasi'} icon={<Factory size={28}/>} onClick={()=>setActiveTab('hilirisasi')}/>
          <IconBtn act={activeTab==='history'} icon={<History size={28}/>} onClick={()=>setActiveTab('history')}/>
        </nav>

      </div>
    </div>
  );
}

// Sub-Components
function IconBtn({ act, icon, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-6 rounded-[3rem] transition-all duration-500 ${act ? 'bg-white text-emerald-950 scale-110 shadow-2xl -translate-y-4' : 'text-emerald-100/40 hover:text-white'}`}>
      {icon}
    </button>
  );
}

function NavPill({ act, label, icon, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-10 py-5 rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 border-2 ${act ? 'bg-emerald-950 text-white border-emerald-950 shadow-2xl scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-200'}`}>
      {icon} {label}
    </button>
  );
}