import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { SimplexSolver } from './lib/simplex';
import { Leaf, LogOut, Calculator, User as UserIcon, TrendingUp, Map } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // State untuk Kalkulator Simplex
  const [lahanTersedia, setLahanTersedia] = useState<number>(0);
  const [modalTersedia, setModalTersedia] = useState<number>(0);
  const [hasil, setHasil] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert("Gagal Login: " + error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  // FUNGSI HITUNG SIMPLEX
  const hitungOptimasi = () => {
    // Contoh Sederhana: Maksimalkan keuntungan Padi (5jt/ha) dan Jagung (4jt/ha)
    // Dengan kendala Lahan dan Modal
    const constraints = [
      [1, 1, lahanTersedia], // Kendala Lahan: 1*x + 1*y <= Lahan
      [2, 1, modalTersedia]  // Kendala Modal (misal): 2jt*x + 1jt*y <= Modal
    ];
    const objective = [5, 4]; // Keuntungan: 5x + 4y

    try {
      const solution = SimplexSolver.solve(objective, constraints);
      setHasil(solution);
    } catch (err) {
      alert("Gagal menghitung: Pastikan input benar.");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-sans">Memuat...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <Leaf className="text-green-600 w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Login Agri Optima</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                className="w-full mt-1 p-2 border rounded-lg outline-green-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@anda.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                className="w-full mt-1 p-2 border rounded-lg outline-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition">
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Leaf className="text-green-600" />
          <span className="font-bold text-xl text-gray-800 uppercase tracking-wider">Agri Optima</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <UserIcon size={14} />
            {user.email}
          </div>
          <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-5xl mx-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Panel Kendali Produksi</h2>
          <p className="text-gray-500 text-sm">Optimasi sumber daya pertanian menggunakan metode Simplex.</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Kolom Kiri: Input */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Map size={18} className="text-green-500" /> Input Sumber Daya
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight">Total Lahan (Ha)</label>
                  <input 
                    type="number" 
                    className="w-full mt-1 p-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
                    placeholder="Contoh: 10"
                    onChange={(e) => setLahanTersedia(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight">Anggaran Modal (Juta Rp)</label>
                  <input 
                    type="number" 
                    className="w-full mt-1 p-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
                    placeholder="Contoh: 50"
                    onChange={(e) => setModalTersedia(Number(e.target.value))}
                  />
                </div>
                <button 
                  onClick={hitungOptimasi}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition"
                >
                  Hitung Optimasi
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Hasil */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 min-h-[300px]">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-500" /> Hasil Rekomendasi
              </h3>
              
              {!hasil ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                  <Calculator size={48} className="mb-2 opacity-20" />
                  <p>Masukkan data lahan dan klik tombol hitung.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-xs text-green-600 font-bold uppercase">Padi (Komoditas A)</p>
                      <p className="text-3xl font-black text-green-800">{hasil[0]?.toFixed(2) || 0} <span className="text-sm font-normal">Ha</span></p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-xs text-blue-600 font-bold uppercase">Jagung (Komoditas B)</p>
                      <p className="text-3xl font-black text-blue-800">{hasil[1]?.toFixed(2) || 0} <span className="text-sm font-normal">Ha</span></p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500">Estimasi Keuntungan Maksimal:</p>
                    <p className="text-2xl font-bold text-gray-800">Rp {(hasil[hasil.length-1] || 0).toFixed(2)} Juta</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}