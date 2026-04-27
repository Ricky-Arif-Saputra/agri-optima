import React, { useState } from 'react';
import { Leaf, Calculator, ShoppingCart, BarChart3, User, MessageSquare, Download, Archive, Plus, Trash2 } from 'lucide-react';
import { SimplexSolver } from './lib/simplex';

export default function App() {
  const [role, setRole] = useState<'petani' | 'pembeli' | null>(null);
  const [activeTab, setActiveTab] = useState('optimasi');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- State Optimasi Laba ---
  const [tanaman, setTanaman] = useState([{ nama: '', harga: 0 }]);
  const [kendala, setKendala] = useState([{ nama: '', nilai: [0, 0], tipe: '<=', target: 0 }]);
  const [hasilOpt, setHasilOpt] = useState<any>(null);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-green-100">
          <div className="flex justify-center mb-6"><Leaf className="text-green-600 w-12 h-12" /></div>
          <h1 className="text-3xl font-black text-center text-green-800 mb-2">AGRI OPTIMA</h1>
          <p className="text-center text-gray-500 mb-8 uppercase tracking-widest text-xs font-bold">Solusi Pertanian Digital</p>
          
          <div className="space-y-4">
            <button onClick={() => {setRole('petani'); setIsLoggedIn(true)}} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200">Masuk Sebagai Petani</button>
            <button onClick={() => {setRole('pembeli'); setIsLoggedIn(true)}} className="w-full bg-white text-green-600 border-2 border-green-600 py-4 rounded-2xl font-bold hover:bg-green-50 transition">Masuk Sebagai Pembeli</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Nav */}
      <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 font-black text-green-600 text-xl hidden md:block italic">AGRI OPTIMA</div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {role === 'petani' && (
            <>
              <NavItem icon={<BarChart3 />} label="Optimasi Laba" active={activeTab === 'optimasi'} onClick={() => setActiveTab('optimasi')} />
              <NavItem icon={<ShoppingCart />} label="Uber Tani" active={activeTab === 'uber'} onClick={() => setActiveTab('uber')} />
            </>
          )}
          <NavItem icon={<Leaf />} label="Hilirisasi" active={activeTab === 'hilirisasi'} onClick={() => setActiveTab('hilirisasi')} />
        </nav>
        <div className="p-4 border-t text-xs text-gray-400 font-bold uppercase text-center">{role}</div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeTab === 'optimasi' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Optimasi Laba (Simplex)</h2>
            
            {/* Input Tanaman */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
              <h3 className="font-bold text-gray-700 mb-4 flex justify-between">
                Fungsi Tujuan (Tanaman)
                <button onClick={() => setTanaman([...tanaman, { nama: '', harga: 0 }])} className="text-green-600 text-sm flex items-center gap-1"><Plus size={16}/>Tambah</button>
              </h3>
              {tanaman.map((t, idx) => (
                <div key={idx} className="flex gap-4 mb-3">
                  <input placeholder="Nama Tanaman" className="flex-1 p-2 bg-gray-50 border rounded-lg" value={t.nama} onChange={(e) => {
                    const newT = [...tanaman]; newT[idx].nama = e.target.value; setTanaman(newT);
                  }}/>
                  <input type="number" placeholder="Harga/Ton" className="w-32 p-2 bg-gray-50 border rounded-lg" onChange={(e) => {
                    const newT = [...tanaman]; newT[idx].harga = Number(e.target.value); setTanaman(newT);
                  }}/>
                </div>
              ))}
            </section>

            {/* Input Kendala */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
              <h3 className="font-bold text-gray-700 mb-4 flex justify-between">
                Fungsi Kendala
                <button onClick={() => setKendala([...kendala, { nama: '', nilai: [0, 0], tipe: '<=', target: 0 }])} className="text-green-600 text-sm flex items-center gap-1"><Plus size={16}/>Tambah</button>
              </h3>
              {kendala.map((k, idx) => (
                <div key={idx} className="space-y-2 mb-4 p-3 bg-slate-50 rounded-xl">
                  <input placeholder="Nama Kendala (Misal: Benih)" className="w-full p-2 border rounded-lg text-sm" value={k.nama} onChange={(e) => {
                    const newK = [...kendala]; newK[idx].nama = e.target.value; setKendala(newK);
                  }}/>
                  <div className="flex items-center gap-2">
                    {tanaman.map((t, tIdx) => (
                      <input key={tIdx} type="number" placeholder={t.nama || `T${tIdx+1}`} className="w-20 p-2 border rounded-lg text-xs" onChange={(e) => {
                        const newK = [...kendala]; newK[idx].nilai[tIdx] = Number(e.target.value); setKendala(newK);
                      }}/>
                    ))}
                    <select className="p-2 border rounded-lg text-xs" onChange={(e) => {
                      const newK = [...kendala]; newK[idx].tipe = e.target.value; setKendala(newK);
                    }}>
                      <option value="<=">&le;</option>
                      <option value="<">&lt;</option>
                      <option value="=">=</option>
                      <option value=">">&gt;</option>
                      <option value=">=">&ge;</option>
                    </select>
                    <input type="number" placeholder="Target" className="w-24 p-2 border rounded-lg text-xs font-bold" onChange={(e) => {
                      const newK = [...kendala]; newK[idx].target = Number(e.target.value); setKendala(newK);
                    }}/>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setHasilOpt(SimplexSolver.solve(tanaman.map(t => t.harga), kendala.map(k => ({ coeffs: k.nilai, type: k.tipe, target: k.target }))))}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-green-100"
              >
                Klik Optimasi
              </button>
            </section>

            {/* Hasil Dashboard */}
            {hasilOpt && (
              <div className="bg-green-900 text-white p-8 rounded-3xl shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold">Hasil Rekomendasi</h3>
                  <div className="flex gap-2">
                    <button className="p-2 bg-green-800 rounded-lg hover:bg-green-700"><Download size={18}/></button>
                    <button className="p-2 bg-green-800 rounded-lg hover:bg-green-700"><Archive size={18}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {tanaman.map((t, idx) => (
                    <div key={idx} className="bg-green-800/50 p-4 rounded-2xl border border-green-700">
                      <p className="text-green-300 text-xs font-bold uppercase tracking-widest">{t.nama || 'Tanaman'}</p>
                      <p className="text-3xl font-black">{hasilOpt.variables[idx]?.toFixed(2)} <span className="text-sm font-normal">Ha</span></p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-green-700 pt-6">
                  <p className="text-green-300 text-sm">Prediksi Pendapatan Maksimal:</p>
                  <p className="text-4xl font-black text-yellow-400">Rp {hasilOpt.result.toLocaleString('id-ID')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'uber' && (
          <div className="max-w-4xl mx-auto">
             <h2 className="text-2xl font-bold text-gray-800 mb-6">Uber Tani</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UberCard title="Beli Bahan" desc="Pupuk, Benih, Pestisida" groupInfo="Tersedia Sistem Grup" />
                <UberCard title="Pesan Alat" desc="Traktor, Drone, Harvester" groupInfo="Sistem Individu" />
                <UberCard title="Manajemen Tani" desc="Jasa Tanam & Cangkul" groupInfo="Profesional" />
             </div>
          </div>
        )}

        {activeTab === 'hilirisasi' && (
          <div className="max-w-4xl mx-auto">
             <h2 className="text-2xl font-bold text-gray-800 mb-6">Hilirisasi Produk</h2>
             {role === 'petani' ? (
               <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                 <Plus size={48} className="text-gray-300 mb-4" />
                 <p className="font-bold text-gray-500">Upload Hasil Panen Anda</p>
                 <button className="mt-4 bg-green-600 text-white px-6 py-2 rounded-xl">Mulai Upload</button>
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-4">
                 <ProductCard name="Beras Pandan Wangi" price="15.000/kg" stock="500kg" />
                 <ProductCard name="Jagung Pipil Kering" price="8.000/kg" stock="1.200kg" />
               </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
}

// --- Komponen Pendukung ---
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-bold text-sm ${active ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      {icon} <span className="hidden md:block">{label}</span>
    </button>
  );
}

function UberCard({ title, desc, groupInfo }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border hover:shadow-md transition cursor-pointer group">
      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:bg-green-600 group-hover:text-white transition">
        <ShoppingCart size={24}/>
      </div>
      <h4 className="font-black text-gray-800">{title}</h4>
      <p className="text-sm text-gray-500 mb-4">{desc}</p>
      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold uppercase">{groupInfo}</span>
    </div>
  );
}

function ProductCard({ name, price, stock }: any) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border">
      <div className="h-32 bg-slate-200"></div>
      <div className="p-4">
        <h4 className="font-bold text-gray-800">{name}</h4>
        <p className="text-green-600 font-black">{price}</p>
        <p className="text-xs text-gray-400">Stok: {stock}</p>
        <button className="w-full mt-3 bg-gray-800 text-white py-2 rounded-lg text-sm font-bold">Beli Sekarang</button>
      </div>
    </div>
  );
}