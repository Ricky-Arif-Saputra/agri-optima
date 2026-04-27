import React, { useState } from 'react';
import { SimplexSolver, Matrix } from './lib/simplex';
import { 
  Calculator, Truck, ShoppingBag, Users, Layers, 
  Plus, Trash2, MapPin, CreditCard, ChevronRight, Info
} from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState('optimasi');

  // --- STATE OPTIMASI ---
  const [tanaman, setTanaman] = useState([{ nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([
    { nama: 'Lahan', koefs: [1], target: 10, type: '<=' },
    { nama: 'Pupuk', koefs: [20], target: 100, type: '<=' }
  ]);
  const [hasil, setHasil] = useState<any>(null);

  const runSimplex = () => {
    const N = tanaman.length;
    const M1 = kendala.filter(c => c.type === '<=').length;
    const M2 = kendala.filter(c => c.type === '>=').length;
    const M3 = kendala.filter(c => c.type === '=').length;
    const M = M1 + M2 + M3;

    // Inisialisasi Matrix A (M+2 x N+1)
    const A: Matrix = Array.from({ length: M + 3 }, () => new Array(N + 2).fill(0));

    // Isi Fungsi Tujuan (Baris 1)
    tanaman.forEach((t, j) => A[1][j + 2] = t.profit);
    A[1][1] = 0; // Constant Z

    // Isi Kendala (Mulai baris 2)
    kendala.forEach((c, i) => {
      A[i + 2][1] = c.target;
      tanaman.forEach((_, j) => {
        A[i + 2][j + 2] = -c.koefs[j]; // Simplex NR format: -koefisien
      });
    });

    const res = SimplexSolver.solve(N, M1, M2, M3, A);
    setHasil(res);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFB]">
      {/* Sidebar */}
      <nav className="w-20 lg:w-64 bg-[#064E3B] text-white flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="bg-yellow-400 p-2 rounded-xl text-emerald-900"><Layers size={24}/></div>
          <span className="hidden lg:block font-black text-xl tracking-tighter">AGRI OPTIMA</span>
        </div>
        <div className="space-y-2">
          <SideItem icon={<Calculator/>} label="Optimasi Laba" active={tab === 'optimasi'} onClick={() => setTab('optimasi')}/>
          <SideItem icon={<Truck/>} label="Uber Tani" active={tab === 'uber'} onClick={() => setTab('uber')}/>
          <SideItem icon={<ShoppingBag/>} label="Hilirisasi" active={tab === 'hilirisasi'} onClick={() => setTab('hilirisasi')}/>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        
        {/* OPTIMASI LABA */}
        {tab === 'optimasi' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-emerald-900">Linear Programming Solver</h1>
                <p className="text-slate-500 font-medium">Algoritma Simplex 2-Phase (Numerical Recipes Port)</p>
              </div>
              <button onClick={runSimplex} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition">HITUNG OPTIMASI</button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Variables */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-emerald-800 flex items-center gap-2"><Plus size={18}/> Variabel Keputusan</h3>
                  <button onClick={() => {
                    setTanaman([...tanaman, { nama: 'Baru', profit: 0 }]);
                    setKendala(kendala.map(k => ({ ...k, koefs: [...k.koefs, 0] })));
                  }} className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold">+ Tanaman</button>
                </div>
                <div className="space-y-3">
                  {tanaman.map((t, i) => (
                    <div key={i} className="flex gap-3 items-center bg-slate-50 p-3 rounded-2xl">
                      <input className="flex-1 bg-transparent font-bold" value={t.nama} onChange={e => {
                        const n = [...tanaman]; n[i].nama = e.target.value; setTanaman(n);
                      }}/>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">PROFIT</span>
                        <input type="number" className="w-28 bg-white p-2 rounded-xl text-sm font-black text-emerald-600 shadow-sm" value={t.profit} onChange={e => {
                          const n = [...tanaman]; n[i].profit = Number(e.target.value); setTanaman(n);
                        }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Constraints */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                 <h3 className="font-bold text-emerald-800 mb-6 flex items-center gap-2"><Info size={18}/> Batasan Kendala</h3>
                 <div className="space-y-4">
                    {kendala.map((c, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl">
                        <div className="flex justify-between mb-3">
                          <input className="bg-transparent font-bold text-sm" value={c.nama} onChange={e => {
                            const n = [...kendala]; n[i].nama = e.target.value; setKendala(n);
                          }}/>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-600">{c.type}</span>
                            <input type="number" className="w-20 bg-white p-1 rounded-lg text-right font-bold" value={c.target} onChange={e => {
                              const n = [...kendala]; n[i].target = Number(e.target.value); setKendala(n);
                            }}/>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tanaman.map((t, ti) => (
                            <div key={ti} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-400 uppercase">{t.nama}</span>
                              <input type="number" className="w-10 text-xs font-bold text-center" value={c.koefs[ti]} onChange={e => {
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

            {/* Hasil Optimasi */}
            {hasil && (
              <div className="bg-[#064E3B] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center">
                  <div>
                    <p className="text-emerald-300 font-bold uppercase tracking-widest text-xs mb-2">Total Keuntungan Maksimal</p>
                    <h2 className="text-5xl font-black text-yellow-400">Rp {hasil.maxValue.toLocaleString('id-ID')}</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-8 lg:mt-0">
                    {tanaman.map((t, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-lg p-4 rounded-3xl border border-white/10">
                        <p className="text-[10px] text-emerald-200 font-bold uppercase">{t.nama}</p>
                        <p className="text-2xl font-black">{hasil.solutions[i]?.toFixed(2)} <span className="text-xs font-normal">Unit</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* UBER TANI PRO */}
        {tab === 'uber' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <header>
              <h1 className="text-3xl font-black text-emerald-900">Uber Tani Pro</h1>
              <p className="text-slate-500 font-medium">Sistem Pemesanan Kolektif & Jasa Alsintan</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <UberProduct 
                image="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=400"
                title="Traktor Bajak Sawah"
                price="1.500.000"
                desc="Layanan bajak sawah menggunakan traktor roda 4 dengan operator profesional."
              />
              <UberProduct 
                image="https://images.unsplash.com/photo-1622383529957-35b55e517220?auto=format&fit=crop&q=80&w=400"
                title="Drone Pestisida"
                price="350.000"
                desc="Penyemprotan lahan otomatis menggunakan drone DJI Agras. Akurasi 99%."
              />
              <UberProduct 
                image="https://images.unsplash.com/photo-1595841055310-4487eb753733?auto=format&fit=crop&q=80&w=400"
                title="Sewa Combine Harvester"
                price="4.200.000"
                desc="Mesin panen padi modern untuk hasil panen yang lebih bersih dan cepat."
              />
            </div>
          </div>
        )}

        {/* HILIRISASI */}
        {tab === 'hilirisasi' && (
          <div className="max-w-6xl mx-auto">
             <div className="flex justify-between items-center mb-10">
               <h1 className="text-3xl font-black text-emerald-900">Marketplace Hilir</h1>
               <div className="flex gap-2">
                 <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold text-xs">Padi</span>
                 <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold text-xs">Jagung</span>
                 <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold text-xs">Olahan</span>
               </div>
             </div>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
               <MarketItem name="Beras Pandan Wangi" price="75.000" stock="45" weight="5kg"/>
               <MarketItem name="Tepung Beras Organik" price="18.000" stock="120" weight="1kg"/>
               <MarketItem name="Minyak Bekatul" price="45.000" stock="30" weight="500ml"/>
               <MarketItem name="Dedak Pakan Ternak" price="4.000" stock="500" weight="1kg"/>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function UberProduct({ image, title, price, desc }: any) {
  const [mode, setMode] = useState<'direct' | 'ub'>('direct');
  const [total, setTotal] = useState(1);
  const ubProgress = 32; // Mockup progres UB (32 dari 50 orang)

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 group">
      <div className="h-48 overflow-hidden relative">
        <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={title}/>
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-700">Verified Service</div>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">{title}</h3>
          <p className="text-emerald-600 font-black">Rp {price} <span className="text-slate-400 font-medium text-xs">/ Sesi</span></p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
        
        <div className="bg-slate-50 p-4 rounded-3xl space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setMode('direct')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition ${mode === 'direct' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-400 border border-slate-100'}`}>LANGSUNG</button>
            <button onClick={() => setMode('ub')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition ${mode === 'ub' ? 'bg-yellow-400 text-emerald-900 shadow-lg shadow-yellow-100' : 'bg-white text-slate-400 border border-slate-100'}`}>GABUNG (UB)</button>
          </div>

          {mode === 'ub' && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-emerald-700">Pendaftar: {ubProgress}/50</span>
                <span>{((ubProgress/50)*100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all" style={{width: `${(ubProgress/50)*100}%`}}></div>
              </div>
              <p className="text-[9px] text-slate-400 italic text-center">Menunggu 18 orang lagi untuk aktif</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400">JUMLAH PESAN</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setTotal(Math.max(1, total - 1))} className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold shadow-sm">-</button>
              <span className="font-bold">{total}</span>
              <button onClick={() => setTotal(total + 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold shadow-sm">+</button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
           <div className="flex items-center gap-2 text-slate-400">
             <MapPin size={14}/>
             <span className="text-[10px] font-bold">Ds. Sukomoro, Nganjuk</span>
           </div>
           <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-black transition shadow-xl">
             <CreditCard size={18}/> BAYAR SEKARANG
           </button>
        </div>
      </div>
    </div>
  );
}

function MarketItem({ name, price, stock, weight }: any) {
  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:border-emerald-200 transition">
      <div className="h-32 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-slate-200"><ShoppingBag size={48}/></div>
      <h4 className="font-bold text-sm text-slate-700 mb-1">{name}</h4>
      <p className="text-emerald-600 font-black text-lg mb-2">Rp {price}</p>
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-4">
        <span>Stok: {stock}</span>
        <span>{weight}</span>
      </div>
      <button className="w-full bg-emerald-50 text-emerald-700 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition">Tambah</button>
    </div>
  );
}

function SideItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition ${active ? 'bg-white/10 text-yellow-400 shadow-inner' : 'text-emerald-100/60 hover:bg-white/5'}`}>
      {icon} <span className="hidden lg:block text-sm font-bold">{label}</span>
    </button>
  );
}