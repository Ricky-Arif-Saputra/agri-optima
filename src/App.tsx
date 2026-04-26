import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { SimplexSolver } from './lib/simplex';
import { Leaf, Lock, LogOut, Calculator, User as UserIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // Pantau status login
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

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  // Tampilan Jika Belum Login
  if (!user) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
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
                placeholder="admin@agrioptima.com"
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

  // Tampilan Dashboard Jika Sudah Login
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Leaf className="text-green-600" />
          <span className="font-bold text-xl text-gray-800">Agri Optima</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon size={16} />
            {user.email}
          </div>
          <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calculator className="text-green-600" /> 
            Optimasi Simplex Tani
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            Gunakan fitur ini untuk menghitung alokasi lahan atau pupuk secara optimal.
          </p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              Logika <strong>SimplexSolver.ts</strong> sudah siap di latar belakang. Silakan hubungkan input form kamu ke fungsi <code>SimplexSolver.solve()</code>.
            </p>
          </div>

          <button 
            onClick={() => alert("Fitur hitung sedang diintegrasikan dengan SimplexSolver.ts")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Mulai Hitung
          </button>
        </div>
      </main>
    </div>
  );
}