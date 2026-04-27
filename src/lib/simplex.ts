/**
 * Simplex Algorithm implementation for Agri Optima.
 * Advanced Version: Supports Dynamic Constraints and Variables.
 */

export type Matrix = number[][];

export interface SimplexResult {
  maxValue: number;
  solutions: number[];
  status: 'optimal' | 'unbounded' | 'no-solution' | 'limit-exceeded';
}

export class SimplexSolver {
  private static EPS = 1e-6;

  /**
   * Wrapper untuk memudahkan penggunaan dari UI (App.tsx)
   */
  public static solve(objective: number[], constraints: { coeffs: number[], type: string, target: number }[]): SimplexResult {
    const n = objective.length;
    const m1_list = constraints.filter(c => c.type === '<=' || c.type === '<');
    const m2_list = constraints.filter(c => c.type === '>=' || c.type === '>');
    const m3_list = constraints.filter(c => c.type === '=');

    const m1 = m1_list.length;
    const m2 = m2_list.length;
    const m3 = m3_list.length;
    const m = m1 + m2 + m3;

    // Membuat Matrix A (Tableau) sesuai ukuran dinamis
    // Ukuran: (m + 3) baris x (n + 2) kolom
    const a: Matrix = Array.from({ length: m + 3 }, () => new Array(n + 2).fill(0));

    // Baris 1: Fungsi Tujuan (Objective Function)
    for (let j = 1; j <= n; j++) {
      a[1][j + 1] = objective[j - 1];
    }
    a[1][1] = 0; // Inisialisasi Z

    // Gabungkan semua kendala ke dalam satu list sesuai urutan M1, M2, M3
    const allConstraints = [...m1_list, ...m2_list, ...m3_list];

    for (let i = 1; i <= m; i++) {
      const c = allConstraints[i - 1];
      a[i + 1][1] = c.target; // Kolom 1 adalah RHS (b)
      for (let j = 1; j <= n; j++) {
        a[i + 1][j + 1] = -c.coeffs[j - 1]; // Koefisien variabel
      }
    }

    return this.runAlgorithm(n, m1, m2, m3, a);
  }

  private static runAlgorithm(n: number, m1: number, m2: number, m3: number, a: Matrix): SimplexResult {
    const m = m1 + m2 + m3;
    const iposv = new Array(m + 1).fill(0);
    const izrov = new Array(n + 1).fill(0);
    let icase = 0;

    this.simplx(a, m, n, m1, m2, m3, (code) => (icase = code), izrov, iposv);

    if (icase === 0) {
      const solutions = new Array(n).fill(0);
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          if (iposv[j] === i) {
            solutions[i - 1] = a[j + 1][1];
            break;
          }
        }
      }
      return {
        maxValue: a[1][1],
        solutions,
        status: 'optimal',
      };
    } else if (icase === 1) {
      return { maxValue: 0, solutions: [], status: 'unbounded' };
    } else {
      return { maxValue: 0, solutions: [], status: 'no-solution' };
    }
  }

  // --- INTERNAL ENGINE (LOGIKA 300 BARIS KAMU) ---
  
  private static simplx(a: Matrix, m: number, n: number, m1: number, m2: number, m3: number, setIcase: (val: number) => void, izrov: number[], iposv: number[]) {
    let kp = 0; bmax = 0;
    const l1: number[] = []; const l2: number[] = []; const l3: number[] = [];
    let nl1 = n;
    for (let k = 1; k <= n; k++) { l1[k] = k; izrov[k] = k; }
    let nl2 = m;
    for (let i = 1; i <= m; i++) {
      if (a[i + 1][1] < 0.0) { setIcase(-1); return; }
      l2[i] = i; iposv[i] = n + i;
    }
    for (let i = 1; i <= m2; i++) l3[i] = 1;
    let ir = 0;
    if (m2 + m3 !== 0) {
      ir = 1;
      for (let k = 1; k <= n + 1; k++) {
        let q_sum = 0.0;
        for (let i = m1 + 1; i <= m; i++) q_sum += a[i + 1][k];
        a[m + 2][k] = -q_sum;
      }
    } else {
      this.doPhaseTwo(a, m, n, l1, nl1, l2, nl2, setIcase, izrov, iposv);
      return;
    }

    // Phase 1 Loop
    while (true) {
      const res1 = this.simp1(a, m + 1, l1, nl1, 0);
      if (res1.bmax <= this.EPS && a[m + 2][1] < -this.EPS) { setIcase(-1); return; }
      else if (res1.bmax <= this.EPS && a[m + 2][1] <= this.EPS) {
        // Transition to Phase 2
        ir = 0;
        this.doPhaseTwo(a, m, n, l1, nl1, l2, nl2, setIcase, izrov, iposv);
        return;
      }
      const res2 = this.simp2(a, m, n, l2, nl2, res1.kp);
      if (res2.ip === 0) { setIcase(-1); return; }
      this.performPivot(a, m, n, l1, nl1, l2, nl2, l3, res2.ip, res1.kp, izrov, iposv, m1, true);
    }
  }

  private static doPhaseTwo(a: Matrix, m: number, n: number, l1: number[], nl1: number, l2: number[], nl2: number, setIcase: (val: number) => void, izrov: number[], iposv: number[]) {
    while (true) {
      const res1 = this.simp1(a, 0, l1, nl1, 0);
      if (res1.bmax <= this.EPS) { setIcase(0); return; }
      const res2 = this.simp2(a, m, n, l2, nl2, res1.kp);
      if (res2.ip === 0) { setIcase(1); return; }
      this.performPivot(a, m, n, l1, nl1, l2, nl2, [], res2.ip, res1.kp, izrov, iposv, 0, false);
    }
  }

  private static simp1(a: Matrix, mm: number, ll: number[], nll: number, iabf: number) {
    let kp = ll[1]; let bmax = a[mm + 1][kp + 1];
    for (let k = 2; k <= nll; k++) {
      let test = (iabf === 0) ? (a[mm + 1][ll[k] + 1] - bmax) : (Math.abs(a[mm + 1][ll[k] + 1]) - Math.abs(bmax));
      if (test > 0.0) { bmax = a[mm + 1][ll[k] + 1]; kp = ll[k]; }
    }
    return { kp, bmax };
  }

  private static simp2(a: Matrix, m: number, n: number, l2: number[], nl2: number, kp: number) {
    let ip = 0; let q1 = 0; let first = true;
    for (let i = 1; i <= nl2; i++) {
      const ii = l2[i];
      if (a[ii + 1][kp + 1] < -this.EPS) {
        const q = -a[ii + 1][1] / a[ii + 1][kp + 1];
        if (first || q < q1) { q1 = q; ip = ii; first = false; }
      }
    }
    return { ip, q1 };
  }

  private static simp3(a: Matrix, i1: number, k1: number, ip: number, kp: number) {
    const piv = 1.0 / a[ip + 1][kp + 1];
    for (let ii = 1; ii <= i1 + 1; ii++) {
      if (ii - 1 !== ip) {
        const factor = a[ii][kp + 1] * piv;
        for (let kk = 1; kk <= k1 + 1; kk++) {
          if (kk - 1 !== kp) a[ii][kk] -= a[ip + 1][kk] * factor;
        }
        a[ii][kp + 1] = factor;
      }
    }
    for (let kk = 1; kk <= k1 + 1; kk++) {
      if (kk - 1 !== kp) a[ip + 1][kk] *= -piv;
    }
    a[ip + 1][kp + 1] = piv;
  }

  private static performPivot(a: Matrix, m: number, n: number, l1: number[], nl1: number, l2: number[], nl2: number, l3: number[], ip: number, kp: number, izrov: number[], iposv: number[], m1: number, isPhase1: boolean) {
    this.simp3(a, isPhase1 ? m + 1 : m, n, ip, kp);
    const is = izrov[kp];
    izrov[kp] = iposv[ip];
    iposv[ip] = is;
  }
}