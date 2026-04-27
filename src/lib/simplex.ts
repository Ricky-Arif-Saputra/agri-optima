// src/lib/simplex.ts
export type Matrix = number[][];

export interface SimplexResult {
    maxValue: number;
    solutions: number[];
    status: 'optimal' | 'unbounded' | 'no-solution' | 'error';
}

export class SimplexSolver {
    private static EPS = 1e-6;

    public static solve(n: number, m1: number, m2: number, m3: number, a: Matrix): SimplexResult {
        const m = m1 + m2 + m3;
        const iposv = new Array(m + 1).fill(0);
        const izrov = new Array(n + 1).fill(0);
        let icase = 0;

        this.simplx(a, m, n, m1, m2, m3, (v) => icase = v, izrov, iposv);

        if (icase === 0) {
            const solutions = new Array(n).fill(0);
            for (let i = 1; i <= n; i++) {
                let found = false;
                for (let j = 1; j <= m; j++) {
                    if (iposv[j] === i) {
                        solutions[i - 1] = a[j + 1][1];
                        found = true;
                        break;
                    }
                }
                if (!found) solutions[i - 1] = 0;
            }
            return { maxValue: a[1][1], solutions, status: 'optimal' };
        } 
        return { maxValue: 0, solutions: [], status: icase === 1 ? 'unbounded' : 'no-solution' };
    }

    private static simplx(a: Matrix, m: number, n: number, m1: number, m2: number, m3: number, setIcase: (v: number) => void, izrov: number[], iposv: number[]) {
        let i, ip, ir, is, k, kh, kp, m12, nl1, nl2;
        const l1: number[] = [], l2: number[] = [], l3: number[] = [];
        let bmax: number = 0, q1: number = 0;

        nl1 = n;
        for (k = 1; k <= n; k++) { l1[k] = k; izrov[k] = k; }
        nl2 = m;
        for (i = 1; i <= m; i++) {
            l2[i] = i;
            iposv[i] = n + i;
        }
        for (i = 1; i <= m2; i++) l3[i] = 1;

        ir = 0;
        if (m2 + m3 !== 0) {
            ir = 1;
            for (k = 1; k <= n + 1; k++) {
                q1 = 0.0;
                for (i = m1 + 1; i <= m; i++) q1 += a[i + 1][k];
                a[m + 2][k] = -q1;
            }
        } else {
            this.doPhaseTwo(a, m, n, l1, nl1, l2, nl2, setIcase, izrov, iposv);
            return;
        }

        // Phase 1
        while (true) {
            const s1 = this.simp1(a, m + 1, l1, nl1, 0);
            kp = s1.kp; bmax = s1.bmax;

            if (bmax <= this.EPS && a[m + 2][1] < -this.EPS) { setIcase(-1); return; }
            else if (bmax <= this.EPS && a[m + 2][1] <= this.EPS) {
                m12 = m1 + m2 + 1;
                if (m12 <= m) {
                    for (ip = m12; ip <= m; ip++) {
                        if (iposv[ip] === ip + n) {
                            const s1b = this.simp1(a, ip, l1, nl1, 1);
                            if (s1b.bmax > this.EPS) {
                                kp = s1b.kp;
                                this.pivot(a, m, n, l1, nl1, l2, nl2, l3, ip, kp, izrov, iposv, m1, true);
                                continue;
                            }
                        }
                    }
                }
                ir = 0;
                this.doPhaseTwo(a, m, n, l1, nl1, l2, nl2, setIcase, izrov, iposv);
                return;
            }

            const s2 = this.simp2(a, m, n, l2, nl2, kp);
            ip = s2.ip; q1 = s2.q1;
            if (ip === 0) { setIcase(-1); return; }

            this.pivot(a, m, n, l1, nl1, l2, nl2, l3, ip, kp, izrov, iposv, m1, true);
            if (ir === 0) {
                this.doPhaseTwo(a, m, n, l1, nl1, l2, nl2, setIcase, izrov, iposv);
                return;
            }
        }
    }

    private static doPhaseTwo(a: Matrix, m: number, n: number, l1: number[], nl1: number, l2: number[], nl2: number, setIcase: (v: number) => void, izrov: number[], iposv: number[]) {
        while (true) {
            const s1 = this.simp1(a, 0, l1, nl1, 0);
            if (s1.bmax <= this.EPS) { setIcase(0); return; }
            const s2 = this.simp2(a, m, n, l2, nl2, s1.kp);
            if (s2.ip === 0) { setIcase(1); return; }
            this.pivot(a, m, n, l1, nl1, l2, nl2, [], s2.ip, s1.kp, izrov, iposv, 0, false);
        }
    }

    private static simp1(a: Matrix, mm: number, ll: number[], nll: number, iabf: number) {
        let kp = ll[1];
        let bmax = a[mm + 1][kp + 1];
        for (let k = 2; k <= nll; k++) {
            let test = (iabf === 0) ? (a[mm + 1][ll[k] + 1] - bmax) : (Math.abs(a[mm + 1][ll[k] + 1]) - Math.abs(bmax));
            if (test > 0.0) { bmax = a[mm + 1][ll[k] + 1]; kp = ll[k]; }
        }
        return { kp, bmax };
    }

    private static simp2(a: Matrix, m: number, n: number, l2: number[], nl2: number, kp: number) {
        let ip = 0; let q1 = Infinity;
        for (let i = 1; i <= nl2; i++) {
            const ii = l2[i];
            if (a[ii + 1][kp + 1] < -this.EPS) {
                const q = -a[ii + 1][1] / a[ii + 1][kp + 1];
                if (q < q1) { q1 = q; ip = ii; }
            }
        }
        return { ip, q1 };
    }

    private static pivot(a: Matrix, m: number, n: number, l1: number[], nl1: number, l2: number[], nl2: number, l3: number[], ip: number, kp: number, izrov: number[], iposv: number[], m1: number, isPhase1: boolean) {
        this.simp3(a, isPhase1 ? m + 1 : m, n, ip, kp);
        let is = izrov[kp];
        izrov[kp] = iposv[ip];
        iposv[ip] = is;
    }

    private static simp3(a: Matrix, i1: number, k1: number, ip: number, kp: number) {
        const piv = 1.0 / a[ip + 1][kp + 1];
        for (let ii = 1; ii <= i1 + 1; ii++) {
            if (ii - 1 !== ip) {
                a[ii][kp + 1] *= piv;
                for (let kk = 1; kk <= k1 + 1; kk++) {
                    if (kk - 1 !== kp) a[ii][kk] -= a[ip + 1][kk] * a[ii][kp + 1];
                }
            }
        }
        for (let kk = 1; kk <= k1 + 1; kk++) {
            if (kk - 1 !== kp) a[ip + 1][kk] *= -piv;
        }
        a[ip + 1][kp + 1] = piv;
    }
}