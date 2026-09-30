# Architecture, Data Specification & Implementation Roadmap

## 1. Target System Architecture

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    Presentation Tier                   │
                               │  (Next.js App Router, Tailwind CSS v4, Radix, Lucide)   │
                               └─────────────────────────┬──────────────────────────────┘
                                                         │
               ┌──────────────────────┬──────────────────┴────────────────┬──────────────────────┐
               ▼                      ▼                                   ▼                      ▼
      ┌─────────────────┐   ┌───────────────────┐               ┌──────────────────┐   ┌──────────────────┐
      │Portfolio Builder│   │  Stress Dashboard │               │  Risk Dashboard  │   │  Research & Lab  │
      │ (Multi-Asset UI)│   │ (Historical/Cust) │               │ (VaR/ES/Distrib) │   │(PDE / Copula Cmp)│
      └────────┬────────┘   └─────────┬─────────┘               └────────┬─────────┘   └────────┬─────────┘
               │                      │                                  │                      │
               └──────────────────────┼──────────────────────────────────┴──────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   API & Application Tier  │
                        │ (Next.js Server Actions / │
                        │      Route Handlers)      │
                        └─────────────┬─────────────┘
                                      │
               ┌──────────────────────┼──────────────────────┐
               ▼                      ▼                      ▼
      ┌─────────────────┐   ┌───────────────────┐  ┌───────────────────┐
      │Portfolio Service│   │Stress Test Service│  │Risk Engine Service│
      └────────┬────────┘   └─────────┬─────────┘  └─────────┬─────────┘
               │                      │                      │
               └──────────────────────┼──────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ Pure Quantitative Engine  │
                        │      (`lib/quant/*`)      │
                        └─────────────┬─────────────┘
                                      │
         ┌─────────────────┬──────────┴────────┬──────────────────┬─────────────────┐
         ▼                 ▼                   ▼                  ▼                 ▼
   ┌───────────┐     ┌───────────┐       ┌───────────┐      ┌───────────┐     ┌───────────┐
   │  Pricing  │     │   Greeks  │       │  Stress & │      │Monte Carlo│     │Dependence │
   │(BS,Binom, │     │(Analytic, │       │  Factor   │      │ & VaR/ES  │     │& Copulas  │
   │ IV Solver)│     │  Sensit.) │       │  Mapping  │      │  Engine   │     │(Gaus,Clay)│
   └───────────┘     └───────────┘       └───────────┘      └───────────┘     └───────────┘
                                               │
                                               ▼
                                 ┌───────────────────────────┐
                                 │   Market Data Provider    │
                                 │(Finnhub + Offline Fallback│
                                 │       + Rate Cache)       │
                                 └───────────────────────────┘
```

---

## 2. Directory Layout Migration Strategy

The application directory `SwiftIq_Finance` will be progressively refactored into a clear modular structure:

```
SwiftIq_Finance/
├── app/
│   ├── (root)/
│   │   ├── page.tsx                     # Main Dashboard / Risk Overview
│   │   ├── portfolio/page.tsx           # Portfolio Builder & Allocation
│   │   ├── stress/page.tsx              # Historical & Custom Stress Testing
│   │   ├── risk/page.tsx                # VaR, Expected Shortfall, Distribution
│   │   ├── research/page.tsx            # Copula comparison, PDE bench, Model Diagnostics
│   │   └── options/page.tsx             # Legacy Options Lab (preserved)
│   └── api/
│       ├── marketdata/route.ts          # Unified Market Data Endpoints
│       ├── stress/route.ts              # Stress Execution API
│       └── risk/route.ts                # Risk Analytics API
├── components/
│   ├── portfolio/                       # Portfolio builder components
│   ├── stress/                          # Stress test visualizations & tables
│   ├── risk/                            # VaR distributions, correlation heatmaps
│   ├── research/                        # Copula plots, PDE diagnostics
│   └── ui/                              # Radix base design system
├── lib/
│   ├── quant/                           # Pure quantitative engine (Zero external UI/HTTP dependencies)
│   │   ├── core/                        # High-precision math, types
│   │   ├── pricing/                     # Black-Scholes, Binomial, IV solver
│   │   ├── risk/                        # Greeks, VaR, Expected Shortfall, Correlation
│   │   ├── stress/                      # Historical scenarios, factor mapping, revaluation
│   │   ├── simulation/                  # Monte Carlo GBM, Cholesky multivariate generator
│   │   └── dependence/                  # Sklar copulas (Gaussian, Clayton, Gumbel)
│   └── marketdata/                      # Provider abstraction, Finnhub adapter, fallback cache
├── python/
│   └── pde_service/                     # Python PDE benchmark service (Fixed Theta + SciPy speedups)
└── tests/
    ├── unit/                            # Pure quant math, Black-Scholes, Greeks, IV, VaR, Copula tests
    ├── integration/                     # Portfolio stress revaluation, Market Data caching
    └── fixtures/                        # Golden test vectors (Hull benchmarks, known crises)
```

---

## 3. Data Classification & Provenance Architecture

To prevent data contamination and ensure regulatory/audit integrity, data is strictly separated into four categories:

```
┌─────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  ┌──────────────────────┐
│   MARKET DATA   │  │ MODEL-DERIVED DATA   │  │     USER DATA     │  │    SCENARIO DATA     │
├─────────────────┤  ├──────────────────────┤  ├───────────────────┤  ├──────────────────────┤
│ - Spot Quotes   │  │ - Fair Values        │  │ - Portfolio Comps │  │ - Crisis Dates       │
│ - Historical Pr │  │ - Greeks             │  │ - Position Sizes  │  │ - Observed Returns   │
│ - Option Chains │  │ - Implied Volatility │  │ - Cost Bases      │  │ - Factor Shocks      │
│ - Risk-Free Rt  │  │ - VaR / ES Estimates │  │ - User Overrides  │  │ - Methodology Specs  │
│ - Provenance:   │  │ - Provenance:        │  │ - Provenance:     │  │ - Provenance:        │
│   Timestamp,    │  │   Model ID, Config,  │  │   Browser Storage │  │   Academic/Historical│
│   Provider, TTL │  │   Error Bounds       │  │   (or MongoDB)    │  │   Metadata Registry  │
└─────────────────┘  └──────────────────────┘  └───────────────────┘  └──────────────────────┘
```

---

## 4. Performance Budget & Computational Tiers

| Tier | Calculations | Target Latency | Optimization Technique |
|---|---|---|---|
| **Tier 1 (Instant)** | Black-Scholes, Greeks, Portfolio aggregation, Historical shocks | $< 10 \text{ ms}$ | Pure double arithmetic, direct vectorization |
| **Tier 2 (Interactive)** | Historical VaR/ES, Correlation matrices, Custom factor shock | $< 100 \text{ ms}$ | Linear algebra transforms, typed arrays |
| **Tier 3 (Medium)** | 50,000-path Monte Carlo, Copula parameter calibration | $< 500 \text{ ms}$ | Vectorized NumPy/TS Web Workers, antithetic variates |
| **Tier 4 (Expensive)** | Crank-Nicolson PDE grid sweeps, Multi-asset copula fitting | $< 2.0 \text{ s}$ | Background execution, SciPy banded solvers, LRU caching |

---

## 5. Security, Safety, and Compliance Checkpoints
1. **API Keys & Secrets**: `FINNHUB_API_KEY` strictly kept in server environment (`process.env`), never exposed to frontend client bundles.
2. **Input Validation**: Strict Zod schemas on all API endpoints; clamping bounds on all numerical inputs to prevent NaN/Infinity propagation.
3. **No Financial Guarantees**: UI embeds clear disclaimer: *"Portfolio Stress Testing & Risk Analytics are theoretical approximations based on historical and synthetic modeling assumptions. Past crisis behavior is not a guarantee of future outcomes."*
