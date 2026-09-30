# V0: Quantitative Engine Stabilization Plan

## Goal
Transform the existing scattered, untested quantitative calculations into a battle-tested, modular, and reusable **Domain Quantitative Layer** with 100% test validation.

---

## 1. Domain Layer Restructuring
Create a pure domain layer within `lib/quant/` that has **zero dependencies** on React, HTTP, UI, or databases.

```
lib/quant/
├── core/
│   ├── math.ts            # High-precision normal CDF, PDF, erf, invNormCdf (Acklam / Beasley-Springer-Moro)
│   └── types.ts           # Pure quant inputs/outputs (PricingInputs, GreekSet, OptionContract)
├── pricing/
│   ├── blackScholes.ts    # Robust European analytical pricing & exact boundary asymptotics
│   ├── binomial.ts        # CRR Tree with explicit European vs American flags
│   ├── monteCarlo.ts      # Fast vectorized/antithetic GBM simulation
│   └── iv.ts              # Robust Implied Volatility Solver (Brent's Method + Bisection fallback)
├── risk/
│   ├── greeks.ts          # Analytical Greeks + Finite-Difference validation harness
│   └── sensitivities.ts   # Higher-order risk metrics (Vanna, Volga, Charm)
└── instruments/
    ├── option.ts          # Option contract domain model
    ├── equity.ts          # Equity / ETF instrument model
    └── cash.ts            # Cash & equivalent instrument model
```

---

## 2. Core Quantitative Enhancements

### A. High-Precision Math & Boundary Handling
- Replace Abramowitz-Stegun polynomial with high-precision double arithmetic ($< 10^{-15}$ error).
- Add high-precision inverse normal CDF (`invNormCdf`) essential for Monte Carlo, historical VaR, and Copula transformations.
- **Asymptotic Expiry Limits**: Remove artificial 1-day floor. When $T \to 0$:
  $$\lim_{T \to 0} C = \max(S - K, 0), \quad \lim_{T \to 0} P = \max(K - S, 0)$$
  $$\lim_{\sigma \to 0} C = e^{-q T} \max(S - K e^{-(r-q)T}, 0)$$

### B. Standard Analytical Greeks & Unit Standardization
- Standardize all Greek definitions across the engine:
  - **Delta**: $\partial V / \partial S$ (dimensionless)
  - **Gamma**: $\partial^2 V / \partial S^2$ (per \$ spot change)
  - **Vega**: $\partial V / \partial \sigma$ (per 1% / 0.01 vol shock: $\frac{1}{100} \frac{\partial V}{\partial \sigma}$)
  - **Theta**: $-\partial V / \partial t$ (per calendar day: $\frac{1}{365} \frac{\partial V}{\partial t}$)
  - **Rho**: $\partial V / \partial r$ (per 1% / 100 bps rate shock: $\frac{1}{100} \frac{\partial V}{\partial r}$)

### C. Robust Implied Volatility Solver (`lib/quant/pricing/iv.ts`)
- Implement **Brent's root-finding method** bounded in $[10^{-4}, 10.0]$ ($0.01\%$ to $1000\%$).
- Implement **Bisection** fallback for ill-conditioned or discontinuous boundaries.
- Provide optional **Newton-Raphson** fast-path with Vega derivative checks.
- Enforce strict arbitrage bounds before solving:
  $$C_{\text{min}} = \max(0, S e^{-q T} - K e^{-r T}) \le C_{\text{market}} < S e^{-q T}$$
  $$P_{\text{min}} = \max(0, K e^{-r T} - S e^{-q T}) \le P_{\text{market}} < K e^{-r T}$$
  If price violates bounds, return a structured error with failure reason rather than silent failure.

### D. Crank-Nicolson PDE Bug Fixes & Stabilization (`python/pde_service/main.py`)
- Fix the Theta Greek bug: evaluate temporal difference between $\tau = T - \Delta\tau$ and $\tau = T$.
- Optimize the Thomas algorithm tridiagonal solver.
- Document Crank-Nicolson known boundaries, convergence rates, and limitations against Black-Scholes.

---

## 3. Comprehensive Quantitative Test Suite
Establish a quantitative test suite (e.g., using Vitest / Node test runner and Pytest):

1. **Analytical Benchmark Tests**:
   - Verify Black-Scholes outputs against standard quantitative literature benchmarks (e.g., Haug 2007, Hull).
2. **Put-Call Parity Invariant**:
   - $C(S, K, T, r, q, \sigma) - P(S, K, T, r, q, \sigma) = S e^{-q T} - K e^{-r T}$ across 1,000 random parameter combinations ($S \in [1, 2000]$, $K \in [1, 2000]$, $T \in [0.001, 5]$, $\sigma \in [0.01, 2.5]$, $r \in [-0.02, 0.20]$).
3. **Analytical Greeks vs Finite-Difference Approximations**:
   - Validate that analytical $\Delta, \Gamma, \mathcal{V}, \Theta, \rho$ match central finite differences within $10^{-4}$ tolerance.
4. **Implied Volatility Inversion Round-Trip**:
   - For arbitrary $\sigma_{\text{true}}$, assert:
     $$\left| \text{BS}(\text{IV}(\text{BS}(\sigma_{\text{true}}))) - \text{BS}(\sigma_{\text{true}}) \right| < 10^{-7}$$
5. **Crank-Nicolson Convergence Test**:
   - Verify that Crank-Nicolson price converges to Black-Scholes analytical price at rate $\mathcal{O}(\Delta S^2 + \Delta \tau^2)$ as grid resolution increases.
6. **Edge Cases**:
   - Deep ITM ($S/K \gg 1$), Deep OTM ($S/K \ll 1$), near-zero expiry ($T = 10^{-5}$), ultra-high volatility ($\sigma = 5.0$), negative interest rates ($r = -0.01$).

---

## 4. V0 Exit Criteria
- [ ] Pure quant module in `lib/quant/` is completely isolated from UI, Next.js server context, and network requests.
- [ ] Black-Scholes analytical pricer and all 5 Greeks fully validated.
- [ ] Implied Volatility Brent solver implemented and tested with 100% round-trip accuracy.
- [ ] PDE service Theta calculation corrected and verified against analytical Theta.
- [ ] Automated test suite runs with 100% pass rate.
