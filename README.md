# SwiftIq Finance

> **Quantitative Portfolio Stress Testing, Option Pricing & Risk Analytics Platform**

SwiftIq Finance transforms quantitative option pricing models into a full-scale portfolio risk platform. It allows users to construct multi-asset portfolios (Stocks, ETFs, Options, Cash) and analyze non-linear P&L, Greek exposures, and risk attribution under historical market crises and custom synthetic macroeconomic shocks.

---

## 🏛️ Architecture & Roadmap

The development follows a structured milestone path documented in [`workflow/`](./workflow/):
- **[Phase 0: Repository Audit](workflow/00_REPOSITORY_AUDIT.md)** — Comprehensive code, math, and model audit.
- **[V0: Quantitative Engine Stabilization](workflow/01_V0_QUANT_ENGINE_STABILIZATION.md)** — Pure domain layer, Brent IV root solver, Greek validation, and Crank-Nicolson PDE benchmarks.
- **[V1: Portfolio Stress Testing Platform](workflow/02_V1_PORTFOLIO_STRESS_TESTER.md)** — Multi-asset portfolio model, historical crisis replay (2008, 2020, 2022), and risk attribution waterfall.
- **[V2: Advanced Quantitative Risk Analytics](workflow/03_V2_ADVANCED_RISK_ANALYTICS.md)** — Historical VaR/ES, Monte Carlo simulations, and Copula tail dependence (Gaussian, Clayton, Gumbel).
- **[System Architecture & Data Spec](workflow/04_ARCHITECTURE_AND_DATA_SPEC.md)** — Target architecture, data provenance, and performance budgets.

---

## ⚡ Quick Start

### 1. Requirements
- **Node.js**: v18+ (v22 recommended)
- **Python**: 3.10+
- **MongoDB**: Local or remote connection URI

### 2. Installation

```bash
# Install frontend & API dependencies
npm install

# Install Python PDE microservice dependencies
python -m pip install fastapi uvicorn numpy pydantic
```

### 3. Environment Configuration
Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/stocks_app
BETTER_AUTH_SECRET=your_32_char_secret_key
BETTER_AUTH_URL=http://localhost:3000
PDE_SERVICE_URL=http://127.0.0.1:8001
FINNHUB_API_KEY=your_optional_finnhub_key
```

### 4. Running the Application

```bash
# Terminal 1: Start the Python PDE Quantitative Microservice
cd python
python -m uvicorn pde_service.main:app --host 127.0.0.1 --port 8001

# Terminal 2: Start the Next.js Frontend & API Engine
npm run dev
```

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Options Pricing Lab**: [http://localhost:3000/options](http://localhost:3000/options)
- **PDE OpenAPI Docs**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## 🔬 Supported Quantitative Models

| Model | Implementation | Method |
|---|---|---|
| **Black-Scholes** | TypeScript (`lib/finance/optionPricing.ts`) | Analytical closed-form with dividend yield |
| **Binomial Tree** | TypeScript (`lib/finance/optionPricing.ts`) | Cox-Ross-Rubinstein lattice |
| **Monte Carlo** | TypeScript (`lib/finance/optionPricing.ts`) | Geometric Brownian Motion with Euler-Maruyama |
| **PDE Crank-Nicolson** | Python (`python/pde_service/main.py`) | Semi-implicit finite difference with Thomas solver |

---

## 🛡️ License
Proprietary / Internal Research & Analytics Platform.
