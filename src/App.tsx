import React, { useState, useEffect } from 'react';
import { SimplexSolver, Matrix } from './lib/simplex';
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, MapPin, 
  CreditCard, Info, Layers, CheckCircle2, TrendingUp, 
  Package, Box, QrCode, ArrowRight, TruckIcon, UserCheck
} from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState('optimasi');
  const [activeStep, setActiveStep] = useState<'input' | 'payment' | 'result'>('input');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [orderProgress, setOrderProgress] = useState(0);

  // --- STATE OPTIMASI ---
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Lahan', koefs: [1], target: 10, type: '<=' }]);
  const [hasil, setHasil] = useState<any>(null);

  // --- DATA MOCKUP ---
  const dataUber = [
    { id: 1, cat: 'Bahan', name: 'Pupuk Hayati', price: 250000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400' },
    { id: 2, cat: 'Alat', name: 'Traktor Mini', price: 850000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400' },
    { id: 3, cat: 'Jasa', name: 'Buruh Tanam', price: 150000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400' }
  ];

  const dataHilir = [
    { id: 4, name: 'Beras Mentik Wangi 10kg', price: 165000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { id: 5, name: 'Kripik Pisang Oven', price: 25000, img: 'https://images.unsplash.com/photo-1613554830385-a7c360170c72?w=400' }
  ];

  // --- LOGIC FUNCTIONS ---
  const handleRunOptimasi = () => setActiveStep('payment');
  
  const confirmPaymentOptimasi = () => {
    setActiveStep('result');
    const N = tanaman.length;
    const M1 = kendala.filter(c => c.type === '<=').length;
    const M2 = kendala.filter(c => c.type === '>=').length;
    const M3 = kendala.filter(c => c.type === '=').length;
    const sortedK = [...kendala.filter(c => c.type === '<='), ...kendala.filter(c => c.type === '>='), ...kendala.filter(c => c.type === '=')];
    const A: Matrix = Array.from({ length: sortedK.length + 3 }, () => new Array(N + 2).fill(0));
    tanaman.forEach((t, j) => A[1][j + 2] = t.profit);
    sortedK.forEach((c, i) => {
      A[i + 2][1] = c.target;
      c.koefs.forEach((val, j) => { A[i + 2][j + 2] = -val; });
    });
    setHasil(SimplexSolver.solve(N, M1, M2, M3, A));
  };

  const startCheckout = (item: any) => setCheckoutItem({ ...item, address: '', delivery: 'antar' });

  const processOrder = () => {
    setOrderProgress(10);
    const interval = setInterval(() => {
      setOrderProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 30;
      });
    }, 1000);
  };

  return (
    <div className="flex min-h-screen bg-[#F0F5F2] text-slate-900 font-sans">
      {/* Sidebar - Proportional */}
      <aside className="w-20 lg:w-64 bg-[#052E16] text-white fixed h-full flex flex-col p-6 shadow-2xl z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-yellow-400 p-2 rounded-xl text-green-950 shadow-lg"><Layers size={22}/></div>
          <span className="hidden lg:block font-black text-xl tracking-tighter">UBER TANI</span>
        </div>
        <nav className="space-y-2">
          <NavItem active={tab === 'optimasi'} icon={<Calculator/>} label="Optimasi Laba" onClick={() => {setTab('optimasi'); setActiveStep('input');}}/>
          <NavItem active={tab === 'uber'} icon={<Truck/>} label="Layanan Uber" onClick={() => setTab('uber')}/>
          <NavItem active={tab === 'hilir'} icon={<ShoppingBag/>} label="Marketplace" onClick={() => setTab('hilir')}/>
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-12">
        
        {/* SECTION: OPTIMASI LABA */}
        {tab === 'optimasi' && (
          <div className="max-w-4xl mx-auto">
            {activeStep === 'input' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <header className="flex justify-between items-center">
                  <h1 className="text-3xl font-black text-green-950">Optimasi Laba</h1>
                  <button onClick={handleRunOptimasi} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-green-700 transition">CEK HASIL (Rp 5rb)</button>
                </header>

                <div className="grid gap-6">
                  {/* Variabel Tanaman */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-green-100">
                    <div className="flex justify-between mb-6">
                      <h3 className="font-black uppercase text-xs tracking-widest text-green-700">Variabel Keputusan</h3>
                      <button onClick={() => setTanaman([...tanaman, { id: Date.now(), nama: 'Tanaman', profit: 0 }])} className="text-green-600 font-bold text-xs">+ Tambah</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tanaman.map((t, i) => (
                        <div key={t.id} className="flex gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 items-center">
                          <input className="flex-1 bg-transparent font-bold text-sm outline-none" value={t.nama} onChange={e => {
                            const n = [...tanaman]; n[i].nama = e.target.value; setTanaman(n);
                          }}/>
                          <input type="number" className="w-20 bg-white p-1 rounded font-black text-xs text-green-600 outline-none" value={t.profit} onChange={e => {
                            const n = [...tanaman]; n[i].profit = Number(e.target.value); setTanaman(n);
                          }}/>
                          <button onClick={() => setTanaman(tanaman.filter(x => x.id !== t.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fungsi Kendala */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-green-100">
                    <div className="flex justify-between mb-6">
                      <h3 className="font-black uppercase text-xs tracking-widest text-green-700">Batasan Kendala</h3>
                      <button onClick={() => setKendala([...kendala, { id: Date.now(), nama: 'Kendala', koefs: Array(tanaman.length).fill(0), target: 0, type: '<=' }])} className="text-green-600 font-bold text-xs">+ Tambah Kendala</button>
                    </div>
                    <div className="space-y-4">
                      {kendala.map((k, i) => (
                        <div key={k.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between mb-4">
                            <input className="font-black text-green-900 bg-transparent outline-none uppercase text-xs" value={k.nama} onChange={e => {
                              const n = [...kendala]; n[i].nama = e.target.value; setKendala(n);
                            }}/>
                            <div className="flex items-center gap-2">
                              <select className="bg-white px-2 py-1 rounded-lg text-xs font-bold outline-none" value={k.type} onChange={e => {
                                const n = [...kendala]; n[i].type = e.target.value; setKendala(n);
                              }}>
                                <option value="<=">≤</option>
                                <option value=">=">≥</option>
                                <option value="=">=</option>
                              </select>
                              <input type="number" className="w-16 bg-white p-1 rounded font-black text-xs text-center" value={k.target} onChange={e => {
                                const n = [...kendala]; n[i].target = Number(e.target.value); setKendala(n);
                              }}/>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tanaman.map((t, ti) => (
                              <div key={ti} className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{t.nama}</span>
                                <input type="number" className="w-8 text-center text-xs font-black text-green-600" value={k.koefs[ti]} onChange={e => {
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
              <div className="max-w-md mx-auto text-center space-y-8 py-10 animate-in zoom-in-95">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-green-50">
                  <h2 className="text-2xl font-black text-green-950 mb-2">QRIS Pembayaran</h2>
                  <p className="text-slate-400 text-sm mb-8">Scan untuk melihat hasil optimasi</p>
                  <div className="bg-slate-50 p-6 rounded-3xl inline-block border-2 border-slate-100 mb-8">
                    <QrCode size={200} className="text-green-900 mx-auto"/>
                  </div>
                  <div className="bg-green-50 p-4 rounded-2xl mb-8">
                    <p className="text-xs font-bold text-green-700">TOTAL TAGIHAN</p>
                    <p className="text-2xl font-black text-green-900">Rp 5.000</p>
                  </div>
                  <button onClick={confirmPaymentOptimasi} className="w-full bg-green-900 text-white py-5 rounded-2xl font-black hover:bg-black transition shadow-xl">KONFIRMASI PEMBAYARAN</button>
                </div>
              </div>
            )}

            {activeStep === 'result' && hasil && (
              <div className="space-y-8 animate-in slide-in-from-top-4">
                <div className="bg-[#052E16] p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-yellow-400 font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><CheckCircle2 size={16}/> Hasil Optimal Ditemukan</h2>
                    <div className="grid md:grid-cols-2 gap-10">
                      <div>
                        <p className="text-6xl font-black tracking-tighter">Rp {hasil.maxValue.toLocaleString()}</p>
                        <p className="text-green-300 font-medium mt-2 uppercase text-[10px] tracking-widest">Estimasi Laba Maksimum</p>
                      </div>
                      <div className="space-y-3">
                        {tanaman.map((t, i) => (
                          <div key={i} className="flex justify-between bg-white/10 p-4 rounded-2xl border border-white/5">
                            <span className="font-bold">{t.nama}</span>
                            <span className="font-black text-yellow-400 text-xl">{hasil.solutions[i]?.toFixed(2)} Unit</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveStep('input')} className="text-green-700 font-bold flex items-center gap-2"><ArrowRight className="rotate-180"/> Kembali Edit Data</button>
              </div>
            )}
          </div>
        )}

        {/* SECTION: UBER TANI & HILIRISASI */}
        {(tab === 'uber' || tab === 'hilir') && (
          <div className="max-w-6xl mx-auto space-y-10">
            <header>
              <h1 className="text-4xl font-black text-green-950 uppercase tracking-tight">{tab === 'uber' ? 'Uber Tani' : 'Marketplace'}</h1>
              <p className="text-slate-500 font-medium">Layanan dan produk hilirisasi pertanian terbaik.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(tab === 'uber' ? dataUber : dataHilir).map(item => (
                <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                  <img src={item.img} className="h-48 w-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="p-6 space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md uppercase">{(item as any).cat || 'Produk'}</span>
                      <h3 className="text-xl font-black text-green-950 mt-2">{item.name}</h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-black text-green-900">Rp {item.price.toLocaleString()}</span>
                      <button onClick={() => startCheckout(item)} className="bg-green-600 text-white px-5 py-2 rounded-xl font-black text-xs shadow-md">BELI SEKARANG</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* CHECKOUT & TRACKING MODAL */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-green-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
            {orderProgress === 0 ? (
              <div className="p-10 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-green-950 uppercase">Formulir Pesanan</h3>
                  <button onClick={() => setCheckoutItem(null)} className="text-slate-300 hover:text-red-500"><X size={24}/></button>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-3xl flex gap-6 items-center border border-slate-100">
                  <img src={checkoutItem.img} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                  <div>
                    <p className="font-black text-green-950">{checkoutItem.name}</p>
                    <p className="text-lg font-black text-green-600">Rp {checkoutItem.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Alamat Pengiriman Lengkap</label>
                    <textarea 
                      className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-green-600 transition" 
                      rows={3} 
                      placeholder="Contoh: Jl. Sawah Besar No. 4, Nganjuk"
                      value={checkoutItem.address}
                      onChange={e => setCheckoutItem({...checkoutItem, address: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setCheckoutItem({...checkoutItem, delivery: 'antar'})}
                      className={`py-4 rounded-2xl font-black text-xs flex flex-col items-center gap-2 border-2 transition ${checkoutItem.delivery === 'antar' ? 'border-green-600 bg-green-50 text-green-950' : 'border-slate-100 text-slate-400'}`}
                    >
                      <TruckIcon size={20}/> ANTAR KE RUMAH
                    </button>
                    <button 
                      onClick={() => setCheckoutItem({...checkoutItem, delivery: 'jemput'})}
                      className={`py-4 rounded-2xl font-black text-xs flex flex-col items-center gap-2 border-2 transition ${checkoutItem.delivery === 'jemput' ? 'border-green-600 bg-green-50 text-green-950' : 'border-slate-100 text-slate-400'}`}
                    >
                      <Box size={20}/> JEMPUT SENDIRI
                    </button>
                  </div>
                </div>

                <div className="bg-green-900 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl">
                  <div>
                    <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Total Bayar</p>
                    <p className="text-2xl font-black">Rp {(checkoutItem.price + (checkoutItem.delivery === 'antar' ? 15000 : 0)).toLocaleString()}</p>
                  </div>
                  <button onClick={processOrder} className="bg-yellow-400 text-green-950 px-8 py-3 rounded-xl font-black hover:scale-105 transition active:scale-95">BAYAR SEKARANG</button>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center space-y-8 animate-in fade-in">
                <div className="relative w-32 h-32 mx-auto">
                   <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center text-green-600 font-black text-xl">{orderProgress}%</div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-black text-green-950 uppercase tracking-tight">
                    {orderProgress < 100 ? 'Sedang Memproses Pesanan...' : 'Pesanan Berhasil!'}
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">
                    {orderProgress < 100 
                      ? 'Harap tunggu, kami sedang memvalidasi pembayaran Anda.' 
                      : `Kurir kami sedang menyiapkan ${checkoutItem.name} untuk dikirim.`}
                  </p>
                </div>

                {orderProgress === 100 && (
                  <button onClick={() => setCheckoutItem(null)} className="bg-green-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl">KEMBALI KE BERANDA</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- HELPERS ---
function NavItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${active ? 'bg-white/10 text-yellow-400 shadow-inner' : 'text-green-100/60 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="hidden lg:block text-sm uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function X({size}: {size:number}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>; }