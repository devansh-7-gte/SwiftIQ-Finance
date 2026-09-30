# V1: Portfolio Stress Testing Platform Specification

## Goal
Transform the stabilized quantitative engine into an intuitive, high-impact **Portfolio Stress Testing Platform** allowing users to construct hypothetical multi-asset portfolios (Stocks, ETFs, Options, Cash) and evaluate exact P&L and risk attribution under documented historical market crises and custom macroeconomic shocks.

---

## 1. Domain Models & Architecture

```
lib/quant/
├── portfolio/
│   ├── position.ts        # Position abstraction (Instrument, Quantity, CostBasis, Value, Weight)
│   ├── portfolio.ts       # Portfolio container & aggregation (TotalValue, Weights, Greeks roll-up)
│   └── valuation.ts       # Multi-asset position revaluation under base & stressed states
├── stress/
│   ├── scenarios.ts       # Predefined historical crisis scenario registry & definitions
│   ├── custom.ts          # Custom synthetic scenario generator (Equity %, Rates bps, Vol pts)
│   ├── factorMapping.ts   # Macro/Factor to asset shock mapping layer (Beta, Delta, Vega, Rate sensitivity)
│   └── revaluation.ts     # Portfolio stress replay & risk attribution engine
└── marketdata/
    ├── provider.ts        # MarketDataProvider interface
    ├── finnhub.ts         # Finnhub adapter (Quotes, Historical, Options, Profile)
    ├── fallback.ts        # Cached / Seeded realistic market data provider for offline/demo mode
    └── cache.ts           # In-memory & stale-while-revalidate caching layer
```

---

## 2. Multi-Asset Portfolio Abstraction

### Supported Instruments in V1:
1. **Equity / ETF Position**:
   - Fields: `symbol`, `quantity`, `currentPrice`, `currency`, `beta` (relative to SPY).
   - Valuation: $V_{\text{equity}} = \text{quantity} \times S$.
   - Stressed Valuation: $V'_{\text{equity}} = \text{quantity} \times S \times (1 + \Delta_{\text{shock}} \times \beta)$.
2. **Option Position**:
   - Fields: `underlyingSymbol`, `optionType` (Call/Put), `strike`, `expirationDate`, `quantity` (contracts $\times 100$), `impliedVol`, `underlyingPrice`, `riskFreeRate`, `dividendYield`.
   - Valuation: $V_{\text{option}} = \text{quantity} \times 100 \times \text{BS}(S, K, T, \sigma, r, q)$.
   - Stressed Valuation: Re-evaluated through the V0 pricing engine under shocked inputs $(S', \sigma', r', T')$.
3. **Cash Position**:
   - Fields: `amount`, `currency`. Unchanged by equity shocks; impacted only by currency/inflation scenarios if applicable.

---

## 3. Documented Historical Stress Scenarios

Every historical scenario will be documented with exact historical market dates, observed asset/factor movements, methodology, and data provenance:

| Scenario Name | Historical Window | Primary Market Drivers | Observed Shocks Mapped |
|---|---|---|---|
| **2008 Global Financial Crisis** | Sep 2008 – Nov 2008 (Lehman Collapse) | Broad equity collapse, credit freeze, surge in equity volatility | SPY: -38.0%, Tech: -35.0%, Financials: -55.0%, VIX: +45 vol pts, 10Y Yield: -150 bps |
| **2020 COVID-19 Liquidity Shock** | Feb 19, 2020 – Mar 23, 2020 | Sudden lockdown, cross-asset liquidation, historic vol spike | SPY: -34.0%, Oil: -55.0%, VIX: +52 vol pts, 10Y Yield: -100 bps, Gold: -4.0% |
| **2022 Inflation & Rate Hike Shock** | Jan 2022 – Jun 2022 | Rapid monetary tightening, bond market sell-off, tech compression | SPY: -20.5%, QQQ: -29.0%, TLT: -22.0%, 10Y Yield: +150 bps, VIX: +12 vol pts |
| **2011 US Debt Downgrade & Euro Crisis** | Jul 2011 – Aug 2011 | Sovereign debt crisis, extreme equity drawdown, gold rally | SPY: -16.5%, VIX: +24 vol pts, Gold: +14.0%, 10Y Yield: -80 bps |
| **1987 Black Monday Crash** | Oct 14, 1987 – Oct 19, 1987 | Historic single-day market plunge | SPY/S&P: -22.6%, VIX: +60 vol pts (equivalent), Short Rates: -50 bps |

---

## 4. Custom Synthetic Scenario Builder
Allows interactive, parameterized shock simulation:
- **Equities Shock**: Slider/Input $[-50\%, +50\%]$ (broad equity market movement).
- **Interest Rate Shock**: Slider/Input $[-300 \text{ bps}, +500 \text{ bps}]$ (parallel yield curve shift).
- **Volatility Shock**: Slider/Input $[-20 \text{ vol pts}, +60 \text{ vol pts}]$ (absolute change in $\sigma$).
- **Sector / Asset-Specific Overrides**: Option to shock individual positions independently.

---

## 5. Factor Mapping & Non-Linear Option Revaluation Engine

### Asset Mapping Logic:
1. **Equities / ETFs**:
   $$\Delta S_i = S_i \times (\Delta_{\text{market}} \times \beta_i + \text{SectorFactor}_i)$$
2. **Options Positions**:
   Under a stress scenario $(\Delta_{\text{market}}, \Delta_{\text{vol}}, \Delta_{\text{rates}}, \Delta t)$:
   $$S'_i = S_i \times (1 + \Delta S_i / S_i)$$
   $$\sigma'_i = \max(0.01, \sigma_i + \Delta_{\text{vol}})$$
   $$r'_i = \max(-0.02, r_i + \Delta_{\text{rates}})$$
   $$T'_i = \max(0, T_i - \Delta t)$$
   $$\text{Stressed Value} = \text{quantity} \times 100 \times \text{BS}(S'_i, K_i, T'_i, \sigma'_i, r'_i, q_i)$$
   $$\text{Option P\&L} = \text{Stressed Value} - \text{Base Value}$$

---

## 6. Risk Attribution & UI Dashboard Specification

### Visual Layout:
1. **Top Metric Ribbon**:
   - Baseline Portfolio Value ($)
   - Stressed Portfolio Value ($)
   - Absolute P&L ($\pm\$$)
   - Return Percentage ($\pm\%$)
2. **Loss Attribution & Contribution Waterfall**:
   - Breakdown of total portfolio dollar loss into position-by-position contributions ($P\&L_i = V'_i - V_i$).
   - Contribution % of total portfolio loss: $\text{Contrib}_i = \frac{P\&L_i}{\sum P\&L}$.
3. **Worst-Affected Holdings Table**:
   - Ranked list showing Position, Type, Base Value, Stressed Value, Dollar Impact, and Primary Loss Factor (e.g., Equity Delta vs Volatility Drop vs Theta Decay).
4. **Interactive Portfolio Builder**:
   - Quick search and add for Stocks, ETFs, and Options (Calls & Puts).
   - Instant quote lookup with timestamp and freshness badge ("15-min delayed" / "Real-time" / "Simulated").
   - Pre-loaded sample portfolios (e.g., *60/40 Equity-Bond*, *Tech Growth + Hedging Puts*, *Option Collar Strategy*).

---

## 7. V1 Exit Criteria
- [ ] Users can construct a multi-asset portfolio with Stocks, ETFs, and Options.
- [ ] Market quotes and option prices are retrieved seamlessly with transparent freshness metadata.
- [ ] Predefined historical crisis scenarios (2008, 2020, 2022, etc.) can be selected and executed in $< 50$ ms.
- [ ] Custom synthetic scenarios (Equity %, Vol points, Rate bps) revalue all positions dynamically.
- [ ] Non-linear option revaluation accurately captures Delta, Gamma, and Vega P&L.
- [ ] Risk attribution visualization clearly communicates where every dollar of gain/loss originates.
- [ ] End-to-end integration tests confirm calculations and UI stability.
