import React, { useState, useEffect } from 'react';
import { SimplexSolver, Matrix } from './lib/simplex';
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, 
  MapPin, CreditCard, Info, Layers, CheckCircle2, 
  TrendingUp, Package, Tool, Users, Search, ShoppingCart, X
} from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState('optimasi');
  const [isPaid, setIsPaid] = useState(false); // State untuk Paywall Optimasi
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  // --- STATE OPTIMASI ---
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([{ id: 1, nama: 'Lahan', koefs: [1], target: 10, type: '<=' }]);
  const [hasil, setHasil] = useState<any>(null);

  // --- DATA MOCKUP ---
  const dataUber = {
    bahan: [
      { id: 101, name: 'Bibit Padi Unggul', price: 150000, desc: 'Varietas Inpari 32, tahan wereng.', img: 'https://images.unsplash.com/photo-1536633396167-31362e76f928?w=400' },
      { id: 102, name: 'Pupuk NPK Pro', price: 450000, desc: 'Pupuk kimia seimbang untuk pertumbuhan.', img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400' }
    ],
    alat: [
      { id: 201, name: 'Traktor Quick G1000', price: 1200000, desc: 'Sewa harian traktor bajak sawah.', img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400' }
    ],
    jasa: [
      { id: 301, name: 'Drone Spraying', price: 350000, desc: 'Penyemprotan pestisida per hektar.', img: 'https://images.unsplash.com/photo-1622383529957-35b55e517220?w=400' }
    ]
  };

  const dataHilir = [
    { id: 501, name: 'Beras Premium 5kg', price: 75000, desc: 'Beras organik poles.', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { id: 502, name: 'Minyak Goreng Sawit', price: 18000, desc: 'Minyak bening kualitas super.', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' }
  ];

  // --- LOGIC FUNCTIONS ---
  const handleOptimasiClick = () => {
    if (!isPaid) {
      setShowPaymentModal(true);
    } else {
      runOptimasi();
    }
  };

  const runOptimasi = () => {
    const N = tanaman.length;
    const M1 = kendala.filter(c => c.type === '<=').length;
    const M2 = kendala.filter(c => c.type === '>=').length;
    const M3 = kendala.filter(c => c.type === '=').length;
    const sortedKendala = [...kendala.filter(c => c.type === '<='), ...kendala.filter(c => c.type === '>='), ...kendala.filter(c => c.type === '=')];
    const A: Matrix = Array.from({ length: sortedKendala.length + 3 }, () => new Array(N + 2).fill(0));
    tanaman.forEach((t, j) => A[1][j + 2] = t.profit);
    sortedKendala.forEach((c, i) => {
      A[i + 2][1] = c.target;
      c.koefs.forEach((val, j) => { A[i + 2][j + 2] = -val; });
    });
    const res = SimplexSolver.solve(N, M1, M2, M3, A);
    setHasil(res);
  };

  const simulatePayment = () => {
    alert("Memproses Pembayaran Rp 5.000...");
    setTimeout(() => {
      setIsPaid(true);
      setShowPaymentModal(false);
      alert("Pembayaran Berhasil! Sekarang Anda bisa melihat hasil optimasi.");
    }, 1500);
  };

  const addToCart = (item: any) => {
    setCart([...cart, { ...item, cartId: Date.now() }]);
    alert(`${item.name} dimasukkan ke keranjang!`);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FBF9] text-slate-900 font-sans">
      {/* Sidebar - Fixed Proportion */}
      <aside className="w-20 lg:w-64 bg-[#064E3B] text-white p-6 flex flex-col fixed h-full shadow-2xl">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-yellow-400 p-2 rounded-xl text-emerald-900"><Layers size={24}/></div>
          <span className="hidden lg:block font-black text-xl tracking-tighter">AGRI-PRO</span>
        </div>
        <nav className="space-y-2 flex-1">
          <SideItem active={tab === 'optimasi'} icon={<Calculator/>} label="Optimasi Laba" onClick={() => setTab('optimasi')}/>
          <SideItem active={tab === 'uber'} icon={<Truck/>} label="Uber Tani" onClick={() => setTab('uber')}/>
          <SideItem active={tab === 'hilir'} icon={<ShoppingBag/>} label="Hilirisasi" onClick={() => setTab('hilir')}/>
        </nav>
        {cart.length > 0 && (
          <div className="bg-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-emerald-300">KERANJANG</p>
            <p className="text-xl font-black">{cart.length} <span className="text-xs font-normal">Item</span></p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10">
        
        {/* TAB OPTIMASI */}
        {tab === 'optimasi' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-emerald-950 tracking-tight">Optimasi Laba</h1>
                <p className="text-slate-500 font-medium">Hitung probabilitas keuntungan maksimal usaha tani Anda.</p>
              </div>
              <button 
                onClick={handleOptimasiClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95"
              >
                {isPaid ? "HITUNG HASIL" : "BUKA OPTIMASI (Rp 5.000)"}
              </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Variables */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-emerald-800 uppercase tracking-widest text-xs">Variabel Komoditas</h3>
                  <button onClick={() => setTanaman([...tanaman, { id: Date.now(), nama: 'Tanaman Baru', profit: 0 }])} className="text-emerald-600 bg-emerald-50 p-2 rounded-full"><Plus size={18}/></button>
                </div>
                <div className="space-y-3">
                  {tanaman.map((t, i) => (
                    <div key={t.id} className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <input className="flex-1 bg-transparent font-bold outline-none" value={t.nama} onChange={e => {
                        const n = [...tanaman]; n[i].nama = e.target.value; setTanaman(n);
                      }}/>
                      <input type="number" className="w-24 bg-white p-2 rounded-xl text-xs font-black shadow-sm" value={t.profit} onChange={e => {
                        const n = [...tanaman]; n[i].profit = Number(e.target.value); setTanaman(n);
                      }}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Constraints */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="font-black text-emerald-800 uppercase tracking-widest text-xs mb-6">Batasan Kendala</h3>
                <div className="space-y-6">
                  {kendala.map((k, i) => (
                    <div key={k.id} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <input className="font-bold text-sm bg-transparent outline-none" value={k.nama} onChange={e => {
                          const n = [...kendala]; n[i].nama = e.target.value; setKendala(n);
                        }}/>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg">{k.type}</span>
                          <input type="number" className="w-16 p-1 border-b-2 border-emerald-100 font-black text-center outline-none" value={k.target} onChange={e => {
                            const n = [...kendala]; n[i].target = Number(e.target.value); setKendala(n);
                          }}/>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tanaman.map((t, ti) => (
                          <div key={ti} className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                            <span className="text-[9px] font-bold text-slate-400">{t.nama}</span>
                            <input type="number" className="w-8 text-center text-[10px] font-black bg-transparent" value={k.koefs[ti]} onChange={e => {
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

            {hasil && isPaid && (
              <div className="bg-[#064E3B] p-10 rounded-[3rem] text-white shadow-2xl animate-in zoom-in-95 duration-500">
                <h2 className="text-yellow-400 font-black text-xs uppercase tracking-[0.4em] mb-6">Hasil Rekomendasi Tanam</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div>
                    <p className="text-6xl font-black">Rp {hasil.maxValue.toLocaleString()}</p>
                    <p className="text-emerald-300 font-medium mt-2">Potensi Laba Maksimal dari sumber daya yang ada.</p>
                  </div>
                  <div className="space-y-3">
                    {tanaman.map((t, i) => (
                      <div key={i} className="flex justify-between bg-white/10 p-4 rounded-2xl border border-white/10">
                        <span className="font-bold">{t.nama}</span>
                        <span className="font-black text-yellow-400 text-xl">{hasil.solutions[i]?.toFixed(2)} Unit</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB UBER TANI */}
        {tab === 'uber' && (
          <div className="max-w-6xl mx-auto space-y-12">
            <header>
              <h1 className="text-4xl font-black text-emerald-950">Uber Tani Pro</h1>
              <p className="text-slate-500 font-medium">Beli Bahan, Sewa Alat, dan Manajemen Jasa dalam satu genggaman.</p>
            </header>

            <section className="space-y-6">
              <SectionHeader icon={<Package/>} title="Pembelian Bahan Tani"/>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataUber.bahan.map(item => <ProductCard key={item.id} item={item} onBuy={() => addToCart(item)} />)}
              </div>
            </section>

            <section className="space-y-6">
              <SectionHeader icon={<TrendingUp/>} title="Sewa Alat Modern"/>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataUber.alat.map(item => <ProductCard key={item.id} item={item} onBuy={() => addToCart(item)} />)}
              </div>
            </section>

            <section className="space-y-6">
              <SectionHeader icon={<Users/>} title="Manajemen Jasa & Tenaga"/>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataUber.jasa.map(item => <ProductCard key={item.id} item={item} onBuy={() => addToCart(item)} />)}
              </div>
            </section>
          </div>
        )}

        {/* TAB HILIRISASI */}
        {tab === 'hilir' && (
          <div className="max-w-6xl mx-auto space-y-12">
            <header>
              <h1 className="text-4xl font-black text-emerald-950">Pasar Hilirisasi</h1>
              <p className="text-slate-500 font-medium">Produk olahan tani terbaik langsung dari produsen.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dataHilir.map(item => (
                <div key={item.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 p-4 space-y-4">
                  <img src={item.img} className="h-40 w-full object-cover rounded-[1.5rem]" />
                  <div>
                    <h4 className="font-black text-emerald-900">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-emerald-600">Rp {item.price.toLocaleString()}</span>
                    <button onClick={() => addToCart(item)} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg"><ShoppingCart size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* PAYMENT MODAL (Optimasi Paywall) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border-4 border-emerald-100">
              <CreditCard size={32}/>
            </div>
            <div>
              <h3 className="text-2xl font-black text-emerald-950">Layanan Berbayar</h3>
              <p className="text-slate-500 text-sm mt-2 font-medium px-4">Anda perlu melakukan pembayaran sebesar <span className="text-emerald-600 font-black">Rp 5.000</span> untuk membuka fitur perhitungan optimasi laba.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 border border-slate-100">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-400 uppercase">Item</span>
                <span>Optimasi Laba Pro</span>
              </div>
              <div className="flex justify-between items-center text-lg font-black border-t pt-4">
                <span className="text-slate-400 font-bold uppercase text-xs">Total</span>
                <span className="text-emerald-700">Rp 5.000</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={simulatePayment} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95 transition">
                BAYAR SEKARANG <ChevronRight size={18}/>
              </button>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-red-500 transition">Batalkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SideItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-white/10 text-yellow-400 shadow-inner' : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="hidden lg:block text-sm font-black tracking-tight">{label}</span>
    </button>
  );
}

function SectionHeader({ icon, title }: any) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">{icon}</div>
      <h2 className="text-xl font-black text-emerald-900 uppercase tracking-tight">{title}</h2>
    </div>
  );
}

function ProductCard({ item, onBuy }: any) {
  const [mode, setMode] = useState<'langsung' | 'gabung'>('langsung');

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all group flex flex-col h-full">
      <div className="h-48 overflow-hidden relative">
        <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-700">Verified</div>
      </div>
      <div className="p-6 space-y-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-lg font-black text-emerald-950 leading-tight">{item.name}</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-1">{item.desc}</p>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="font-black text-emerald-600 text-xl tracking-tight">Rp {item.price.toLocaleString()}</span>
        </div>

        <div className="bg-slate-50 p-1 rounded-xl flex">
          <button onClick={() => setMode('langsung')} className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-widest ${mode === 'langsung' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>LANGSUNG</button>
          <button onClick={() => setMode('gabung')} className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-widest ${mode === 'gabung' ? 'bg-yellow-400 text-emerald-900 shadow-md' : 'text-slate-400'}`}>GABUNG (UB)</button>
        </div>

        <button onClick={onBuy} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-black transition">
          <CreditCard size={14}/> BELI SEKARANG
        </button>
      </div>
    </div>
  );
}