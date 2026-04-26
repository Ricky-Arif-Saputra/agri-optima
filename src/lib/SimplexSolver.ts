/**
 * Simplex Algorithm implementation for Agri Optima.
 * Ported and optimized for TypeScript from the provided C++ reference.
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
   * Solve a linear programming problem.
   * Maximize Z = c1x1 + c2x2 + ... + cnxn
   * Subject to:
   *   a11x1 + a12x2 + ... + a1nxn <= b1 (M1 constraints)
   *   a21x1 + a22x2 + ... + a2nxn >= b2 (M2 constraints)
   *   a31x1 + a32x2 + ... + a3nxn == b3 (M3 constraints)
   */
  public static solve(
    n: number,
    m1: number,
    m2: number,
    m3: number,
    matrixA: Matrix
  ): SimplexResult {
    const m = m1 + m2 + m3;
    const a = this.deepCopy(matrixA);
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

  private static deepCopy(matrix: Matrix): Matrix {
    return matrix.map((row) => [...row]);
  }

  private static simplx(
    a: Matrix,
    m: number,
    n: number,
    m1: number,
    m2: number,
    m3: number,
    setIcase: (val: number) => void,
    izrov: number[],
    iposv: number[]
  ) {
    let kp = 0;
    let ip = 0;
    let bmax = 0;
    let q1 = 0;
    const l1: number[] = [];
    const l2: number[] = [];
    const l3: number[] = [];

    let nl1 = n;
    for (let k = 1; k <= n; k++) {
      l1[k] = k;
      izrov[k] = k;
    }

    let nl2 = m;
    for (let i = 1; i <= m; i++) {
      if (a[i + 1][1] < 0.0) {
        setIcase(-1);
        return;
      }
      l2[i] = i;
      iposv[i] = n + i;
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
      // goto e30
      this.doPhaseTwo(a, m, n, l1, nl1, l2, nl2, setIcase, izrov, iposv);
      return;
    }

    // Phase 1
    while (true) {
      const res1 = this.simp1(a, m + 1, l1, nl1, 0);
      kp = res1.kp;
      bmax = res1.bmax;

      if (bmax <= this.EPS && a[m + 2][1] < -this.EPS) {
        setIcase(-1);
        return;
      } else if (bmax <= this.EPS && a[m + 2][1] <= this.EPS) {
        const m12 = m1 + m2 + 1;
        if (m12 <= m) {
          for (let ip_test = m12; ip_test <= m; ip_test++) {
            if (iposv[ip_test] === ip_test + n) {
              const res_test = this.simp1(a, ip_test, l1, nl1, 1);
              if (res_test.bmax > this.EPS) {
                kp = res_test.kp;
                this.performPivot(a, m, n, l1, nl1, l2, nl2, l3, ip_test, kp, izrov, iposv, m1, true);
                continue;
              }
            }
          }
        }
        ir = 0;
        const m12_dec = m12 - 1;
        if (m1 + 1 <= m12_dec) {
          for (let i = m1 + 1; i <= m1 + m2; i++) {
            if (l3[i - m1] === 1) {
              for (let k = 1; k <= n + 1; k++) a[i + 1][k] *= -1.0;
            }
          }
        }
        this.doPhaseTwo(a, m, n, l1, nl1, l2, nl2, setIcase, izrov, iposv);
        return;
      }

      const res2 = this.simp2(a, m, n, l2, nl2, kp);
      ip = res2.ip;
      q1 = res2.q1;

      if (ip === 0) {
        setIcase(-1);
        return;
      }

      this.performPivot(a, m, n, l1, nl1, l2, nl2, l3, ip, kp, izrov, iposv, m1, true);
      if (ir === 0) {
        this.doPhaseTwo(a, m, n, l1, nl1, l2, nl2, setIcase, izrov, iposv);
        return;
      }
    }
  }

  private static doPhaseTwo(
    a: Matrix,
    m: number,
    n: number,
    l1: number[],
    nl1: number,
    l2: number[],
    nl2: number,
    setIcase: (val: number) => void,
    izrov: number[],
    iposv: number[]
  ) {
    while (true) {
      const res1 = this.simp1(a, 0, l1, nl1, 0);
      const kp = res1.kp;
      const bmax = res1.bmax;

      if (bmax <= this.EPS) {
        setIcase(0);
        return;
      }

      const res2 = this.simp2(a, m, n, l2, nl2, kp);
      const ip = res2.ip;

      if (ip === 0) {
        setIcase(1);
        return;
      }

      this.performPivot(a, m, n, l1, nl1, l2, nl2, [], ip, kp, izrov, iposv, 0, false);
    }
  }

  private static performPivot(
    a: Matrix,
    m: number,
    n: number,
    l1: number[],
    nl1: number,
    l2: number[],
    nl2: number,
    l3: number[],
    ip: number,
    kp: number,
    izrov: number[],
    iposv: number[],
    m1: number,
    isPhase1: boolean
  ) {
    this.simp3(a, isPhase1 ? m + 1 : m, n, ip, kp);

    if (isPhase1 && iposv[ip] >= n + m1 + (l3.length - 1) + 1) {
      let k_idx = -1;
      for (let k = 1; k <= nl1; k++) {
        if (l1[k] === kp) {
          k_idx = k;
          break;
        }
      }
      if (k_idx !== -1) {
        for (let is = k_idx; is < nl1; is++) l1[is] = l1[is + 1];
        nl1--; // Note: this change doesn't persist outside unless passed as object
      }
    } else if (isPhase1) {
      if (iposv[ip] >= n + m1 + 1) {
        const kh = iposv[ip] - m1 - n;
        if (l3[kh] === 1) {
          l3[kh] = 0;
          a[m + 2][kp + 1] += 1.0;
          for (let i = 1; i <= m + 2; i++) a[i][kp + 1] *= -1.0;
        }
      }
    }

    const is = izrov[kp];
    izrov[kp] = iposv[ip];
    iposv[ip] = is;
  }

  private static simp1(a: Matrix, mm: number, ll: number[], nll: number, iabf: number) {
    let kp = ll[1];
    let bmax = a[mm + 1][kp + 1];
    for (let k = 2; k <= nll; k++) {
      let test: number;
      if (iabf === 0) test = a[mm + 1][ll[k] + 1] - bmax;
      else test = Math.abs(a[mm + 1][ll[k] + 1]) - Math.abs(bmax);

      if (test > 0.0) {
        bmax = a[mm + 1][ll[k] + 1];
        kp = ll[k];
      }
    }
    return { kp, bmax };
  }

  private static simp2(a: Matrix, m: number, n: number, l2: number[], nl2: number, kp: number) {
    let ip = 0;
    let q1 = 0;
    let first = true;

    for (let i = 1; i <= nl2; i++) {
      const ii = l2[i];
      if (a[ii + 1][kp + 1] < -this.EPS) {
        const q = -a[ii + 1][1] / a[ii + 1][kp + 1];
        if (first || q < q1) {
          q1 = q;
          ip = ii;
          first = false;
        } else if (q === q1) {
          for (let k = 1; k <= n; k++) {
            const qp = -a[ip + 1][k + 1] / a[ip + 1][kp + 1];
            const q0 = -a[ii + 1][k + 1] / a[ii + 1][kp + 1];
            if (q0 !== qp) {
              if (q0 < qp) ip = ii;
              break;
            }
          }
        }
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
          if (kk - 1 !== kp) {
            a[ii][kk] -= a[ip + 1][kk] * factor;
          }
        }
        a[ii][kp + 1] = factor;
      }
    }
    for (let kk = 1; kk <= k1 + 1; kk++) {
      if (kk - 1 !== kp) {
        a[ip + 1][kk] *= -piv;
      }
    }
    a[ip + 1][kp + 1] = piv;
  }
}
