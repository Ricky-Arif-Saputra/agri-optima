import React, { useState, useEffect } from 'react';
import { SimplexSolver, Matrix } from './lib/simplex';
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, 
  ChevronRight, Info, Layers, CheckCircle2, TrendingUp 
} from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState('optimasi');

  // --- STATE DINAMIS ---
  // Variabel Keputusan (Tanaman & Harga/Profit)
  const [tanaman, setTanaman] = useState([
    { id: Date.now(), nama: 'Padi', profit: 15000000 }
  ]);

  // Batasan Kendala
  const [kendala, setKendala] = useState([
    { id: Date.now() + 1, nama: 'Luas Lahan', koefs: [1], target: 10, type: '<=' }
  ]);

  const [hasil, setHasil] = useState<any>(null);

  // Sync jumlah koefisien di kendala saat jumlah tanaman berubah
  useEffect(() => {
    setKendala(prev => prev.map(k => {
      const newKoefs = [...k.koefs];
      if (newKoefs.length < tanaman.length) {
        // Tambah koefisien 0 jika tanaman bertambah
        return { ...k, koefs: [...newKoefs, ...new Array(tanaman.length - newKoefs.length).fill(0)] };
      }
      return k;
    }));
  }, [tanaman.length]);

  const runOptimasi = () => {
    const N = tanaman.length;
    const M1 = kendala.filter(c => c.type === '<=').length;
    const M2 = kendala.filter(c => c.type === '>=').length;
    const M3 = kendala.filter(c => c.type === '=').length;
    
    // Urutkan kendala sesuai urutan simplex (<= dulu, lalu >=, lalu =)
    const sortedKendala = [
      ...kendala.filter(c => c.type === '<='),
      ...kendala.filter(c => c.type === '>='),
      ...kendala.filter(c => c.type === '=')
    ];

    const A: Matrix = Array.from({ length: sortedKendala.length + 3 }, () => new Array(N + 2).fill(0));
    
    // Baris 1: Fungsi Tujuan (Profit)
    tanaman.forEach((t, j) => A[1][j + 2] = t.profit);
    A[1][1] = 0; 

    // Baris 2 dst: Batasan Kendala
    sortedKendala.forEach((c, i) => {
      A[i + 2][1] = c.target;
      c.koefs.forEach((val, j) => {
        A[i + 2][j + 2] = -val; // Format Simplex NR: -koefisien
      });
    });

    const res = SimplexSolver.solve(N, M1, M2, M3, A);
    setHasil(res);
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7F6] text-slate-800">
      {/* Sidebar Nav */}
      <aside className="w-20 lg:w-72 bg-[#064E3B] text-white p-6 flex flex-col shadow-xl">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="bg-yellow-400 p-2 rounded-2xl text-emerald-900 shadow-lg shadow-yellow-400/20"><Layers size={28}/></div>
          <h1 className="hidden lg:block font-black text-2xl tracking-tighter uppercase">AgriOptima</h1>
        </div>
        <nav className="space-y-3 flex-1">
          <MenuBtn active={tab === 'optimasi'} icon={<Calculator/>} label="Optimasi Laba" onClick={() => setTab('optimasi')}/>
          <MenuBtn active={tab === 'uber'} icon={<Truck/>} label="Uber Tani Pro" onClick={() => setTab('uber')}/>
        </nav>
      </aside>

      <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
        {tab === 'optimasi' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-4xl font-black text-emerald-950">Linear Programming</h2>
                <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Decision Support System / Simplex Engine</p>
              </div>
              <button onClick={runOptimasi} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-emerald-200 transition-all flex items-center gap-3">
                OPTIMASI LABA <TrendingUp size={20}/>
              </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* KOLOM KIRI: INPUT DATA */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* VARIABEL KEPUTUSAN */}
                <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-emerald-900 text-xl tracking-tight">1. Variabel Keputusan (Tanaman)</h3>
                    <button onClick={() => setTanaman([...tanaman, { id: Date.now(), nama: 'Tanaman Baru', profit: 0 }])} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-100 transition">
                      <Plus size={16}/> TAMBAH
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tanaman.map((t, i) => (
                      <div key={t.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-center">
                        <div className="flex-1">
                          <input className="w-full bg-transparent font-bold text-emerald-900 outline-none" placeholder="Nama Tanaman" value={t.nama} onChange={e => {
                            const n = [...tanaman]; n[i].nama = e.target.value; setTanaman(n);
                          }}/>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Profit Unit:</span>
                            <input type="number" className="w-full bg-white px-2 py-1 rounded-lg text-xs font-black text-emerald-600 outline-none" value={t.profit} onChange={e => {
                              const n = [...tanaman]; n[i].profit = Number(e.target.value); setTanaman(n);
                            }}/>
                          </div>
                        </div>
                        <button onClick={() => setTanaman(tanaman.filter(x => x.id !== t.id))} className="text-red-300 hover:text-red-500 transition"><Trash2 size={18}/></button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* BATASAN KENDALA */}
                <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-emerald-900 text-xl tracking-tight">2. Batasan Kendala</h3>
                    <button onClick={() => setKendala([...kendala, { id: Date.now(), nama: 'Kendala Baru', koefs: new Array(tanaman.length).fill(0), target: 0, type: '<=' }])} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-100 transition">
                      <Plus size={16}/> TAMBAH KENDALA
                    </button>
                  </div>
                  <div className="space-y-6">
                    {kendala.map((k, i) => (
                      <div key={k.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-200 pb-4">
                          <input className="bg-transparent font-black text-emerald-800 outline-none uppercase tracking-wide" value={k.nama} onChange={e => {
                            const n = [...kendala]; n[i].nama = e.target.value; setKendala(n);
                          }}/>
                          <div className="flex items-center gap-3">
                            <select className="bg-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm outline-none" value={k.type} onChange={e => {
                              const n = [...kendala]; n[i].type = e.target.value; setKendala(n);
                            }}>
                              <option value="<=">{'≤ (Maksimal)'}</option>
                              <option value=">=">{'≥ (Minimal)'}</option>
                              <option value="=">{'= (Persis)'}</option>
                            </select>
                            <input type="number" className="w-24 bg-emerald-100 p-2 rounded-xl text-right font-black text-emerald-800 outline-none" value={k.target} onChange={e => {
                              const n = [...kendala]; n[i].target = Number(e.target.value); setKendala(n);
                            }}/>
                          </div>
                        </div>
                        
                        {/* INPUT KOEFISIEN DINAMIS */}
                        <div className="flex flex-wrap gap-4">
                          {tanaman.map((t, ti) => (
                            <div key={ti} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                              <input type="number" className="w-12 text-center font-black text-emerald-600 bg-emerald-50 rounded p-1 outline-none" value={k.koefs[ti]} onChange={e => {
                                const n = [...kendala]; n[i].koefs[ti] = Number(e.target.value); setKendala(n);
                              }}/>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{t.nama}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* KOLOM KANAN: HASIL SARAN */}
              <div className="lg:col-span-4">
                <div className="sticky top-10 space-y-6">
                  {hasil ? (
                    <div className="bg-[#064E3B] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
                      <h4 className="text-yellow-400 font-black text-xs uppercase tracking-[0.3em] mb-8 flex items-center gap-2"><CheckCircle2 size={16}/> Saran Hasil Tanam</h4>
                      
                      <div className="space-y-6 relative z-10">
                        <div>
                          <p className="text-4xl font-black">Rp {hasil.maxValue.toLocaleString()}</p>
                          <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest mt-1">Estimasi Laba Maksimal</p>
                        </div>
                        
                        <div className="space-y-3 pt-6 border-t border-emerald-800">
                          {tanaman.map((t, i) => (
                            <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                              <span className="text-sm font-medium">{t.nama}</span>
                              <div className="text-right">
                                <span className="font-black text-xl text-yellow-400">{hasil.solutions[i]?.toFixed(2)}</span>
                                <span className="ml-2 text-[10px] opacity-60 font-bold uppercase tracking-widest">Unit/Ha</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 bg-yellow-400 rounded-2xl text-emerald-900">
                          <p className="text-[10px] font-black uppercase mb-1">Analisis Sistem:</p>
                          <p className="text-xs leading-relaxed font-bold italic">
                            "Berdasarkan batasan yang diberikan, alokasikan sumber daya Anda pada komoditas di atas untuk mencapai profit tertinggi."
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-slate-200 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300"><Info/></div>
                      <p className="text-sm font-bold text-slate-400 px-6">Lengkapi data tanaman & batasan kendala, lalu klik 'Optimasi Laba'.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Placeholder tab Uber Tani - Gunakan kode UberTani dari jawaban sebelumnya jika ingin lengkap */}
        {tab === 'uber' && <div className="p-20 text-center font-black opacity-20 text-4xl">UBER TANI PRO LOADED</div>}
      </main>
    </div>
  );
}

function MenuBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${active ? 'bg-yellow-400 text-emerald-950 shadow-lg shadow-yellow-400/20 scale-105' : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="hidden lg:block text-sm">{label}</span>
    </button>
  );
}