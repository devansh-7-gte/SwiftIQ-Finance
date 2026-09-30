# V2: Advanced Quantitative Risk Analytics Specification

## Goal
Advance the platform from scenario-based stress testing into a **Comprehensive Quantitative Risk & Dependence Engine**, delivering Historical Simulation, Monte Carlo Risk, Value-at-Risk (VaR), Expected Shortfall (CVaR), and Copula-based Tail Dependence modeling.

---

## 1. Quantitative Risk Pipeline Architecture

```mermaid
graph TD
    HistData[Historical Asset Returns Pipeline] --> RetClean[Date Alignment & Missing Data Cleaning]
    RetClean --> CovMat[Covariance & Correlation Estimation (Pearson / Spearman)]
    
    subgraph Non-Parametric Risk
        RetClean --> HistSim[Historical Simulation Engine]
        HistSim --> HistVaR[Historical VaR (95%, 99%)]
        HistSim --> HistES[Historical Expected Shortfall (95%, 99%)]
    end

    subgraph Parametric & Monte Carlo Risk
        CovMat --> MC_Sim[Cholesky / Multivariate Normal Engine]
        MC_Sim --> PortReval[Portfolio Non-Linear Revaluation]
        PortReval --> MC_VaR[Parametric & MC VaR / ES]
    end

    subgraph Dependence & Copula Engine
        RetClean --> Marginals[Empirical / Student-t Marginal CDF Estimation]
        Marginals --> Uniforms[Uniform Marginals (Probability Integral Transform)]
        Uniforms --> CopCalib[Copula Calibration (Gaussian, Clayton, Gumbel)]
        CopCalib --> CopSim[Joint Uniform Simulation from Copula]
        CopSim --> InvMarg[Inverse Marginal CDF Sampling]
        InvMarg --> CopVaR[Copula-conditioned Tail VaR & ES]
    end

    HistVaR --> RiskDash[Interactive Risk Dashboard]
    HistES --> RiskDash
    MC_VaR --> RiskDash
    CopVaR --> ResearchView[Model Comparison & Research View]
```

---

## 2. Core Quantitative Risk Metrics

### A. Historical Return Pipeline (`lib/quant/risk/returns.ts`)
- Configurable lookback windows ($252$, $504$, $1260$ trading days).
- Geometric vs log returns: $r_t = \ln(P_t / P_{t-1})$.
- Date alignment using calendar intersection; forward-filling for non-trading holidays.

### B. Correlation & Regime Shift Analysis (`lib/quant/risk/correlation.ts`)
- **Pearson Linear Correlation**: Standard linear co-movement $\rho = \frac{\text{Cov}(X,Y)}{\sigma_X \sigma_Y}$.
- **Spearman Rank Correlation**: Monotonic relationship robust to non-linearities and extreme outliers.
- **Regime Comparison**: Interactive matrix comparison of *Calm Market Regime* (e.g., 2017) vs *Crisis Regime* (e.g., 2008 or March 2020) displaying breakdown of diversification.

### C. Value-at-Risk (VaR) & Expected Shortfall (ES / CVaR)
- **Value-at-Risk**:
  $$\text{VaR}_\alpha = - F_L^{-1}(1 - \alpha)$$
  Where $F_L$ is the cumulative distribution function of portfolio losses.
  - Standard horizons: 1-Day, 10-Day (scaled via square root of time $\sqrt{10}$ for linear assets or direct multi-step paths).
  - Confidence levels: $95\%$ and $99\%$.
- **Expected Shortfall / Conditional VaR (CVaR)**:
  $$\text{ES}_\alpha = \mathbb{E}[L \mid L \ge \text{VaR}_\alpha] = \frac{1}{1 - \alpha} \int_\alpha^1 \text{VaR}_u \, du$$
  - Measures the average tail loss given that the VaR threshold has been breached.
  - Sub-additive, coherent risk measure (satisfies Artzner axioms).

---

## 3. Copula Dependence & Tail Modeling (`lib/quant/dependence/copulas.ts`)

### A. Motivation & Mathematical Theory
Sklar's Theorem states that any multivariate cumulative distribution $F(x_1, \dots, x_d)$ can be expressed in terms of its univariate marginal distributions $F_i(x_i)$ and a copula $C$:
$$F(x_1, \dots, x_d) = C(F_1(x_1), \dots, F_d(x_d))$$

In financial crises, asset correlations often spike downward (asymmetric lower tail dependence). Standard Gaussian models fail to capture this joint crash behavior.

### B. Supported Copula Families:
1. **Gaussian Copula**:
   - $C_{\Sigma}^{\text{Gauss}}(u) = \Phi_\Sigma(\Phi^{-1}(u_1), \dots, \Phi^{-1}(u_d))$
   - **Tail Dependence**: $\lambda_L = \lambda_U = 0$ (asymptotically independent tails).
2. **Clayton Copula (Lower Tail Dependence)**:
   - $C_\theta^{\text{Clayton}}(u) = \left( \sum_{i=1}^d u_i^{-\theta} - d + 1 \right)^{-1/\theta}, \quad \theta > 0$
   - **Lower Tail Dependence**: $\lambda_L = 2^{-1/\theta} > 0$ (strong joint crash clustering).
   - **Upper Tail Dependence**: $\lambda_U = 0$.
3. **Gumbel Copula (Upper Tail Dependence)**:
   - $C_\theta^{\text{Gumbel}}(u) = \exp\left( - \left[ \sum_{i=1}^d (-\ln u_i)^\theta \right]^{1/\theta} \right), \quad \theta \ge 1$
   - **Upper Tail Dependence**: $\lambda_U = 2 - 2^{1/\theta} > 0$ (strong joint boom clustering).

### C. Simulation & Calibration Workflow:
1. Estimate marginal empirical CDFs $\hat{F}_i(x)$ using kernel density smoothing or rank transform.
2. Transform historical returns into pseudo-observations $U_i = \hat{F}_i(X_i) \in [0, 1]$.
3. Fit copula parameters $\theta$ via Maximum Pseudo-Likelihood (MPLE) or Kendall's $\tau$ inversion.
4. Generate $M = 50,000$ joint uniform samples $(u_1^{(k)}, \dots, u_d^{(k)})$.
5. Invert back to return space: $r_i^{(k)} = \hat{F}_i^{-1}(u_i^{(k)})$.
6. Revalue portfolio and compute full simulated P&L tail distributions.

---

## 4. Visualizations in V2 Risk Dashboard
1. **Simulated P&L Distribution Histogram**:
   - Kernel density overlay, interactive vertical lines for $\text{VaR}_{95}$, $\text{VaR}_{99}$, and shaded Expected Shortfall tail region.
2. **Correlation Heatmap & Regime Differencing**:
   - Toggle between Calm, Crisis, and Difference ($\Delta \rho$) matrices.
3. **Model Comparison Research Table**:
   - Side-by-side comparison of 99% VaR & 99% ES across **Historical**, **Gaussian Monte Carlo**, **Clayton Copula**, and **Gumbel Copula**.
4. **Tail Scatter Plots**:
   - Bivariate uniform scatter plots comparing simulated joint tail realizations across copula models.

---

## 5. Performance & Safety Guardrails
- **Fast Revaluation Vectorization**: For portfolios with options, use full Black-Scholes vectorization or Delta-Gamma approximations for small shocks; never execute expensive PDE grids inside Monte Carlo loops.
- **Strict Web Worker / Asynchronous Computation**: Monte Carlo and Copula calibrations run in background workers to keep UI frame rate at 60 FPS.
- **Financial Safety Disclaimers**: Explicitly state model assumptions and clarify that statistical risk models quantify distribution properties under stated assumptions, not absolute guarantees.
