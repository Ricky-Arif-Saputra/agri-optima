/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f0fdf4'
    }}>
      <h1 style={{ color: '#166534' }}>🌱 Agri Optima Berhasil Jalan!</h1>
      <p>Sekarang tinggal masukkan logika Simplex dan Firebase kamu.</p>
      <button 
        onClick={() => alert('Tombol berfungsi!')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Tes Klik Di Sini
      </button>
    </div>
  );
}
