/**
 * PROJECT: AGRI-OPTIMA ENTERPRISE V7.3 - STABLE LOGIC
 * FIX: RESTORED ORIGINAL SIMPLEX ENGINE + ISOLATED PROOF STATES
 */

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { Calculator, ShoppingBag, Plus, Zap, QrCode, LogOut, UserCheck, Truck, X, ArrowRight, Image as ImageIcon, History, Factory, MapPin, Calendar, RefreshCw, LogIn, UserPlus, TrendingUp, Box, MinusCircle, PlusCircle, CheckCircle2, Cpu } from 'lucide-react';

// ============================================================
// 1. ORIGINAL SIMPLEX ENGINE (TIDAK BERUBAH)
// ============================================================
class EnterpriseSimplexEngine {
  private matrix: number[][] = [];
  private rows: number = 0;
  private cols: number = 0;

  constructor(private variables: any[], private constraints: any[]) {
    this.prepareMatrix();
  }

  private prepareMatrix() {
    const n = this.variables.length;
    const m = this.constraints.length;
    this.rows = m + 2; 
    this.cols = n + m + 2;
    this.matrix = Array.from({ length: this.rows }, () => new Array(this.cols).fill(0));

    for (let j = 0; j < n; j++) {
      this.matrix[1][j + 2] = this.variables[j].profit;
    }

    for (let i = 0; i < m; i++) {
      this.matrix[i + 2][1] = this.constraints[i].target;
      for (let j = 0; j < n; j++) {
        this.matrix[i + 2][j + 2] = -this.constraints[i].koefs[j];
      }
      if (this.constraints[i].type === "<=") {
        this.matrix[i + 2][n + i + 2] = -1;
      } else if (this.constraints[i].type === ">=") {
        this.matrix[i + 2][n + i + 2] = 1;
      } else {
        this.matrix[i + 2][n + i + 2] = 0.0000001; 
      }
    }
  }

  public solve() {
    let iteration = 0;
    const maxIterations = 200;
    while (iteration < maxIterations) {
      let pivotCol = -1;
      let maxVal = 0;
      for (let j = 2; j < this.cols; j++) {
        if (this.matrix[1][j] > maxVal) {
          maxVal = this.matrix[1][j];
          pivotCol = j;
        }
      }
      if (pivotCol === -1) break;
      let pivotRow = -1;
      let minRatio = Infinity;
      for (let i = 2; i < this.rows; i++) {
        const val = -this.matrix[i][pivotCol];
        if (val > 0) {
          const ratio = this.matrix[i][1] / val;
          if (ratio < minRatio) {
            minRatio = ratio;
            pivotRow = i;
          }
        }
      }
      if (pivotRow === -1) break;
      this.pivot(pivotRow, pivotCol);
      iteration++;
    }
    return this.getResult();
  }

  private pivot(r: number, c: number) {
    const pVal = this.matrix[r][c];
    for (let j = 1; j < this.cols; j++) this.matrix[r][j] /= pVal;
    for (let i = 1; i < this.rows; i++) {
      if (i !== r) {
        const factor = this.matrix[i][c];
        for (let j = 1; j < this.cols; j++) {
          this.matrix[i][j] -= factor * this.matrix[r][j];
        }
      }
    }
  }

  private getResult() {
    const results = this.variables.map((_, idx) => {
      let val = 0;
      for (let i = 2; i < this.rows; i++) {
        if (Math.abs(this.matrix[i][idx + 2] - 1) < 1e-7) val = this.matrix[i][1];
      }
      return val;
    });
    return { maxProfit: this.matrix[1][1], solutions: results };
  }
}

// ============================================================
// 2. FIREBASE & CORE LOGIC
// ============================================================
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

export default function AgriOptimaMegaApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'optimasi' | 'market' | 'hilirisasi' | 'history'>('optimasi');
  const [processing, setProcessing] = useState(false);

  // Optimasi States
  const [optPhase, setOptPhase] = useState<'input' | 'pay' | 'result'>('input');
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi IR64', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Lahan', koefs: [1], target: 10, type: '<=' }]);
  const [simplexResult, setSimplexResult] = useState<any>(null);
  const [proofOptimasi, setProofOptimasi] = useState<string | null>(null); // ISOLATED

  // Market States
  const [marketTab, setMarketTab] = useState<'bahan' | 'alat' | 'jasa'>('bahan');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [proofMarket, setProofMarket] = useState<string | null>(null); // ISOLATED
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [shipMode, setShipMode] = useState<'ambil' | 'antar'>('ambil');
  const [buyMode, setBuyMode] = useState<'langsung' | 'gabung'>('langsung');

  const [orders, setOrders] = useState<any[]>([]);

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

  // --- REVISI: HANDLER OPTIMASI ---
  const executeOptimization = async () => {
    if (!proofOptimasi) return alert("Upload bukti transfer!");
    setProcessing(true);
    try {
      // 1. Jalankan Engine Original
      const engine = new EnterpriseSimplexEngine(tanaman, kendala);
      const res = engine.solve();
      
      // 2. Simpan Result ke State (PENTING AGAR TAMPIL)
      setSimplexResult(res);

      // 3. Simpan ke Firebase
      await addDoc(collection(db, "orders"), {
        uid: user.uid, title: "Sertifikat Optimasi Simplex", total: 5000,
        status: "Selesai", type: "Digital", createdAt: Timestamp.now(), proof: proofOptimasi
      });

      // 4. Reset & Redirect
      setProofOptimasi(null);
      setOptPhase('result'); 
    } catch (e) { alert("Error kalkulasi"); } 
    finally { setProcessing(false); }
  };

  // --- REVISI: HANDLER MARKET ---
  const executeMarketOrder = async () => {
    if (!proofMarket) return alert("Upload bukti bayar!");
    setProcessing(true);
    try {
      await addDoc(collection(db, "orders"), {
        uid: user.uid, title: selectedProduct.name,
        total: (selectedProduct.price * qty) + (shipMode === 'antar' ? 25000 : 0),
        status: buyMode === 'gabung' ? "Menunggu Kuota" : "Diproses Admin",
        type: marketTab, address, date: targetDate, qty, createdAt: Timestamp.now(), proof: proofMarket
      });
      setProofMarket(null);
      setSelectedProduct(null); 
      setActiveTab('history');
    } catch (e) { alert("Error Order"); } 
    finally { setProcessing(false); }
  };

  if (loading) return <div className="h-screen bg-emerald-950 flex flex-col items-center justify-center text-white"><Cpu className="animate-spin mb-4" size={50}/><h1>LOADING AGRI-SYSTEM...</h1></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#011F18] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in">
        <h1 className="text-4xl font-black italic tracking-tighter text-emerald-950 text-center">AGRI-OPTIMA</h1>
        <div className="space-y-4">
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="Email" id="email"/>
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" type="password" placeholder="Password" id="pass"/>
          <button onClick={async() => {
            const e = (document.getElementById('email') as HTMLInputElement).value;
            const p = (document.getElementById('pass') as HTMLInputElement).value;
            try { await signInWithEmailAndPassword(auth, e, p); } catch(err:any) { alert(err.message); }
          }} className="w-full bg-emerald-900 text-white py-5 rounded-2xl font-black shadow-xl">AUTHORIZE LOGIN</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F4F3] flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white min-h-screen shadow-2xl relative pb-40">
        
        {/* HEADER */}
        <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-950 p-2 rounded-xl text-yellow-400 shadow-lg"><Zap size={22}/></div>
            <h2 className="font-black text-xl italic tracking-tighter">AGRI-OPTIMA</h2>
          </div>
          <button onClick={()=>signOut(auth)} className="p-3 bg-red-50 text-red-500 rounded-2xl"><LogOut size={20}/></button>
        </header>

        <main className="p-6 space-y-12">
          
          {/* TAB: OPTIMASI */}
          {activeTab === 'optimasi' && (
            <div className="space-y-8">
              {optPhase === 'input' && (
                <>
                  <div className="bg-emerald-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                    <h3 className="text-4xl font-black italic tracking-tighter leading-none relative z-10">Optimasi<br/>Simplex.</h3>
                    <Calculator className="absolute -right-10 -bottom-10 text-white/5" size={200}/>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variabel Tanaman</h4>
                      <button onClick={()=>setTanaman([...tanaman, {id:Date.now(), nama:'', profit:0}])} className="bg-emerald-50 p-2 rounded-xl text-emerald-900 border"><Plus/></button>
                    </div>
                    {tanaman.map((t, i) => (
                      <div key={t.id} className="bg-slate-50 p-5 rounded-[2rem] border-2 border-transparent hover:border-emerald-400 flex items-center gap-4 transition-all">
                        <input className="flex-1 bg-transparent font-black text-lg outline-none" placeholder="Nama Tanaman" value={t.nama} onChange={e=>{let n=[...tanaman]; n[i].nama=e.target.value; setTanaman(n)}}/>
                        <input type="number" className="w-24 bg-transparent font-black text-right outline-none text-emerald-700" value={t.profit} onChange={e=>{let n=[...tanaman]; n[i].profit=Number(e.target.value); setTanaman(n)}}/>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-4 pt-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batasan Produksi</h4>
                      <button onClick={()=>setKendala([...kendala, {id:Date.now(), nama:'', koefs:new Array(tanaman.length).fill(0), target:0, type:'<='}])} className="bg-emerald-50 p-2 rounded-xl text-emerald-900 border"><Plus/></button>
                    </div>
                    {kendala.map((k, i) => (
                      <div key={k.id} className="bg-white p-8 rounded-[3rem] border-2 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-4">
                          <input className="font-black text-emerald-950 uppercase outline-none" placeholder="Batasan" value={k.nama} onChange={e=>{let n=[...kendala]; n[i].nama=e.target.value; setKendala(n)}}/>
                          <input type="number" className="w-20 bg-emerald-950 text-white p-2 rounded-xl text-center font-black" value={k.target} onChange={e=>{let n=[...kendala]; n[i].target=Number(e.target.value); setKendala(n)}}/>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {tanaman.map((t, ti) => (
                            <input key={ti} type="number" className="bg-slate-50 p-3 rounded-xl font-black text-xs border" value={k.koefs[ti] || 0} onChange={e=>{let n=[...kendala]; n[i].koefs[ti]=Number(e.target.value); setKendala(n)}}/>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setOptPhase('pay')} className="w-full bg-emerald-900 text-white py-8 rounded-[3rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4">LIHAT ANALISIS LABA <ArrowRight/></button>
                </>
              )}

              {optPhase === 'pay' && (
                <div className="bg-white p-12 rounded-[5rem] shadow-2xl text-center space-y-10">
                  <div className="flex justify-between"><button onClick={()=>setOptPhase('input')}><X/></button><h3 className="font-black italic">AGRIPAY</h3><div className="w-10"></div></div>
                  <div className="bg-slate-950 p-8 rounded-[3.5rem] inline-block shadow-2xl border-[12px] border-emerald-50"><QrCode size={180} className="text-white"/></div>
                  <h2 className="text-5xl font-black text-emerald-950">Rp 5.000</h2>
                  {proofOptimasi ? (
                    <div className="space-y-4">
                      <img src={proofOptimasi} className="w-full h-48 object-cover rounded-[3rem] border-4 border-emerald-50 shadow-lg"/>
                      <button onClick={executeOptimization} disabled={processing} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-xl">{processing ? 'PROCESSING...' : 'KONFIRMASI BAYAR'}</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center p-16 border-4 border-dashed rounded-[4rem] border-emerald-50 cursor-pointer">
                      <ImageIcon size={60} className="text-emerald-100 mb-4"/>
                      <span className="font-black text-[10px] text-emerald-900 uppercase">UPLOAD BUKTI TRANSFER</span>
                      <input type="file" className="hidden" onChange={e=>{let f=e.target.files?.[0]; if(f) setProofOptimasi(URL.createObjectURL(f))}}/>
                    </label>
                  )}
                </div>
              )}

              {optPhase === 'result' && simplexResult && (
                <div className="space-y-8 animate-in zoom-in">
                  <div className="bg-emerald-950 p-16 rounded-[5rem] text-white shadow-2xl text-center">
                    <h2 className="text-7xl font-black tracking-tighter italic">Rp {simplexResult.maxProfit.toLocaleString()}</h2>
                    <div className="grid grid-cols-1 gap-4 mt-12 text-left">
                      {tanaman.map((t, i) => (
                        <div key={i} className="bg-white/5 p-8 rounded-[3.5rem] border border-white/10 flex justify-between items-center">
                          <div><p className="text-[10px] font-black text-emerald-400 uppercase">{t.nama}</p><p className="text-4xl font-black">{simplexResult.solutions[i]?.toFixed(2)} Ha</p></div>
                          <TrendingUp className="text-emerald-400" size={32}/>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={()=>setOptPhase('input')} className="w-full py-8 rounded-[3rem] border-4 border-emerald-950 text-emerald-950 font-black"><RefreshCw className="inline mr-2"/> ANALISIS BARU</button>
                </div>
              )}
            </div>
          )}

          {/* TAB: MARKETPLACE */}
          {activeTab === 'market' && (
            <div className="space-y-10 animate-in fade-in">
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {['bahan', 'alat', 'jasa'].map(t => (
                  <button key={t} onClick={()=>setMarketTab(t as any)} className={`px-10 py-5 rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest border-2 ${marketTab===t ? 'bg-emerald-950 text-white shadow-xl' : 'bg-white text-slate-400'}`}>{t}</button>
                ))}
              </div>
              {(marketTab === 'bahan' ? [
                {id:1, name:'Pupuk NPK 50kg', price:450000, img:'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500', desc:'Pupuk premium.'},
                {id:2, name:'Bibit Padi Super', price:180000, img:'https://images.unsplash.com/photo-1535242208474-9a28972a0d08?w=500', desc:'Tahan hama.'}
              ] : marketTab === 'alat' ? [
                {id:3, name:'Traktor Kubota', price:1500000, img:'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=500', desc:'Sewa harian.'}
              ] : [
                {id:4, name:'Team Survey NDVI', price:2500000, img:'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500', desc:'Analisis Drone.'}
              ]).map(p => (
                <div key={p.id} className="bg-white p-6 rounded-[3.5rem] border shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
                  <img src={p.img} className="w-32 h-32 rounded-[2.5rem] object-cover" />
                  <div className="flex-1">
                    <h4 className="font-black text-2xl text-emerald-950">{p.name}</h4>
                    <p className="text-3xl font-black text-emerald-700 mt-2">Rp {p.price.toLocaleString()}</p>
                    <button onClick={()=>setSelectedProduct(p)} className="mt-4 bg-emerald-950 text-white px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase">BELI SEKARANG</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: HILIRISASI & HISTORY (DIPERSINGKAT AGAR KODE EFISIEN) */}
          {activeTab === 'hilirisasi' && <div className="p-20 text-center font-black italic text-emerald-900 text-4xl">HILIRISASI INDUSTRI SEGMENT</div>}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-4xl font-black italic">Riwayat Transaksi</h2>
              {orders.map(o => (
                <div key={o.id} className="bg-white p-10 rounded-[4rem] border shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-emerald-50 text-emerald-700 px-4 py-1 rounded-full text-[10px] font-black uppercase">{o.status}</span>
                    <span className="text-[10px] text-slate-300 font-bold">{o.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-2xl font-black text-emerald-950">{o.title}</h4>
                  <p className="text-3xl font-black text-emerald-900 mt-2">Rp {o.total?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* MODAL CHECKOUT MARKET */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-2xl z-[200] flex items-end justify-center">
            <div className="bg-white w-full max-w-2xl rounded-t-[5rem] p-12 overflow-y-auto max-h-[90vh] space-y-8">
              <div className="flex justify-between"><h3 className="text-3xl font-black italic">Checkout</h3><button onClick={()=>{setSelectedProduct(null); setProofMarket(null)}}><X size={32}/></button></div>
              <div className="bg-slate-50 p-8 rounded-[4rem] flex items-center gap-6">
                <img src={selectedProduct.img} className="w-24 h-24 rounded-3xl object-cover shadow-xl"/>
                <h4 className="text-2xl font-black">{selectedProduct.name}</h4>
              </div>
              <textarea placeholder="Alamat Lengkap" className="w-full bg-slate-100 p-8 rounded-[3rem] font-black outline-none min-h-[120px]" onChange={e=>setAddress(e.target.value)}></textarea>
              <div className="bg-emerald-950 p-12 rounded-[4rem] text-center space-y-6">
                <QrCode size={150} className="text-white mx-auto"/>
                <h4 className="text-4xl font-black text-white">Rp {selectedProduct.price.toLocaleString()}</h4>
                {proofMarket ? (
                  <div className="space-y-4">
                    <img src={proofMarket} className="w-48 h-48 mx-auto object-cover rounded-[3rem] border-4 border-white/20"/>
                    <button onClick={executeMarketOrder} disabled={processing} className="w-full bg-emerald-500 text-white py-6 rounded-[3rem] font-black text-xl">{processing ? 'SYNC...' : 'BAYAR SEKARANG'}</button>
                  </div>
                ) : (
                  <label className="w-full bg-white text-emerald-950 py-6 rounded-[3rem] font-black text-xs uppercase cursor-pointer flex items-center justify-center gap-4">
                    <ImageIcon size={24}/> UPLOAD BUKTI BAYAR
                    <input type="file" className="hidden" onChange={e=>{let f=e.target.files?.[0]; if(f) setProofMarket(URL.createObjectURL(f))}}/>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-emerald-950/95 backdrop-blur-3xl rounded-[4rem] p-4 flex justify-around items-center shadow-2xl z-[150]">
          <button onClick={()=>setActiveTab('optimasi')} className={`p-6 rounded-[3rem] ${activeTab==='optimasi' ? 'bg-white text-emerald-950 shadow-xl -translate-y-4' : 'text-emerald-100/40'}`}><Calculator size={28}/></button>
          <button onClick={()=>setActiveTab('market')} className={`p-6 rounded-[3rem] ${activeTab==='market' ? 'bg-white text-emerald-950 shadow-xl -translate-y-4' : 'text-emerald-100/40'}`}><ShoppingBag size={28}/></button>
          <button onClick={()=>setActiveTab('hilirisasi')} className={`p-6 rounded-[3rem] ${activeTab==='hilirisasi' ? 'bg-white text-emerald-950 shadow-xl -translate-y-4' : 'text-emerald-100/40'}`}><Factory size={28}/></button>
          <button onClick={()=>setActiveTab('history')} className={`p-6 rounded-[3rem] ${activeTab==='history' ? 'bg-white text-emerald-950 shadow-xl -translate-y-4' : 'text-emerald-100/40'}`}><History size={28}/></button>
        </nav>

      </div>
    </div>
  );
}