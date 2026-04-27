import React, { useState, useEffect } from 'react';
import { SimplexSolver } from './lib/simplex';
import { 
  LayoutDashboard, Truck, Store, User, LogOut, Plus, Trash2, 
  CheckCircle2, CreditCard, Search, MapPin, Calendar, ArrowRight, ShieldCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('optimasi');
  const [showQRIS, setShowQRIS] = useState(false);
  const [step, setStep] = useState(1); // 1: Order, 2: Payment, 3: Progress

  // DATA OPTIMASI
  const [tanaman, setTanaman] = useState([{ id: 1, nama: 'Padi', profit: 15000000 }]);
  const [kendala, setKendala] = useState([
    { id: 1, nama: 'Luas Lahan (Ha)', koefs: [1], target: 10, type: '<=' },
    { id: 2, nama: 'Modal Benih (Rp)', koefs: [500000], target: 5000000, type: '<=' }
  ]);
  const [result, setResult] = useState<any>(null);

  // LOGIKA HITUNG
  const hitungOptimasi = () => {
    const prices = tanaman.map(t => t.profit);
    const consts = kendala.map(k => ({ coeffs: k.koefs, type: k.type, target: k.target }));
    const res = SimplexSolver.solve(prices, consts);
    setResult(res);
  };

  const tambahTanaman = () => {
    const newId = tanaman.length + 1;
    setTanaman([...tanaman, { id: newId, nama: `Tanaman ${newId}`, profit: 0 }]);
    setKendala(kendala.map(k => ({ ...k, koefs: [...k.koefs, 0] })));
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7F5] font-sans text-slate-800">
      {/* SIDEBAR LENGKAP */}
      <aside className="w-72 bg-[#1A3C34] text-white p-6 hidden lg:flex flex-col border-r border-green-800 shadow-xl">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-[#FACC15] p-2 rounded-xl shadow-lg">
            <LayoutDashboard className="text-[#1A3C34]" size={24} />
          </div>
          <span className="text-xl font-black tracking-tight uppercase">Agri Optima</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          <MenuBtn active={activeTab === 'optimasi'} icon={<LayoutDashboard/>} label="Dashboard Optimasi" onClick={() => setActiveTab('optimasi')} />
          <MenuBtn active={activeTab === 'uber'} icon={<Truck/>} label="Uber Tani Pro" onClick={() => setActiveTab('uber')} />
          <MenuBtn active={activeTab === 'hilirisasi'} icon={<Store/>} label="Marketplace Hilir" onClick={() => setActiveTab('hilirisasi')} />
        </nav>

        <div className="pt-6 border-t border-green-800">
          <div className="flex items-center gap-3 p-3 bg-green-900/50 rounded-2xl mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center font-bold text-green-900">R</div>
            <div>
              <p className="text-sm font-bold">Ricky Dev</p>
              <p className="text-[10px] text-green-400">Premium Farmer</p>
            </div>
          </div>
          <button className="flex items-center gap-3 text-red-400 p-3 hover:bg-red-500/10 w-full rounded-xl transition font-bold text-sm"><LogOut size={18}/> Logout</button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        
        {/* FITUR OPTIMASI (PORPOSIONAL) */}
        {activeTab === 'optimasi' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Optimasi Laba Produksi</h1>
                <p className="text-slate-500">Gunakan kecerdasan buatan untuk menentukan alokasi lahan terbaik.</p>
              </div>
              <button onClick={hitungOptimasi} className="bg-[#1A3C34] text-[#FACC15] px-8 py-4 rounded-2xl font-black shadow-lg hover:shadow-green-200 transition-all active:scale-95 flex items-center gap-2">
                JALANKAN SIMPLEX <ArrowRight size={20}/>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* KOLOM KIRI: INPUT DATA */}
              <div className="lg:col-span-8 space-y-6">
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold flex items-center gap-2"><Plus className="text-green-600"/> Komoditas Tanaman</h3>
                    <button onClick={tambahTanaman} className="text-xs font-bold text-green-700 bg-green-50 px-4 py-2 rounded-full hover:bg-green-100">+ Tambah Komoditas</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tanaman.map((t, i) => (
                      <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-xs font-bold shadow-sm">{i+1}</span>
                        <input className="flex-1 bg-transparent font-bold outline-none" value={t.nama} onChange={e => {
                          const n = [...tanaman]; n[i].nama = e.target.value; setTanaman(n);
                        }} />
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Profit/Ha</p>
                          <input type="number" className="w-24 bg-white px-2 py-1 rounded text-sm font-black text-green-700 text-right" value={t.profit} onChange={e => {
                             const n = [...tanaman]; n[i].profit = Number(e.target.value); setTanaman(n);
                          }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="font-bold mb-6 flex items-center gap-2"><ShieldCheck className="text-green-600"/> Matriks Kendala Produksi</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-50">
                          <th className="pb-4 px-2">Nama Kendala</th>
                          {tanaman.map(t => <th key={t.id} className="pb-4 px-2 text-center">{t.nama}</th>)}
                          <th className="pb-4 px-2 text-right">Target (RHS)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {kendala.map((k, ki) => (
                          <tr key={k.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-2 font-bold text-sm text-slate-600 italic">{k.nama}</td>
                            {tanaman.map((_, ti) => (
                              <td key={ti} className="py-4 px-2">
                                <input type="number" className="w-16 mx-auto block bg-white border border-slate-200 rounded p-1 text-center font-bold text-xs" value={k.koefs[ti]} onChange={e => {
                                  const n = [...kendala]; n[ki].koefs[ti] = Number(e.target.value); setKendala(n);
                                }}/>
                              </td>
                            ))}
                            <td className="py-4 px-2">
                               <div className="flex items-center gap-2 justify-end">
                                  <span className="text-slate-400 text-xs">{k.type}</span>
                                  <input type="number" className="w-20 bg-green-50 border border-green-200 rounded p-1 text-right font-black text-green-800" value={k.target} onChange={e => {
                                    const n = [...kendala]; n[ki].target = Number(e.target.value); setKendala(n);
                                  }} />
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* KOLOM KANAN: HASIL (SIDEBAR) */}
              <div className="lg:col-span-4">
                <div className="sticky top-10 space-y-6">
                   <div className="bg-[#1A3C34] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-green-200 relative overflow-hidden min-h-[400px]">
                      <div className="absolute top-0 right-0 p-10 opacity-10"><LayoutDashboard size={150}/></div>
                      <h4 className="text-yellow-400 font-black text-xs uppercase tracking-[0.3em] mb-10">Hasil Analisis</h4>
                      
                      {result ? (
                        <div className="space-y-8 relative z-10">
                          <div>
                            <p className="text-4xl font-black">Rp {result.maxValue.toLocaleString()}</p>
                            <p className="text-green-400 text-xs font-medium">Estimasi Keuntungan Maksimal</p>
                          </div>
                          <div className="space-y-4">
                            {tanaman.map((t, i) => (
                              <div key={t.id} className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/10">
                                <span className="text-sm">{t.nama}</span>
                                <span className="font-black text-xl">{result.solutions[i]?.toFixed(2)} <span className="text-[10px] opacity-60">Ha</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-center opacity-40">
                          <Search size={40} className="mb-4"/>
                          <p className="text-xs">Belum ada data.<br/>Tekan 'Jalankan Simplex'</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FITUR UBER TANI PRO (LENGKAP) */}
        {activeTab === 'uber' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95">
            <header className="flex flex-col md:flex-row justify-between items-end">
              <div>
                <span className="bg-yellow-400 text-green-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">Uber Tani Premium</span>
                <h1 className="text-3xl font-black text-slate-900">Sewa Alat & Jasa Profesional</h1>
              </div>
              <div className="flex bg-white p-1 rounded-2xl shadow-sm mt-4 md:mt-0">
                <button className="px-6 py-2 rounded-xl text-xs font-bold bg-green-600 text-white">Baru</button>
                <button className="px-6 py-2 rounded-xl text-xs font-bold text-slate-400">Riwayat</button>
              </div>
            </header>

            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-green-400 transition-all cursor-pointer" onClick={() => setStep(2)}>
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6"><Truck size={32}/></div>
                  <h3 className="text-xl font-black mb-2">Traktor Otomatis (Drone)</h3>
                  <p className="text-slate-500 text-sm mb-6">Sewa traktor canggih dengan operator bersertifikat. Harga per hektar transparan.</p>
                  <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                    <span className="font-black text-lg text-green-700">Rp 1.200.000 <span className="text-xs text-slate-400 font-normal">/Ha</span></span>
                    <button className="bg-slate-900 text-white p-3 rounded-full"><Plus/></button>
                  </div>
                </div>
                {/* Opsi lain bisa ditambahkan di sini */}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-2xl mx-auto border border-green-50">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-black">Konfirmasi Pembayaran</h3>
                  <p className="text-slate-400 text-sm">Pindai QRIS untuk memulai pengerjaan otomatis</p>
                </div>
                
                <div className="bg-[#1A3C34] p-8 rounded-[2rem] text-white mb-8">
                  <div className="flex justify-between mb-4 text-sm opacity-70"><span>Item: Traktor Sewa</span><span>1 Unit</span></div>
                  <div className="flex justify-between mb-8 text-xl font-bold"><span>Total Tagihan</span><span className="text-yellow-400">Rp 1.200.000</span></div>
                  <div className="bg-white p-6 rounded-2xl flex flex-col items-center">
                    <div className="w-48 h-48 bg-slate-800 rounded-lg mb-4 flex items-center justify-center text-white font-black text-3xl">QRIS</div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest text-center">Agri Optima Indonesia Payment Terminal</p>
                  </div>
                </div>

                <button onClick={() => setStep(3)} className="w-full bg-yellow-400 text-green-900 py-5 rounded-[1.5rem] font-black shadow-lg shadow-yellow-100 hover:scale-105 transition-all">SAYA SUDAH BAYAR</button>
                <button onClick={() => setStep(1)} className="w-full mt-4 text-slate-400 font-bold text-sm">Batalkan Pesanan</button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-10">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-green-500">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-pulse"><CheckCircle2/></div>
                      <div>
                        <h4 className="font-black">Pembayaran Terverifikasi</h4>
                        <p className="text-xs text-slate-400 italic font-medium">Order ID: #AGO-99120</p>
                      </div>
                   </div>
                   
                   <div className="space-y-8">
                      <div className="relative">
                        <div className="flex justify-between mb-2 text-xs font-bold uppercase tracking-widest text-green-700"><span>Progress Pengerjaan</span><span>75%</span></div>
                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                          <div className="bg-green-600 h-full w-3/4 rounded-full shadow-[0_0_15px_rgba(22,163,74,0.4)]"></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Lokasi</p>
                          <p className="font-bold flex items-center gap-1"><MapPin size={14}/> Sawah Blok A-12</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Estimasi Selesai</p>
                          <p className="font-bold flex items-center gap-1"><Calendar size={14}/> 14:00 WIB</p>
                        </div>
                      </div>
                   </div>
                </div>
                <button onClick={() => setStep(1)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">Kembali ke Dashboard</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// COMPONENT KECIL
function MenuBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-[#FACC15] text-[#1A3C34] shadow-lg shadow-yellow-400/20' : 'text-green-200/60 hover:bg-white/5 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}