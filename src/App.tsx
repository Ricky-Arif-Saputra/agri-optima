import React, { useState, useEffect } from 'react';
// KONFIGURASI FIREBASE LANGSUNG DI SINI
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyxxxxxxxxxxxxxxxxxxxx", // GANTI DENGAN API KEY ASLI KAMU
  authDomain: "agri-optima.firebaseapp.com",
  projectId: "agri-optima",
  storageBucket: "agri-optima.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef12345"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// IMPORT TOOLS LAINNYA
import { SimplexSolver } from './lib/simplex';
import { 
  Calculator, Truck, ShoppingBag, Plus, Trash2, Layers, 
  CheckCircle2, TrendingUp, Package, Box, QrCode, LogOut, UserCheck
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('optimasi');
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [orderProgress, setOrderProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // AUTH OBSERVER
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return unsub;
  }, []);

  const handleAuth = async (type: 'login' | 'reg') => {
    try {
      if (type === 'login') await signInWithEmailAndPassword(auth, email, password);
      else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, progress: 0 });
      }
    } catch (err) { alert("Error: " + err); }
  };

  // DATA MOCKUP
  const dataUber = {
    bahan: [{ id: 1, name: 'Pupuk NPK 50kg', price: 450000, img: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400', desc: 'Pupuk NPK berkualitas.' }],
    alat: [{ id: 2, name: 'Sewa Traktor', price: 1500000, img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400', desc: 'Sewa harian traktor.' }],
    jasa: [{ id: 3, name: 'Buruh Tanam', price: 200000, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', desc: 'Jasa tenaga tanam.' }]
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center p-6 text-white font-sans">
        <div className="bg-white text-slate-900 w-full max-w-md rounded-[2.5rem] p-10 space-y-6 shadow-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tighter text-green-800">AGRI-OPTIMA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Login Akun Petani</p>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-slate-100 rounded-2xl outline-none" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-4 bg-slate-100 rounded-2xl outline-none" onChange={e => setPassword(e.target.value)} />
            <button onClick={() => handleAuth('login')} className="w-full bg-green-700 text-white py-4 rounded-2xl font-black">MASUK</button>
            <button onClick={() => handleAuth('reg')} className="w-full text-green-700 font-bold text-sm">Belum punya akun? Daftar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F0F5F2] font-sans">
      <aside className="w-20 lg:w-64 bg-green-950 text-white fixed h-full p-6 flex flex-col">
        <div className="mb-10 font-black text-xl italic text-yellow-400 hidden lg:block">AGRI-OPTIMA</div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setTab('optimasi')} className={`w-full flex p-4 rounded-xl ${tab==='optimasi'?'bg-white/10 text-yellow-400':'text-white/60'}`}><Calculator className="mr-3"/> <span className="hidden lg:block">Optimasi</span></button>
          <button onClick={() => setTab('uber')} className={`w-full flex p-4 rounded-xl ${tab==='uber'?'bg-white/10 text-yellow-400':'text-white/60'}`}><Truck className="mr-3"/> <span className="hidden lg:block">Uber Tani</span></button>
          <button onClick={() => setTab('hilir')} className={`w-full flex p-4 rounded-xl ${tab==='hilir'?'bg-white/10 text-yellow-400':'text-white/60'}`}><ShoppingBag className="mr-3"/> <span className="hidden lg:block">Marketplace</span></button>
        </nav>
        <button onClick={() => signOut(auth)} className="text-red-400 font-bold flex items-center p-4"><LogOut className="mr-2"/> <span className="hidden lg:block">Keluar</span></button>
      </aside>

      <main className="flex-1 ml-20 lg:ml-64 p-10">
        {tab === 'uber' && (
          <div className="space-y-10">
            <h1 className="text-3xl font-black text-green-900">Layanan Uber Tani</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dataUber.bahan.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-[2rem] shadow-sm border">
                  <img src={item.img} className="h-40 w-full object-cover rounded-2xl mb-4" />
                  <h3 className="font-black text-green-900">{item.name}</h3>
                  <p className="text-green-600 font-bold mb-4">Rp {item.price.toLocaleString()}</p>
                  <button onClick={() => setCheckoutItem({...item, qty: 1, address: ''})} className="w-full bg-green-50 text-green-700 py-3 rounded-xl font-black text-xs hover:bg-green-700 hover:text-white transition">PESAN SEKARANG</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'optimasi' && <div className="p-20 text-center font-black text-slate-300">Modul Optimasi Laba Berbayar (Simplex)</div>}
      </main>

      {checkoutItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative">
              <button onClick={()=>setCheckoutItem(null)} className="absolute top-6 right-6 font-bold">X</button>
              <h2 className="text-xl font-black text-green-900 mb-6">Checkout Pesanan</h2>
              <div className="space-y-4">
                <div className="flex gap-4 border-b pb-4">
                  <img src={checkoutItem.img} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold">{checkoutItem.name}</p>
                    <p className="font-black text-green-600 text-sm">Rp {checkoutItem.price.toLocaleString()}</p>
                  </div>
                </div>
                <input className="w-full p-4 bg-slate-50 rounded-xl outline-none" placeholder="Alamat Pengiriman" />
                <div className="bg-green-900 text-white p-6 rounded-2xl flex justify-between items-center">
                  <p className="font-black">Total: Rp {checkoutItem.price.toLocaleString()}</p>
                  <button onClick={() => {setOrderProgress(100); alert("QRIS Terdeteksi! Memproses...")}} className="bg-yellow-400 text-green-950 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-tighter">Bayar</button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}