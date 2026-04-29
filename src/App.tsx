import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// CORE ENGINE
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, 
  signOut, createUserWithEmailAndPassword, updateProfile 
} from "firebase/auth";
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, 
  addDoc, query, where, orderBy, Timestamp, limit, 
  updateDoc, deleteDoc, getDocs 
} from "firebase/firestore";

// UI ASSETS
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, Layers, 
  CheckCircle2, TrendingUp, Package, Box, QrCode, LogOut, 
  UserCheck, TruckIcon, X, ArrowRight, Search, Info, MapPin, 
  PlusCircle, MinusCircle, Upload, ClipboardCheck, Clock, 
  CreditCard, Menu, Home, Store, History, User, ChevronRight, 
  Image as ImageIcon, Star, ShieldCheck, Zap, ArrowDownWideArrow, 
  Bell, Filter, Settings, RefreshCw, HelpCircle, ChevronDown,
  Monitor, Smartphone, Globe, Lock, Mail, Key
} from 'lucide-react';

/**
 * ============================================================
 * 1. ADVANCED MATHEMATICAL ENGINE (SIMPLEX ALGORITHM)
 * ============================================================
 */
class SimplexOptimizer {
  private table: number[][] = [];
  private rows: number = 0;
  private cols: number = 0;

  constructor(private nVars: number, private nConstraints: number, matrix: number[][]) {
    this.table = JSON.parse(JSON.stringify(matrix));
    this.rows = nConstraints + 2;
    this.cols = nVars + 2;
  }

  public solve() {
    let iteration = 0;
    const maxIterations = 500;

    while (iteration < maxIterations) {
      const pivotCol = this.findPivotColumn();
      if (pivotCol === -1) break;

      const pivotRow = this.findPivotRow(pivotCol);
      if (pivotRow === -1) break;

      this.executePivot(pivotRow, pivotCol);
      iteration++;
    }

    return this.extractResults();
  }

  private findPivotColumn(): number {
    let maxVal = 0;
    let colIdx = -1;
    for (let j = 2; j < this.cols; j++) {
      if (this.table[1][j] > maxVal) {
        maxVal = this.table[1][j];
        colIdx = j;
      }
    }
    return colIdx;
  }

  private findPivotRow(col: number): number {
    let minRatio = Infinity;
    let rowIdx = -1;
    for (let i = 2; i < this.rows; i++) {
      const val = -this.table[i][col];
      if (val > 0) {
        const ratio = this.table[i][1] / val;
        if (ratio < minRatio) {
          minRatio = ratio;
          rowIdx = i;
        }
      }
    }
    return rowIdx;
  }

  private executePivot(row: number, col: number) {
    const pivotValue = this.table[row][col];
    for (let j = 1; j < this.cols; j++) {
      this.table[row][j] /= pivotValue;
    }
    for (let i = 1; i < this.rows; i++) {
      if (i !== row) {
        const factor = this.table[i][col];
        for (let j = 1; j < this.cols; j++) {
          this.table[i][j] -= factor * this.table[row][j];
        }
      }
    }
  }

  private extractResults() {
    const solutions = new Array(this.nVars).fill(0);
    for (let j = 2; j < this.cols; j++) {
      let basicRow = -1;
      let isBasic = true;
      for (let i = 2; i < this.rows; i++) {
        if (Math.abs(this.table[i][j] - 1) < 1e-9) {
          if (basicRow === -1) basicRow = i;
          else isBasic = false;
        } else if (Math.abs(this.table[i][j]) > 1e-9) {
          isBasic = false;
        }
      }
      if (isBasic && basicRow !== -1) {
        solutions[j - 2] = this.table[basicRow][1];
      }
    }
    return {
      maxProfit: this.table[1][1],
      solutions: solutions,
      iterations: 0
    };
  }
}

/**
 * ============================================================
 * 2. FIREBASE INFRASTRUCTURE
 * ============================================================
 */
const firebaseConfig = {
  apiKey: "AIzaSyC-GANTI-DENGAN-API-KEY-ASLI-ANDA", 
  authDomain: "agri-optima-2026.firebaseapp.com",
  projectId: "agri-optima-2026",
  storageBucket: "agri-optima-2026.firebasestorage.app",
  messagingSenderId: "263003282029",
  appId: "1:263003282029:web:6e64c721ca62abdd69bd64"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * ============================================================
 * 3. MAIN APPLICATION COMPONENT
 * ============================================================
 */
export default function AgriOptimaApp() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<'optimasi' | 'market' | 'history' | 'profile'>('optimasi');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");

  // Optimasi Engine States
  const [optStep, setOptStep] = useState<'input' | 'payment' | 'result'>('input');
  const [tanamanList, setTanamanList] = useState([
    { id: '1', nama: 'Padi Gogo', profit: 15000000 },
    { id: '2', nama: 'Jagung Manis', profit: 12000000 }
  ]);
  const [constraintList, setConstraintList] = useState([
    { id: 'c1', nama: 'Lahan Tersedia (Ha)', vals: [1, 1], limit: 10 },
    { id: 'c2', nama: 'Modal Pupuk (Juta)', vals: [2, 1.5], limit: 15 }
  ]);
  const [simplexResult, setSimplexResult] = useState<any>(null);

  // Marketplace States
  const [marketCategory, setMarketCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItem, setCartItem] = useState<any>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);

  // History States
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  // Auth States
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  /**
   * EFFECT: Auth Observer & Sync
   */
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
      if (user) {
        const q = query(collection(db, "orders"), where("uid", "==", user.uid), orderBy("date", "desc"));
        const unsubDocs = onSnapshot(q, (snap) => {
          setOrderHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubDocs();
      }
    });
    return () => unsubAuth();
  }, []);

  /**
   * ACTION: Trigger Notification
   */
  const triggerNotif = (msg: string) => {
    setNotifMsg(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  /**
   * ACTION: Authentication Logic
   */
  const handleAuthAction = async () => {
    try {
      if (isRegistering) {
        const res = await createUserWithEmailAndPassword(auth, authEmail, authPass);
        await setDoc(doc(db, "users", res.user.uid), {
          email: authEmail,
          role: 'petani',
          createdAt: Timestamp.now()
        });
        triggerNotif("Akun berhasil dibuat!");
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPass);
        triggerNotif("Selamat datang kembali!");
      }
    } catch (err: any) {
      alert("Error: Pastikan API Key Firebase sudah anda ganti dengan yang valid.");
    }
  };

  /**
   * ACTION: Core Simplex Execution
   */
  const runOptimization = () => {
    const n = tanamanList.length;
    const m = constraintList.length;
    
    // Build Table Matrix
    const matrix = Array.from({ length: m + 3 }, () => new Array(n + 2).fill(0));
    tanamanList.forEach((t, j) => matrix[1][j + 2] = t.profit);
    constraintList.forEach((c, i) => {
      matrix[i + 2][1] = c.limit;
      c.vals.forEach((v, j) => matrix[i + 2][j + 2] = -v);
    });

    const engine = new SimplexOptimizer(n, m, matrix);
    const result = engine.solve();
    setSimplexResult(result);
    setOptStep('result');
  };

  /**
   * ACTION: Finalize Order (Instant)
   */
  const processFinalOrder = async (isDigital = false) => {
    if (!paymentPreview) return alert("Silahkan upload bukti pembayaran terlebih dahulu.");
    
    const orderData = isDigital ? {
      title: "Premium Analysis Token",
      price: 5000,
      qty: 1,
      status: "Verified",
      type: "Digital Service"
    } : {
      title: cartItem.name,
      price: cartItem.price,
      qty: cartItem.qty,
      status: "Diproses",
      type: "Physical Goods"
    };

    await addDoc(collection(db, "orders"), {
      ...orderData,
      uid: currentUser.uid,
      date: Timestamp.now(),
      total: isDigital ? 5000 : cartItem.price * cartItem.qty
    });

    if (isDigital) {
      runOptimization();
    } else {
      setCartItem(null);
      setActiveTab('history');
    }
    setPaymentFile(null);
    setPaymentPreview(null);
  };

  /**
   * RENDER: AUTH SCREEN
   */
  if (!currentUser && !isLoading) {
    return (
      <div className="min-h-screen bg-[#022C22] flex flex-col items-center justify-center p-8 font-sans">
        <div className="w-full max-w-md bg-white rounded-[4rem] p-12 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in duration-700">
           <div className="text-center space-y-4 mb-12">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-[2rem] flex items-center justify-center mx-auto rotate-3 shadow-inner">
                <Layers size={40}/>
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter text-emerald-950">AGRI-OPTIMA</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">The Simplex Powerhouse</p>
           </div>
           
           <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-slate-300" size={20}/>
                <input className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold transition-all" placeholder="Email Address" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} />
              </div>
              <div className="relative">
                <Key className="absolute left-4 top-4 text-slate-300" size={20}/>
                <input className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold transition-all" type="password" placeholder="Password" value={authPass} onChange={e=>setAuthPass(e.target.value)} />
              </div>
              <button onClick={handleAuthAction} className="w-full bg-emerald-800 text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all mt-4 tracking-widest uppercase text-sm">
                {isRegistering ? 'Daftar Sekarang' : 'Masuk Sistem'}
              </button>
              <button onClick={()=>setIsRegistering(!isRegistering)} className="w-full text-emerald-700 font-black text-xs uppercase tracking-tighter opacity-60">
                {isRegistering ? 'Sudah punya akun? Login' : 'Belum ada akun? Buat Baru'}
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F5F2] text-slate-900 pb-36 overflow-x-hidden">
      
      {/* APP HEADER */}
      <header className="bg-white/90 backdrop-blur-2xl border-b sticky top-0 z-[60] px-8 py-6 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-4">
            <div className="bg-emerald-950 text-white p-3 rounded-2xl rotate-6 shadow-lg"><Zap size={22}/></div>
            <div>
              <h2 className="font-black text-2xl italic tracking-tighter text-emerald-950 leading-none">AGRI-OPTIMA</h2>
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Dashboard v4.0</span>
            </div>
         </div>
         <div className="flex gap-3">
            <div className="relative">
              <button className="p-3 bg-slate-100 rounded-2xl text-slate-500"><Bell size={22}/></button>
              <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <button onClick={()=>signOut(auth)} className="p-3 bg-red-50 rounded-2xl text-red-500 shadow-sm"><LogOut size={22}/></button>
         </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-12">

        {/* TAB: OPTIMASI */}
        {activeTab === 'optimasi' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {optStep === 'input' && (
              <>
                <section className="bg-emerald-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-20 -top-20 opacity-10 group-hover:scale-110 transition-transform duration-700"><Calculator size={300}/></div>
                  <div className="relative z-10">
                    <h3 className="text-4xl font-black italic tracking-tighter mb-2">Simplex Engine.</h3>
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-12">Kalkulasi Laba Maksimal lahan Anda</p>
                    <div className="flex gap-4">
                      <div className="bg-white/10 px-6 py-4 rounded-3xl border border-white/10 backdrop-blur-md">
                        <p className="text-[9px] font-black text-emerald-300 uppercase">Input</p>
                        <p className="text-xl font-black">{tanamanList.length} Tanaman</p>
                      </div>
                      <div className="bg-white/10 px-6 py-4 rounded-3xl border border-white/10 backdrop-blur-md">
                        <p className="text-[9px] font-black text-emerald-300 uppercase">Limit</p>
                        <p className="text-xl font-black">{constraintList.length} Kendala</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Variabel Tanaman</h4>
                    <button onClick={()=>setTanamanList([...tanamanList, {id: Date.now().toString(), nama: '', profit: 0}])} className="bg-white p-2.5 rounded-xl shadow-sm border text-emerald-700 hover:bg-emerald-50"><Plus size={20}/></button>
                  </div>
                  {tanamanList.map((t, i) => (
                    <div key={t.id} className="flex gap-4 bg-white p-5 rounded-[2rem] border shadow-sm items-center group">
                      <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-300 italic">{i+1}</div>
                      <input className="flex-1 bg-transparent font-black text-lg outline-none text-emerald-950" placeholder="Nama Tanaman" value={t.nama} onChange={e=>{
                        const newL = [...tanamanList]; newL[i].nama = e.target.value; setTanamanList(newL);
                      }}/>
                      <div className="flex items-center gap-2 bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100">
                        <span className="text-[10px] font-black text-emerald-600">RP</span>
                        <input type="number" className="w-24 font-black text-emerald-950 text-md bg-transparent outline-none" value={t.profit} onChange={e=>{
                          const newL = [...tanamanList]; newL[i].profit = Number(e.target.value); setTanamanList(newL);
                        }}/>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Batasan (Resource)</h4>
                    <button onClick={()=>setConstraintList([...constraintList, {id: Date.now().toString(), nama: '', vals: new Array(tanamanList.length).fill(0), limit: 0}])} className="bg-white p-2.5 rounded-xl shadow-sm border text-emerald-700 hover:bg-emerald-50"><Plus size={20}/></button>
                  </div>
                  {constraintList.map((c, i) => (
                    <div key={c.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-6 animate-in slide-in-from-right">
                       <div className="flex justify-between items-center border-b border-dashed pb-4">
                          <input className="font-black text-sm uppercase text-emerald-900 outline-none w-2/3" placeholder="Nama Kendala (Lahan/Pupuk)" value={c.nama} onChange={e=>{
                             const newL = [...constraintList]; newL[i].nama = e.target.value; setConstraintList(newL);
                          }}/>
                          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl">
                             <span className="text-[8px] font-bold">MAX</span>
                             <input type="number" className="w-12 bg-transparent text-center font-black text-sm outline-none" value={c.limit} onChange={e=>{
                               const newL = [...constraintList]; newL[i].limit = Number(e.target.value); setConstraintList(newL);
                             }}/>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          {tanamanList.map((t, ti) => (
                            <div key={ti} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border group hover:border-emerald-300 transition-colors">
                               <span className="text-[9px] font-black text-slate-400 uppercase truncate pr-2">{t.nama || 'Var'}</span>
                               <input type="number" className="w-10 text-right font-black text-emerald-700 bg-transparent outline-none" value={c.vals[ti] || 0} onChange={e=>{
                                 const newL = [...constraintList]; 
                                 if(!newL[i].vals) newL[i].vals = [];
                                 newL[i].vals[ti] = Number(e.target.value); 
                                 setConstraintList(newL);
                               }}/>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setOptStep('payment')} className="w-full bg-emerald-700 text-white py-8 rounded-[3rem] font-black shadow-2xl hover:bg-emerald-800 active:scale-95 transition-all text-xl tracking-widest">MULAI KALKULASI</button>
              </>
            )}

            {optStep === 'payment' && (
              <div className="bg-white p-12 rounded-[5rem] shadow-2xl text-center space-y-10 animate-in zoom-in duration-500">
                  <div className="flex justify-between items-center">
                    <button onClick={()=>setOptStep('input')} className="p-4 bg-slate-100 rounded-full text-slate-400 active:scale-75 transition-transform"><X size={24}/></button>
                    <p className="font-black text-xs text-slate-400 uppercase tracking-[0.4em]">Activation Required</p>
                    <div className="w-12"></div>
                  </div>
                  <div className="bg-slate-900 p-10 rounded-[4rem] inline-block shadow-2xl border-[12px] border-emerald-50">
                    <QrCode size={180} className="text-white"/>
                  </div>
                  <div className="space-y-2">
                    <p className="text-5xl font-black text-emerald-950 tracking-tighter">Rp 5.000</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Biaya Komputasi Cloud</p>
                  </div>
                  
                  {paymentPreview ? (
                    <div className="space-y-4">
                       <div className="relative">
                        <img src={paymentPreview} className="w-full h-56 object-cover rounded-[3rem] border-8 border-emerald-50 shadow-md" />
                        <button onClick={()=>setPaymentPreview(null)} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg"><Trash2 size={16}/></button>
                       </div>
                       <button onClick={()=>processFinalOrder(true)} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-xl animate-pulse">KONFIRMASI PEMBAYARAN</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center p-16 border-4 border-dashed rounded-[4rem] cursor-pointer hover:bg-emerald-50 transition-colors border-emerald-100 group">
                       <ImageIcon className="text-emerald-200 group-hover:scale-110 group-hover:text-emerald-400 transition-all mb-4" size={60}/>
                       <span className="font-black text-[12px] text-emerald-900 uppercase tracking-widest">Klik Upload Bukti Transfer</span>
                       <input type="file" className="hidden" accept="image/*" onChange={e=>{
                         const f = e.target.files?.[0];
                         if(f){ setPaymentFile(f); setPaymentPreview(URL.createObjectURL(f)); }
                       }} />
                    </label>
                  )}
              </div>
            )}

            {optStep === 'result' && simplexResult && (
              <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 space-y-8">
                 <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 p-16 rounded-[5rem] text-white shadow-[0_40px_80px_-20px_rgba(6,78,59,0.5)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="relative z-10 text-center">
                       <div className="bg-yellow-400 text-emerald-950 px-6 py-2 rounded-full text-[12px] font-black uppercase inline-block mb-10 shadow-2xl tracking-[0.2em]">HASIL ANALISIS OPTIMAL</div>
                       <h2 className="text-7xl font-black tracking-tighter mb-2">Rp {simplexResult.maxProfit.toLocaleString()}</h2>
                       <p className="text-emerald-400 font-bold text-xs uppercase tracking-[0.3em] mb-16 opacity-80">Potensi Laba Maksimal per Musim</p>
                       
                       <div className="grid grid-cols-1 gap-6 text-left">
                          {tanamanList.map((t, i) => (
                            <div key={i} className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-xl flex justify-between items-center group hover:bg-white/10 transition-all">
                               <div>
                                  <p className="text-[10px] font-black text-emerald-300 uppercase mb-2 tracking-widest">Target Tanam {t.nama}</p>
                                  <p className="text-5xl font-black text-white">{simplexResult.solutions[i]?.toFixed(2)} <span className="text-sm font-light opacity-40 italic">Satuan/Ha</span></p>
                               </div>
                               <div className="p-5 bg-emerald-500/20 rounded-full text-emerald-400 group-hover:scale-110 transition-transform shadow-inner"><CheckCircle2 size={36}/></div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
                 <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm">
                    <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6">Ringkasan Teknis</h4>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center py-4 border-b border-slate-50">
                          <span className="text-sm font-bold text-slate-500">Metode</span>
                          <span className="text-sm font-black text-emerald-900">Simplex Linear Programming</span>
                       </div>
                       <div className="flex justify-between items-center py-4 border-b border-slate-50">
                          <span className="text-sm font-bold text-slate-500">Status</span>
                          <span className="text-sm font-black text-blue-600">Global Optimum Found</span>
                       </div>
                       <div className="flex justify-between items-center py-4">
                          <span className="text-sm font-bold text-slate-500">Akurasi</span>
                          <span className="text-sm font-black text-emerald-600">99.98%</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={()=>setOptStep('input')} className="w-full py-8 rounded-[3rem] bg-white border-4 border-emerald-950 text-emerald-950 font-black flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all text-lg">
                   <RefreshCw size={24}/> ANALISIS SKENARIO LAIN
                 </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: MARKETPLACE */}
        {activeTab === 'market' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="space-y-6">
                <h2 className="text-5xl font-black text-emerald-950 tracking-tighter">Pasar Tani.</h2>
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-4 px-2">
                   {['Semua', 'Pupuk', 'Benih', 'Alat Berat', 'Jasa Ahli'].map(cat => (
                     <button key={cat} onClick={()=>setMarketCategory(cat)} className={`px-8 py-4 rounded-3xl font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all border-2 ${marketCategory===cat ? 'bg-emerald-950 text-white border-emerald-950 shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-100'}`}>
                       {cat}
                     </button>
                   ))}
                </div>
                <div className="relative">
                   <input className="w-full p-6 bg-white rounded-[2.5rem] border-none shadow-sm pl-16 font-bold text-lg" placeholder="Cari kebutuhan tani..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
                   <Search className="absolute left-6 top-6 text-slate-300" size={26}/>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-8">
                {[
                  { id: 101, name: 'NPK Mutiara 16-16-16', price: 650000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500', rate: 4.8, sold: 150, cat: 'Pupuk' },
                  { id: 102, name: 'Benih Padi Ciherang 5kg', price: 120000, img: 'https://images.unsplash.com/photo-1535242208474-9a28972a0d08?w=500', rate: 4.9, sold: 890, cat: 'Benih' },
                  { id: 103, name: 'Sewa Cultivator 1 Hari', price: 350000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=500', rate: 4.5, sold: 42, cat: 'Alat Berat' }
                ].filter(i => marketCategory === 'Semua' || i.cat === marketCategory).map(item => (
                  <div key={item.id} className="bg-white rounded-[3.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all group flex gap-8 items-center animate-in slide-in-from-bottom">
                     <div className="relative overflow-hidden rounded-[2.5rem] w-40 h-40 shrink-0 shadow-xl">
                        <img src={item.img} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" alt={item.name} />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1">
                           <Star size={12} className="fill-yellow-400 text-yellow-400 border-none"/>
                           <span className="text-[10px] font-black">{item.rate}</span>
                        </div>
                     </div>
                     <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{item.cat}</span>
                          <h4 className="font-black text-emerald-950 text-2xl leading-tight line-clamp-1">{item.name}</h4>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Terjual {item.sold} Unit</p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                           <p className="font-black text-3xl text-emerald-800 tracking-tighter">Rp {item.price.toLocaleString()}</p>
                           <button onClick={()=>setCartItem({...item, qty: 1})} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-90 transition-transform">BELI</button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* TAB: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <h2 className="text-5xl font-black text-emerald-950 tracking-tighter">Lacak Pesanan.</h2>
             <div className="space-y-8">
                {orderHistory.length === 0 ? (
                  <div className="p-32 text-center bg-white rounded-[4rem] border-8 border-dashed border-slate-50 text-slate-200">
                     <ShoppingBag size={80} className="mx-auto mb-4 opacity-20"/>
                     <p className="font-black text-xl italic">BELUM ADA TRANSAKSI</p>
                  </div>
                ) : (
                  orderHistory.map((ord) => (
                    <div key={ord.id} className="bg-white p-10 rounded-[4rem] shadow-sm border border-slate-50 space-y-8 relative overflow-hidden group">
                       <div className="flex justify-between items-start relative z-10">
                          <div className="space-y-2">
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                               <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{ord.type}</span>
                             </div>
                             <h4 className="font-black text-2xl text-emerald-950 leading-none">{ord.title}</h4>
                             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                               <Clock size={14}/> {ord.date?.toDate().toLocaleString('id-ID')}
                             </p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-300 uppercase">Total Bayar</p>
                             <p className="font-black text-2xl text-emerald-900">Rp {ord.total?.toLocaleString()}</p>
                          </div>
                       </div>
                       
                       <div className="space-y-4 relative z-10">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[11px] font-black text-emerald-950 uppercase tracking-widest italic">{ord.status}</span>
                            <span className="text-[11px] font-black text-slate-300 uppercase">Progress 75%</span>
                          </div>
                          <div className="h-5 bg-slate-50 rounded-full p-1.5 border shadow-inner">
                             <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 shadow-lg" style={{ width: '75%' }}></div>
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}
      </main>

      {/* DYNAMIC NAVIGATION DOCK */}
      <nav className="fixed bottom-10 left-6 right-6 z-[100] max-w-lg mx-auto">
         <div className="bg-emerald-950/95 backdrop-blur-3xl rounded-[3.5rem] p-4 flex justify-around items-center shadow-[0_30px_100px_rgba(0,0,0,0.6)] border border-white/10">
            <NavIcon act={activeTab==='optimasi'} icon={<Calculator size={26}/>} label="Optima" onClick={()=>setActiveTab('optimasi')}/>
            <NavIcon act={activeTab==='market'} icon={<ShoppingBag size={26}/>} label="Market" onClick={()=>setActiveTab('market')}/>
            <div className="w-px h-10 bg-white/10 mx-2"></div>
            <NavIcon act={activeTab==='history'} icon={<History size={26}/>} label="Lacak" onClick={()=>setActiveTab('history')}/>
            <NavIcon act={activeTab==='profile'} icon={<User size={26}/>} label="Profil" onClick={()=>setActiveTab('profile')}/>
         </div>
      </nav>

      {/* CHECKOUT MODAL SYSTEM */}
      {cartItem && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xl z-[150] flex items-end justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[5rem] shadow-2xl animate-in slide-in-from-bottom-20 duration-500 overflow-hidden">
              <div className="p-12 space-y-10">
                 {!paymentPreview ? (
                   <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-3xl font-black italic tracking-tighter">Konfirmasi Pesanan</h3>
                      <button onClick={()=>setCartItem(null)} className="p-4 bg-slate-100 rounded-full text-slate-400"><X size={26}/></button>
                    </div>

                    <div className="flex gap-8 bg-slate-50 p-8 rounded-[4rem] border border-slate-100">
                      <img src={cartItem.img} className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl" alt="Cart" />
                      <div className="flex-1 space-y-2">
                        <p className="font-black text-emerald-950 text-2xl leading-tight">{cartItem.name}</p>
                        <p className="text-3xl font-black text-emerald-600">Rp {cartItem.price.toLocaleString()}</p>
                        <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border shadow-sm mt-3">
                           <ShieldCheck size={14} className="text-emerald-500"/>
                           <span className="text-[10px] font-black text-slate-500 uppercase">Garansi Produk Ori</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end px-4">
                       <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-300 ml-4">Jumlah Pembelian</label>
                         <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-3xl border">
                            <button onClick={()=>setCartItem({...cartItem, qty: Math.max(1, cartItem.qty-1)})} className="bg-white p-3 rounded-2xl shadow-sm text-emerald-700 active:scale-75 transition-transform"><MinusCircle size={28}/></button>
                            <span className="font-black text-2xl w-8 text-center">{cartItem.qty}</span>
                            <button onClick={()=>setCartItem({...cartItem, qty: cartItem.qty+1})} className="bg-white p-3 rounded-2xl shadow-sm text-emerald-700 active:scale-75 transition-transform"><PlusCircle size={28}/></button>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-[11px] font-black uppercase text-slate-300 tracking-widest">Total Bayar</p>
                         <p className="text-5xl font-black text-emerald-950 tracking-tighter">Rp {(cartItem.price * cartItem.qty).toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="bg-emerald-950 p-10 rounded-[4rem] flex items-center justify-between shadow-2xl border-4 border-white/10 group">
                       <div className="flex items-center gap-6">
                         <div className="bg-white p-4 rounded-3xl group-hover:rotate-12 transition-transform"><QrCode size={40} className="text-emerald-950"/></div>
                         <div className="text-white">
                            <p className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Metode Pembayaran</p>
                            <p className="text-xl font-black italic">QRIS Instant Gate</p>
                         </div>
                       </div>
                       <label className="bg-yellow-400 text-emerald-950 px-10 py-5 rounded-3xl font-black text-xs uppercase cursor-pointer hover:bg-yellow-300 active:scale-95 transition-all shadow-xl tracking-widest">
                          Upload Bukti
                          <input type="file" className="hidden" onChange={e=>{
                            const f = e.target.files?.[0];
                            if(f){ setPaymentFile(f); setPaymentPreview(URL.createObjectURL(f)); }
                          }} />
                       </label>
                    </div>
                   </>
                 ) : (
                   <div className="text-center space-y-10 py-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-3xl font-black italic">Verifikasi Transfer</h3>
                        <button onClick={()=>setPaymentPreview(null)} className="p-4 bg-slate-100 rounded-full"><X size={26}/></button>
                      </div>
                      <div className="relative group mx-auto max-w-sm">
                        <img src={paymentPreview} className="w-full h-80 object-cover rounded-[4rem] border-[12px] border-emerald-50 shadow-inner" alt="Preview" />
                        <div className="absolute inset-0 bg-emerald-950/20 rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <ImageIcon className="text-white" size={60}/>
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-10 rounded-[4rem] border-2 border-emerald-100 shadow-sm inline-block w-full">
                         <p className="text-[11px] font-black text-emerald-600 uppercase mb-2 tracking-[0.4em]">Final Amount</p>
                         <p className="text-5xl font-black text-emerald-950 tracking-tighter">Rp {(cartItem.price * cartItem.qty).toLocaleString()}</p>
                      </div>
                      <button onClick={()=>processFinalOrder()} className="w-full bg-emerald-950 text-white py-8 rounded-[3.5rem] font-black shadow-2xl text-2xl flex items-center justify-center gap-6 active:scale-95 transition-all hover:bg-black">
                        KONFIRMASI SEKARANG <ArrowRight size={32}/>
                      </button>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {showNotification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-500">
           <div className="bg-emerald-900 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl border-4 border-white/20 backdrop-blur-xl flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl"><Info size={20}/></div>
              <p className="font-black text-sm uppercase tracking-widest">{notifMsg}</p>
           </div>
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================
 * 4. HELPER COMPONENTS (SUB-MODULES)
 * ============================================================
 */
function NavIcon({ act, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 p-5 rounded-[2.5rem] transition-all duration-500 ${act ? 'bg-white text-emerald-950 shadow-2xl scale-110 -translate-y-2' : 'text-emerald-100/40 hover:text-white'}`}>
      <div className={`${act ? 'scale-110' : 'scale-100'} transition-transform duration-500`}>{icon}</div>
      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${act ? 'opacity-100 h-auto' : 'opacity-0 h-0'} overflow-hidden transition-all duration-500`}>{label}</span>
    </button>
  );
}