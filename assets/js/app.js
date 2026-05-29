function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number.isFinite(value) ? value : 0);
}

function preencherDataAtual() {
  const dataAtual = new Date();
  const dia = String(dataAtual.getDate()).padStart(2, '0');
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
  const ano = dataAtual.getFullYear();
  const dataFormatada = `${ano}-${mes}-${dia}`;
  const campo = document.getElementById('dataConsulta');
  if (campo && !campo.value) {
    campo.value = dataFormatada;
    campo.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

window.addEventListener('load', preencherDataAtual);

function observarIntroducao(selector, readyClass, activeClass, threshold = 0.22, iniciarAgora = false) {
  const section = document.querySelector(selector);
  if (!section) return;

  section.classList.add(readyClass);

  if (iniciarAgora) {
    section.classList.add(activeClass);
    return;
  }

  if (!('IntersectionObserver' in window)) {
    section.classList.add(activeClass);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      section.classList.add(activeClass);
      observer.unobserve(section);
    });
  }, {
    threshold
  });

  observer.observe(section);
}

function animarNumerosResumo() {
  const stats = document.querySelector('.clarity-stats');
  if (!stats) return;

  const numbers = Array.from(stats.querySelectorAll('strong')).map((item) => {
    const original = item.textContent.trim();
    const match = original.match(/^(\d+)(.*)$/);

    if (!match) return null;

    item.dataset.finalValue = match[1];
    item.dataset.suffix = match[2] || '';
    item.textContent = `0${item.dataset.suffix}`;
    return item;
  }).filter(Boolean);

  const run = () => {
    stats.classList.add('stats-in-view');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      numbers.forEach((item) => {
        item.textContent = `${item.dataset.finalValue}${item.dataset.suffix || ''}`;
      });
      return;
    }

    numbers.forEach((item, index) => {
      const target = Number(item.dataset.finalValue);
      const suffix = item.dataset.suffix || '';
      const duration = 1100;
      const delay = index * 100;
      const start = performance.now() + delay;

      const tick = (now) => {
        const progress = Math.min(Math.max((now - start) / duration, 0), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);

        item.textContent = `${current}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    });
  };

  stats.classList.add('stats-ready');

  if (!('IntersectionObserver' in window)) {
    run();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      run();
      observer.unobserve(stats);
    });
  }, {
    threshold: 0.35
  });

  observer.observe(stats);
}

function prepararAnimacoesIntroducao() {
  observarIntroducao('.hero-section', 'hero-ready', 'hero-in-view', 0.18, true);
  observarIntroducao('.tools-preview', 'tools-ready', 'tools-in-view', 0.24);
  observarIntroducao('.features-section', 'features-ready', 'features-in-view', 0.22);
  observarIntroducao('.workflow-section', 'workflow-ready', 'workflow-in-view', 0.24);
  observarIntroducao('.clarity-section', 'clarity-ready', 'clarity-in-view', 0.24);
  observarIntroducao('.final-cta-section', 'cta-ready', 'cta-in-view', 0.24);
  animarNumerosResumo();
}

window.addEventListener('DOMContentLoaded', prepararAnimacoesIntroducao);

const CREDIT_STATE = {
  lastSaldoDevedor: null,
  loanAmountAutoFilled: false,
  autoTimers: new Map()
};

function $(selector) {
  return document.querySelector(selector);
}

function byId(id) {
  return document.getElementById(id);
}

function debounce(key, callback, delay = 350) {
  if (CREDIT_STATE.autoTimers.has(key)) {
    clearTimeout(CREDIT_STATE.autoTimers.get(key));
  }
  const timer = setTimeout(callback, delay);
  CREDIT_STATE.autoTimers.set(key, timer);
}

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return NaN;

  const raw = String(value)
    .trim()
    .replace(/\s/g, '')
    .replace(/R\$/gi, '');

  if (!raw) return NaN;

  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');

  let normalized = raw;

  if (lastComma >= 0 && lastDot >= 0) {
    // Aceita tanto padrão brasileiro (1.234,56) quanto internacional (1,234.56).
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = raw
      .split(thousandSeparator).join('')
      .replace(decimalSeparator, '.');
  } else if (lastComma >= 0) {
    // Ex.: 524,18
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if (lastDot >= 0) {
    const dotCount = (raw.match(/\./g) || []).length;
    const decimals = raw.length - lastDot - 1;

    // Ex.: 1.234.567 vira 1234567; 524.18 continua 524.18.
    if (dotCount > 1 || decimals === 3) {
      normalized = raw.replace(/\./g, '');
    }
  }

  return Number.parseFloat(normalized);
}

function roundTo(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function readNumber(id) {
  const el = byId(id);
  return el ? parseNumber(el.value) : NaN;
}

function readInteger(id) {
  const value = readNumber(id);
  return Number.isFinite(value) ? Math.trunc(value) : NaN;
}

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value, digits = 2) {
  return `${Number.isFinite(value) ? value.toFixed(digits).replace('.', ',') : '0,00'}%`;
}

function setHTML(id, html) {
  const el = byId(id);
  if (el) el.innerHTML = html;
}

function resultCard(label, value, detail = '') {
  return `
    <span class="result-label">${label}</span>
    <strong class="result-value">${value}</strong>
    ${detail ? `<small class="result-detail">${detail}</small>` : ''}
  `;
}

function showFieldError(id, message) {
  setHTML(id, `
    <span class="result-label">Aguardando dados</span>
    <strong class="result-value result-muted">${message}</strong>
  `);
}

function parseDateInput(id) {
  const el = byId(id);
  if (!el || !el.value) return null;
  const [year, month, day] = el.value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatInputDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

function preencherDataAtual() {
  const campo = byId('dataConsulta');
  if (campo && !campo.value) campo.value = formatInputDate(new Date());
}

function addMonthsKeepingDay(baseDate, months) {
  const target = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const originalDay = target.getDate();
  target.setMonth(target.getMonth() + months);

  if (target.getDate() !== originalDay) {
    target.setDate(0);
  }

  return target;
}

function countPaidInstallments(firstDueDate, consultDate, totalInstallments) {
  if (!firstDueDate || !consultDate || !Number.isFinite(totalInstallments)) {
    return { parcelasPagas: 0, parcelasRestantes: Math.max(0, totalInstallments || 0) };
  }

  let paid = 0;

  for (let i = 0; i < totalInstallments; i += 1) {
    const installmentDate = addMonthsKeepingDay(firstDueDate, i);
    if (installmentDate <= consultDate) paid += 1;
  }

  const parcelasPagas = Math.max(0, Math.min(paid, totalInstallments));
  const parcelasRestantes = Math.max(0, totalInstallments - parcelasPagas);

  return { parcelasPagas, parcelasRestantes };
}

function presentValueFromPayment(payment, installments, monthlyRate) {
  if (!Number.isFinite(payment) || !Number.isFinite(installments)) return NaN;
  if (monthlyRate === 0) return payment * installments;
  return payment * (1 - Math.pow(1 + monthlyRate, -installments)) / monthlyRate;
}

function estimateMonthlyRate({ principal, payment, installments }) {
  if (!principal || !payment || !installments) return NaN;
  if (Math.abs(payment * installments - principal) < 0.01) return 0;

  const minPayment = principal / installments;
  if (payment < minPayment) return NaN;
  if (payment === minPayment) return 0;

  let low = 0;
  let high = 1; // 100% a.m.

  // Expande o limite superior quando a parcela exigir uma taxa extrema.
  for (let guard = 0; guard < 20 && presentValueFromPayment(payment, installments, high) > principal; guard += 1) {
    high *= 2;
  }

  for (let i = 0; i < 120; i += 1) {
    const mid = (low + high) / 2;
    const pv = presentValueFromPayment(payment, installments, mid);

    if (pv > principal) low = mid;
    else high = mid;
  }

  return (low + high) / 2;
}

function getSaldoInputs() {
  return {
    numParcelas: readInteger('numParcelas'),
    valorParcela: readNumber('valorParcela'),
    valorTotal: readNumber('valorTotal'),
    dataEmprestimo: parseDateInput('dataEmprestimo'),
    dataConsulta: parseDateInput('dataConsulta')
  };
}

function hasSaldoMinimumData() {
  const data = getSaldoInputs();
  return Number.isFinite(data.numParcelas) && data.numParcelas > 0 &&
    Number.isFinite(data.valorParcela) && data.valorParcela > 0 &&
    Number.isFinite(data.valorTotal) && data.valorTotal > 0 &&
    data.dataEmprestimo && data.dataConsulta;
}

function calcularTaxaJuros() {
  const { numParcelas, valorParcela, valorTotal } = getSaldoInputs();

  if (!Number.isFinite(numParcelas) || numParcelas <= 0 || !Number.isFinite(valorParcela) || valorParcela <= 0 || !Number.isFinite(valorTotal) || valorTotal <= 0) {
    showFieldError('resultado1', 'Preencha parcelas, valor da parcela e valor total.');
    return NaN;
  }

  const taxaMensal = estimateMonthlyRate({
    principal: valorTotal,
    payment: valorParcela,
    installments: numParcelas
  });

  if (!Number.isFinite(taxaMensal)) {
    showFieldError('resultado1', 'Não foi possível estimar a taxa.');
    return NaN;
  }

  setHTML('resultado1', resultCard(
    'Juros aproximados',
    `${formatPercent(taxaMensal * 100)} a.m.`,
    'Estimativa calculada a partir dos dados do contrato.'
  ));

  return taxaMensal;
}

function calcularParcelas() {
  const { numParcelas, dataEmprestimo, dataConsulta } = getSaldoInputs();

  if (!Number.isFinite(numParcelas) || numParcelas <= 0 || !dataEmprestimo || !dataConsulta) {
    showFieldError('resultado2', 'Preencha número de parcelas e datas.');
    return { parcelasPagas: 0, parcelasRestantes: Math.max(0, numParcelas || 0) };
  }

  const { parcelasPagas, parcelasRestantes } = countPaidInstallments(dataEmprestimo, dataConsulta, numParcelas);

  setHTML('resultado2', resultCard(
    'Andamento do contrato',
    `${parcelasPagas} de ${numParcelas} pagas`,
    `${parcelasRestantes} parcela${parcelasRestantes === 1 ? '' : 's'} restante${parcelasRestantes === 1 ? '' : 's'}.`
  ));

  return { parcelasPagas, parcelasRestantes };
}

function calculateRemainingBalance(payment, remainingInstallments, monthlyRate) {
  if (!Number.isFinite(payment) || !Number.isFinite(remainingInstallments)) return NaN;
  if (remainingInstallments <= 0) return 0;
  if (!Number.isFinite(monthlyRate) || monthlyRate === 0) return payment * remainingInstallments;
  return payment * (1 - Math.pow(1 + monthlyRate, -remainingInstallments)) / monthlyRate;
}

function calcularSaldoDevedor(options = {}) {
  const silent = Boolean(options.silent);

  if (!hasSaldoMinimumData()) {
    if (!silent) {
      calcularTaxaJuros();
      calcularParcelas();
      showFieldError('resultado3', 'Complete os dados para calcular o saldo.');
    }
    return NaN;
  }

  const { valorParcela } = getSaldoInputs();
  const taxaMensal = calcularTaxaJuros();
  const { parcelasRestantes } = calcularParcelas();

  // Mantém o saldo consistente com a taxa que o usuário vê na tela.
  // Ex.: taxa estimada exibida como 2,69% a.m. é usada como 0,0269 no saldo,
  // evitando divergência entre a taxa apresentada e o resultado final.
  const taxaMensalParaSaldo = Number.isFinite(taxaMensal)
    ? roundTo(taxaMensal * 100, 2) / 100
    : NaN;
  const saldoDevedor = calculateRemainingBalance(valorParcela, parcelasRestantes, taxaMensalParaSaldo);

  if (!Number.isFinite(saldoDevedor)) {
    showFieldError('resultado3', 'Não foi possível calcular o saldo.');
    return NaN;
  }

  CREDIT_STATE.lastSaldoDevedor = saldoDevedor;

  setHTML('resultado3', resultCard(
    'Quanto ainda falta pagar',
    formatMoney(saldoDevedor),
    parcelasRestantes > 0 ? 'Estimativa considerando as parcelas que ainda faltam.' : 'Pelo cálculo, o contrato aparece como quitado nessa data.'
  ));

  maybeAutoFillLoanAmount(saldoDevedor);

  return saldoDevedor;
}

function calcularTudo() {
  return calcularSaldoDevedor();
}

function maybeAutoFillLoanAmount(saldo) {
  const loanAmount = byId('loanAmount');
  if (!loanAmount || !Number.isFinite(saldo) || saldo <= 0) return;

  const currentValue = parseNumber(loanAmount.value);
  const canAutoFill = !loanAmount.value || CREDIT_STATE.loanAmountAutoFilled;

  if (canAutoFill || !Number.isFinite(currentValue)) {
    loanAmount.value = saldo.toFixed(2);
    CREDIT_STATE.loanAmountAutoFilled = true;
    debounce('price-autocalc-after-saldo', () => autoCalculateLoan(), 250);
  }
}

function preencherSaldoDevedor() {
  const saldo = calcularSaldoDevedor();
  const loanAmount = byId('loanAmount');
  if (loanAmount && Number.isFinite(saldo)) {
    loanAmount.value = saldo.toFixed(2);
    CREDIT_STATE.loanAmountAutoFilled = true;
    autoCalculateLoan({ forceFeedback: true });
  }
}

function getLoanInputs() {
  return {
    loanAmount: readNumber('loanAmount'),
    numberOfInstallments: readInteger('numberOfInstallments'),
    interestRatePercent: readNumber('interestRate')
  };
}

function hasLoanMinimumData() {
  const data = getLoanInputs();
  return Number.isFinite(data.loanAmount) && data.loanAmount > 0 &&
    Number.isFinite(data.numberOfInstallments) && data.numberOfInstallments > 0 &&
    Number.isFinite(data.interestRatePercent) && data.interestRatePercent >= 0;
}

function calculatePriceSchedule({ amount, installments, monthlyRate }) {
  const monthlyPayment = monthlyRate === 0
    ? amount / installments
    : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));

  let totalPayments = 0;
  let totalInterest = 0;
  let remainingBalance = amount;
  const rows = [];

  for (let month = 1; month <= installments; month += 1) {
    const monthlyInterest = remainingBalance * monthlyRate;
    const amortization = month === installments
      ? remainingBalance
      : Math.min(remainingBalance, monthlyPayment - monthlyInterest);

    const payment = amortization + monthlyInterest;
    totalPayments += payment;
    totalInterest += monthlyInterest;
    remainingBalance = Math.max(0, remainingBalance - amortization);

    rows.push({
      month,
      payment,
      amortization,
      monthlyInterest,
      remainingBalance
    });
  }

  return {
    monthlyPayment,
    totalPayments,
    totalInterest,
    rows
  };
}

function renderLoanResult({ amount, installments, monthlyRatePercent, schedule }) {
  const resultElement = byId('result');
  if (!resultElement) return;

  const totalCostPercent = amount > 0 ? (schedule.totalInterest / amount) * 100 : 0;

  const summary = `
    <div class="loan-summary-grid" aria-label="Resumo do financiamento">
      <article>
        <span>Parcela estimada</span>
        <strong>${formatMoney(schedule.monthlyPayment)}</strong>
        <small>Estimativa de parcela fixa mensal.</small>
      </article>
      <article>
        <span>Total pago</span>
        <strong>${formatMoney(schedule.totalPayments)}</strong>
        <small>${installments} parcela${installments === 1 ? '' : 's'} no período.</small>
      </article>
      <article>
        <span>Juros totais</span>
        <strong>${formatMoney(schedule.totalInterest)}</strong>
        <small>${formatPercent(totalCostPercent)} sobre o valor inicial.</small>
      </article>
      <article>
        <span>Taxa usada</span>
        <strong>${formatPercent(monthlyRatePercent)} a.m.</strong>
        <small>Taxa mensal informada na simulação.</small>
      </article>
    </div>
  `;

  const rows = schedule.rows.map(row => `
    <tr>
      <td>${row.month}</td>
      <td>${formatMoney(row.payment)}</td>
      <td>${formatMoney(row.amortization)}</td>
      <td>${formatMoney(row.monthlyInterest)}</td>
      <td>${formatMoney(row.remainingBalance)}</td>
    </tr>
  `).join('');

  resultElement.innerHTML = `
    ${summary}
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Parcela</th>
            <th>Amortização</th>
            <th>Juros</th>
            <th>Saldo Devedor</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="loan-result-note">
      Simulação automática. Altere qualquer campo acima para recalcular a tabela.
    </p>
  `;
}

function calculateLoan(options = {}) {
  const resultElement = byId('result');
  const forceFeedback = Boolean(options.forceFeedback);

  if (!resultElement) return null;

  const { loanAmount, numberOfInstallments, interestRatePercent } = getLoanInputs();

  if (!hasLoanMinimumData()) {
    if (forceFeedback) {
      resultElement.innerHTML = `
        <div class="empty-result-state">
          <strong>Preencha valor, quantidade de parcelas e juros ao mês para ver a simulação.</strong>
          <span>O resumo aparece automaticamente quando os campos estiverem completos.</span>
        </div>
      `;
    }
    return null;
  }

  const monthlyRate = interestRatePercent / 100;
  const schedule = calculatePriceSchedule({
    amount: loanAmount,
    installments: numberOfInstallments,
    monthlyRate
  });

  renderLoanResult({
    amount: loanAmount,
    installments: numberOfInstallments,
    monthlyRatePercent: interestRatePercent,
    schedule
  });

  return schedule;
}

function autoCalculateSaldo() {
  if (hasSaldoMinimumData()) {
    calcularSaldoDevedor({ silent: true });
  }
}

function autoCalculateLoan(options = {}) {
  if (hasLoanMinimumData()) {
    calculateLoan(options);
  } else if (options.forceFeedback) {
    calculateLoan(options);
  }
}

function bindAutomaticCreditCalculations() {
  const saldoIds = ['numParcelas', 'valorParcela', 'valorTotal', 'dataEmprestimo', 'dataConsulta'];
  saldoIds.forEach(id => {
    const field = byId(id);
    if (!field) return;
    field.addEventListener('input', () => debounce('saldo-autocalc', () => autoCalculateSaldo()));
    field.addEventListener('change', () => debounce('saldo-autocalc', () => autoCalculateSaldo(), 150));
  });

  const loanIds = ['loanAmount', 'numberOfInstallments', 'interestRate'];
  loanIds.forEach(id => {
    const field = byId(id);
    if (!field) return;
    field.addEventListener('input', () => {
      if (id === 'loanAmount') CREDIT_STATE.loanAmountAutoFilled = false;
      debounce('loan-autocalc', () => autoCalculateLoan());
    });
    field.addEventListener('change', () => debounce('loan-autocalc', () => autoCalculateLoan(), 150));
  });
}

function improveCreditPageInitialState() {
  const resultElement = byId('result');
  if (resultElement && !resultElement.innerHTML.trim()) {
    resultElement.innerHTML = `
      <div class="empty-result-state">
        <strong>Preencha os dados para ver a simulação.</strong>
        <span>Informe valor, quantidade de parcelas e juros ao mês. O resumo será gerado automaticamente.</span>
      </div>
    `;
  }
}

function initCreditPage() {
  preencherDataAtual();
  bindAutomaticCreditCalculations();
  improveCreditPageInitialState();
  autoCalculateSaldo();
  autoCalculateLoan();
}

window.addEventListener('DOMContentLoaded', initCreditPage);

/* v0.9 — Investimentos */
const INVESTMENT_PRODUCTS = [
  { key: 'cdb', name: 'CDB', taxable: true },
  { key: 'lci', name: 'LCI/LCA', taxable: false },
  { key: 'poupanca', name: 'Poupança', taxable: false },
  { key: 'ipca', name: 'Correção pelo IPCA', taxable: false }
];

function annualRateToMonthly(annualPercent) {
  if (!Number.isFinite(annualPercent)) return NaN;
  return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
}

function getInvestmentTaxRate(months) {
  if (!Number.isFinite(months) || months <= 0) return 0;
  if (months <= 6) return 0.225;
  if (months <= 12) return 0.20;
  if (months <= 24) return 0.175;
  return 0.15;
}

function simulateCompoundInvestment({ initialAmount, monthlyContribution, months, monthlyRate, taxRate = 0 }) {
  let grossValue = initialAmount;

  for (let month = 1; month <= months; month += 1) {
    grossValue *= (1 + monthlyRate);
    grossValue += monthlyContribution;
  }

  const totalInvested = initialAmount + (monthlyContribution * months);
  const grossProfit = grossValue - totalInvested;
  const tax = Math.max(0, grossProfit) * taxRate;
  const netValue = grossValue - tax;
  const netProfit = netValue - totalInvested;

  return {
    totalInvested,
    grossValue,
    grossProfit,
    tax,
    netValue,
    netProfit,
    grossReturnPercent: totalInvested > 0 ? (grossProfit / totalInvested) * 100 : 0,
    netReturnPercent: totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0
  };
}

function getPoupancaMonthlyRate(selicAnnualPercent, trMonthlyPercent) {
  const trMonthlyRate = Number.isFinite(trMonthlyPercent) ? trMonthlyPercent / 100 : 0;
  const baseMonthlyRate = selicAnnualPercent <= 8.5
    ? annualRateToMonthly(selicAnnualPercent * 0.7)
    : 0.005;

  return Math.max(0, baseMonthlyRate + trMonthlyRate);
}


const DEFAULT_INVESTMENT_ASSUMPTIONS = {
  cdbPercent: 100,
  lciPercent: 85,
  trMonthly: 0
};

function withInvestmentDefault(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function getInvestmentInputs() {
  return {
    initialAmount: readNumber('investInitialAmount'),
    monthlyContribution: readNumber('investMonthlyContribution'),
    periodYears: readNumber('investPeriodYears'),
    cdiAnnual: readNumber('investCdiAnnual'),
    selicAnnual: readNumber('investSelicAnnual'),
    ipcaAnnual: readNumber('investIpcaAnnual'),
    trMonthly: withInvestmentDefault(readNumber('investTrMonthly'), DEFAULT_INVESTMENT_ASSUMPTIONS.trMonthly),
    cdbPercent: withInvestmentDefault(readNumber('investCdbPercent'), DEFAULT_INVESTMENT_ASSUMPTIONS.cdbPercent),
    lciPercent: withInvestmentDefault(readNumber('investLciPercent'), DEFAULT_INVESTMENT_ASSUMPTIONS.lciPercent)
  };
}

function hasInvestmentMinimumData(data = getInvestmentInputs()) {
  return Number.isFinite(data.initialAmount) && data.initialAmount >= 0 &&
    Number.isFinite(data.monthlyContribution) && data.monthlyContribution >= 0 &&
    Number.isFinite(data.periodYears) && data.periodYears > 0 &&
    Number.isFinite(data.cdiAnnual) && data.cdiAnnual >= 0 &&
    Number.isFinite(data.selicAnnual) && data.selicAnnual >= 0 &&
    Number.isFinite(data.ipcaAnnual) && data.ipcaAnnual >= 0 &&
    Number.isFinite(data.trMonthly) && data.trMonthly >= 0 &&
    Number.isFinite(data.cdbPercent) && data.cdbPercent >= 0 &&
    Number.isFinite(data.lciPercent) && data.lciPercent >= 0 &&
    (data.initialAmount > 0 || data.monthlyContribution > 0);
}

function buildInvestmentScenarios(data) {
  const months = Math.max(1, Math.round(data.periodYears * 12));
  const cdbAnnual = data.cdiAnnual * (data.cdbPercent / 100);
  const lciAnnual = data.cdiAnnual * (data.lciPercent / 100);
  const taxRate = getInvestmentTaxRate(months);

  const rates = {
    cdb: annualRateToMonthly(cdbAnnual),
    lci: annualRateToMonthly(lciAnnual),
    poupanca: getPoupancaMonthlyRate(data.selicAnnual, data.trMonthly),
    ipca: annualRateToMonthly(data.ipcaAnnual)
  };

  return INVESTMENT_PRODUCTS.map(product => {
    const simulation = simulateCompoundInvestment({
      initialAmount: data.initialAmount,
      monthlyContribution: data.monthlyContribution,
      months,
      monthlyRate: rates[product.key],
      taxRate: product.taxable ? taxRate : 0
    });

    return {
      ...product,
      months,
      monthlyRate: rates[product.key],
      annualRatePercent: (Math.pow(1 + rates[product.key], 12) - 1) * 100,
      taxRate: product.taxable ? taxRate : 0,
      ...simulation
    };
  }).sort((a, b) => b.netValue - a.netValue);
}

function renderInvestmentResults(scenarios, data) {
  const resultElement = byId('investmentResult');
  if (!resultElement) return;

  if (!scenarios.length) {
    resultElement.innerHTML = `
      <div class="empty-result-state">
        <strong>Preencha seu plano de investimento.</strong>
        <span>Informe valor inicial, aporte mensal, prazo e os valores de referência para ver a comparação.</span>
      </div>
    `;
    return;
  }

  const best = scenarios[0];
  const months = Math.max(1, Math.round(data.periodYears * 12));
  const totalInvested = best.totalInvested;
  const totalTax = scenarios.reduce((sum, item) => sum + item.tax, 0);

  const summary = `
    <div class="investment-summary-grid" aria-label="Resumo dos investimentos">
      <article>
        <span>Melhor opção estimada</span>
        <strong>${best.name}</strong>
        <small>${formatMoney(best.netValue)} líquidos ao fim do período.</small>
      </article>
      <article>
        <span>Total investido</span>
        <strong>${formatMoney(totalInvested)}</strong>
        <small>Valor inicial + aportes em ${months} meses.</small>
      </article>
      <article>
        <span>Maior ganho líquido</span>
        <strong>${formatMoney(best.netProfit)}</strong>
        <small>${formatPercent(best.netReturnPercent)} sobre o total investido.</small>
      </article>
      <article>
        <span>IR estimado no CDB</span>
        <strong>${formatPercent(getInvestmentTaxRate(months) * 100)}</strong>
        <small>Alíquota regressiva simplificada pelo prazo total.</small>
      </article>
    </div>
  `;

  const ranking = `
    <div class="investment-ranking-list" aria-label="Ranking de investimentos">
      ${scenarios.map((item, index) => `
        <article class="investment-ranking-card ${index === 0 ? 'best' : ''}">
          <span class="investment-product-rank">${index + 1}º lugar</span>
          <h3>${item.name}</h3>
          <strong>${formatMoney(item.netValue)}</strong>
          <small>Ganho líquido de ${formatMoney(item.netProfit)}.</small>
        </article>
      `).join('')}
    </div>
  `;

  const rows = scenarios.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${formatPercent(item.annualRatePercent)} a.a.</td>
      <td>${formatMoney(item.grossValue)}</td>
      <td>${formatPercent(item.grossReturnPercent)}</td>
      <td>${formatMoney(item.tax)}</td>
      <td>${formatMoney(item.netValue)}</td>
      <td>${formatPercent(item.netReturnPercent)}</td>
      <td><strong>${formatMoney(item.netProfit)}</strong></td>
    </tr>
  `).join('');

  resultElement.innerHTML = `
    ${summary}
    ${ranking}
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Aplicação</th>
            <th>Taxa usada</th>
            <th>Valor bruto</th>
            <th>Rentab. bruta</th>
            <th>IR estimado</th>
            <th>Valor líquido</th>
            <th>Rentab. líquida</th>
            <th>Ganho líquido</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="investment-result-note">
      Simulação educativa com taxas constantes e aportes no fim de cada mês. Os resultados são estimativas, não promessa de rentabilidade.
    </p>
  `;
}

function calculateInvestments(options = {}) {
  const resultElement = byId('investmentResult');
  if (!resultElement) return null;

  const data = getInvestmentInputs();

  if (!hasInvestmentMinimumData(data)) {
    if (options.forceFeedback) {
      resultElement.innerHTML = `
        <div class="empty-result-state">
          <strong>Preencha seu plano de investimento.</strong>
          <span>Informe valor inicial, aporte mensal, prazo e os valores de referência para ver a comparação.</span>
        </div>
      `;
    }
    return null;
  }

  const scenarios = buildInvestmentScenarios(data);
  renderInvestmentResults(scenarios, data);
  return scenarios;
}

function bindAutomaticInvestmentCalculations() {
  const ids = [
    'investInitialAmount',
    'investMonthlyContribution',
    'investPeriodYears',
    'investCdiAnnual',
    'investSelicAnnual',
    'investIpcaAnnual',
    'investTrMonthly',
    'investCdbPercent',
    'investLciPercent'
  ];

  ids.forEach(id => {
    const field = byId(id);
    if (!field) return;
    field.addEventListener('input', () => debounce('investment-autocalc', () => calculateInvestments()));
    field.addEventListener('change', () => debounce('investment-autocalc', () => calculateInvestments(), 150));
  });
}

function initInvestmentPage() {
  if (!byId('investmentResult')) return;
  bindAutomaticInvestmentCalculations();
  calculateInvestments({ forceFeedback: true });
}

window.addEventListener('DOMContentLoaded', initInvestmentPage);

// v1.0.1 — Índices públicos exibidos automaticamente/localStorage
const INDICES_STORAGE_KEY = 'financaDinha.indices.v1';

function safeLocalStorageGet(key) {
  try {
    return window.localStorage ? window.localStorage.getItem(key) : null;
  } catch (error) {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    if (window.localStorage) window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function normalizeApiName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function setNumberInputValue(id, value, digits = 2, overwrite = true) {
  const field = byId(id);
  if (!field || !Number.isFinite(value)) return false;
  if (!overwrite && field.value) return false;
  field.value = Number(value).toFixed(digits);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function formatIndexPercent(value, digits = 2) {
  if (!Number.isFinite(value)) return '--';
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}%`;
}

function setIndexDisplayValue(id, value, digits = 2) {
  const element = byId(id);
  if (!element) return false;
  element.textContent = formatIndexPercent(value, digits);
  return true;
}

function setIndexMeta(id, text) {
  const element = byId(id);
  if (element) element.textContent = text;
}

function setIndexCardState(cardId, value) {
  const card = byId(cardId);
  if (!card) return;
  card.classList.remove('is-loading', 'is-unavailable', 'has-value');
  card.classList.add(Number.isFinite(value) ? 'has-value' : 'is-unavailable');
}

function setIndicesStatus(message, type = '') {
  const status = byId('indicesApiStatus');
  if (!status) return;
  const strip = status.closest('.indices-status-strip');
  if (strip) {
    strip.classList.remove('success', 'warning', 'error', 'loading');
    if (type) strip.classList.add(type);
  }
  status.textContent = message;
}

function updateIndicesLastUpdate(text) {
  const el = byId('indicesLastUpdate');
  if (el) el.textContent = text;
}

function getSavedIndices() {
  const raw = safeLocalStorageGet(INDICES_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function saveIndicesData(data) {
  const payload = {
    selicAnnual: Number.isFinite(data.selicAnnual) ? data.selicAnnual : null,
    cdiAnnual: Number.isFinite(data.cdiAnnual) ? data.cdiAnnual : null,
    ipcaAnnual: Number.isFinite(data.ipcaAnnual) ? data.ipcaAnnual : null,
    trMonthly: Number.isFinite(data.trMonthly) ? data.trMonthly : null,
    savingsMonthly: Number.isFinite(data.savingsMonthly) ? data.savingsMonthly : null,
    inflationAccumulated: Number.isFinite(data.inflationAccumulated) ? data.inflationAccumulated : null,
    updatedAt: data.updatedAt || new Date().toISOString(),
    source: data.source || 'Fontes públicas'
  };

  safeLocalStorageSet(INDICES_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

function applyIndicesToIndexFields(data, overwrite = true) {
  if (!data) return;

  // Compatibilidade: ainda preenche inputs se alguma versão antiga da página existir.
  setNumberInputValue('indexSelicAnnual', data.selicAnnual, 2, overwrite);
  setNumberInputValue('indexCdiAnnual', data.cdiAnnual, 2, overwrite);
  setNumberInputValue('indexIpcaAnnual', data.ipcaAnnual, 2, overwrite);
  setNumberInputValue('indexTrMonthly', data.trMonthly, 4, overwrite);
  setNumberInputValue('indexSavingsMonthly', data.savingsMonthly, 4, overwrite);
  setNumberInputValue('indexInflationAccumulated', data.inflationAccumulated, 2, overwrite);

  setIndexDisplayValue('indexSelicAnnualValue', data.selicAnnual, 2);
  setIndexDisplayValue('indexCdiAnnualValue', data.cdiAnnual, 2);
  setIndexDisplayValue('indexIpcaAnnualValue', data.ipcaAnnual, 2);
  setIndexDisplayValue('indexTrMonthlyValue', data.trMonthly, 4);
  setIndexDisplayValue('indexSavingsMonthlyValue', data.savingsMonthly, 4);
  setIndexDisplayValue('indexInflationAccumulatedValue', data.inflationAccumulated, 2);

  setIndexCardState('indexCardSelic', data.selicAnnual);
  setIndexCardState('indexCardCdi', data.cdiAnnual);
  setIndexCardState('indexCardIpca', data.ipcaAnnual);
  setIndexCardState('indexCardTr', data.trMonthly);
  setIndexCardState('indexCardSavings', data.savingsMonthly);
  setIndexCardState('indexCardInflation', data.inflationAccumulated);

  const sourceText = data.source ? `Fonte: ${data.source}.` : 'Fonte: consulta pública.';
  setIndexMeta('indexSelicAnnualMeta', Number.isFinite(data.selicAnnual) ? sourceText : 'Não disponível no momento.');
  setIndexMeta('indexCdiAnnualMeta', Number.isFinite(data.cdiAnnual) ? sourceText : 'Não disponível no momento.');
  setIndexMeta('indexIpcaAnnualMeta', Number.isFinite(data.ipcaAnnual) ? sourceText : 'Não disponível no momento.');
  setIndexMeta('indexTrMonthlyMeta', Number.isFinite(data.trMonthly) ? sourceText : 'Não disponível no momento.');
  setIndexMeta('indexSavingsMonthlyMeta', Number.isFinite(data.savingsMonthly) ? 'Estimativa calculada pela regra da poupança.' : 'Não disponível no momento.');
  setIndexMeta('indexInflationAccumulatedMeta', Number.isFinite(data.inflationAccumulated) ? 'Usando o IPCA disponível como referência anual.' : 'Não disponível no momento.');

  if (data.updatedAt) {
    const date = new Date(data.updatedAt);
    if (!Number.isNaN(date.getTime())) {
      updateIndicesLastUpdate(`Última atualização: ${date.toLocaleString('pt-BR')}.`);
    }
  }
}

function formatRateDate(dateString) {
  if (!dateString) return '';
  const [day, month, year] = String(dateString).split('/').map(Number);
  if (!day || !month || !year) return dateString;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

async function fetchBrasilApiRates() {
  const response = await fetch('https://brasilapi.com.br/api/taxas/v1', { cache: 'no-store' });
  if (!response.ok) throw new Error('Consulta indisponível');

  const rates = await response.json();
  const result = {};

  if (!Array.isArray(rates)) return result;

  rates.forEach((item) => {
    const name = normalizeApiName(item.nome || item.name || item.codigo || item.codigoMoeda);
    const value = parseNumber(item.valor);
    if (!Number.isFinite(value)) return;

    if (name.includes('selic')) result.selicAnnual = value;
    if (name === 'cdi' || name.includes('cdi')) result.cdiAnnual = value;
    if (name.includes('ipca')) result.ipcaAnnual = value;
  });

  return result;
}

async function fetchBcbSeriesLastValues(code, quantity = 1) {
  const response = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/${quantity}?formato=json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Série ${code} indisponível`);
  return response.json();
}

async function fetchBcbLastValue(code) {
  const rows = await fetchBcbSeriesLastValues(code, 1);
  if (!Array.isArray(rows) || !rows.length) return NaN;
  return parseNumber(rows[0].valor);
}

async function fetchBcbIpcaAnnualFallback() {
  const rows = await fetchBcbSeriesLastValues(433, 12);
  if (!Array.isArray(rows) || !rows.length) return null;

  const annual = rows.reduce((acc, row) => {
    const value = parseNumber(row.valor);
    return Number.isFinite(value) ? acc * (1 + value / 100) : acc;
  }, 1);

  return (annual - 1) * 100;
}

async function fetchBcbTrMonthlyFallback() {
  return fetchBcbLastValue(226);
}

function deriveSavingsMonthlyRate(selicAnnual, trMonthly) {
  if (!Number.isFinite(selicAnnual)) return NaN;
  const tr = Number.isFinite(trMonthly) ? trMonthly : 0;
  return getPoupancaMonthlyRate(selicAnnual, tr) * 100;
}

async function updateIndicesFromApi(options = {}) {
  const { automatic = false } = options;
  const button = byId('updateIndicesButton');
  if (button) {
    button.disabled = true;
    button.textContent = automatic ? 'Atualizando...' : 'Atualizando...';
  }

  setIndicesStatus('Buscando os indicadores mais recentes...', 'loading');
  updateIndicesLastUpdate('Isso pode levar alguns segundos.');

  try {
    const previous = getSavedIndices() || {};
    let apiData = {};
    let partial = false;

    try {
      apiData = await fetchBrasilApiRates();
    } catch (error) {
      partial = true;
    }

    if (!Number.isFinite(apiData.ipcaAnnual)) {
      try {
        const ipcaFallback = await fetchBcbIpcaAnnualFallback();
        if (Number.isFinite(ipcaFallback)) apiData.ipcaAnnual = ipcaFallback;
        partial = true;
      } catch (error) {
        partial = true;
      }
    }

    if (!Number.isFinite(apiData.trMonthly)) {
      try {
        const trFallback = await fetchBcbTrMonthlyFallback();
        if (Number.isFinite(trFallback)) apiData.trMonthly = trFallback;
        partial = true;
      } catch (error) {
        partial = true;
      }
    }

    if (!Number.isFinite(apiData.cdiAnnual) && Number.isFinite(apiData.selicAnnual)) {
      apiData.cdiAnnual = apiData.selicAnnual;
      partial = true;
    }

    const merged = {
      selicAnnual: Number.isFinite(apiData.selicAnnual) ? apiData.selicAnnual : previous.selicAnnual,
      cdiAnnual: Number.isFinite(apiData.cdiAnnual) ? apiData.cdiAnnual : previous.cdiAnnual,
      ipcaAnnual: Number.isFinite(apiData.ipcaAnnual) ? apiData.ipcaAnnual : previous.ipcaAnnual,
      trMonthly: Number.isFinite(apiData.trMonthly) ? apiData.trMonthly : previous.trMonthly,
      updatedAt: new Date().toISOString(),
      source: partial ? 'fontes públicas' : 'fontes públicas'
    };

    const derivedSavings = deriveSavingsMonthlyRate(merged.selicAnnual, merged.trMonthly);
    if (Number.isFinite(derivedSavings)) merged.savingsMonthly = derivedSavings;
    else merged.savingsMonthly = previous.savingsMonthly;

    if (Number.isFinite(merged.ipcaAnnual)) merged.inflationAccumulated = merged.ipcaAnnual;
    else merged.inflationAccumulated = previous.inflationAccumulated;

    const hasAnyValue = [
      merged.selicAnnual,
      merged.cdiAnnual,
      merged.ipcaAnnual,
      merged.trMonthly,
      merged.savingsMonthly,
      merged.inflationAccumulated
    ].some(Number.isFinite);

    if (!hasAnyValue) {
      setIndicesStatus('Não conseguimos atualizar agora.', 'error');
      updateIndicesLastUpdate('Tente novamente em alguns minutos.');
      return;
    }

    const saved = saveIndicesData(merged);
    applyIndicesToIndexFields(saved, true);
    setIndicesStatus('Indicadores atualizados.', partial ? 'warning' : 'success');
  } catch (error) {
    const saved = getSavedIndices();
    if (saved) {
      applyIndicesToIndexFields(saved, true);
      setIndicesStatus('Não conseguimos buscar uma nova atualização agora.', 'warning');
      updateIndicesLastUpdate('Mostrando a última consulta salva neste navegador.');
    } else {
      setIndicesStatus('Não conseguimos carregar os indicadores agora.', 'error');
      updateIndicesLastUpdate('Verifique sua conexão e tente novamente.');
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Atualizar agora';
    }
  }
}

function initIndicesPage() {
  if (!byId('indices-painel') && !byId('indices-campos')) return;

  const saved = getSavedIndices();
  if (saved) {
    applyIndicesToIndexFields(saved, false);
    setIndicesStatus('Mostrando a última consulta salva enquanto buscamos dados novos.', 'loading');
  }

  const updateButton = byId('updateIndicesButton');
  if (updateButton) updateButton.addEventListener('click', () => updateIndicesFromApi({ automatic: false }));

  updateIndicesFromApi({ automatic: true });
}

function applySavedIndicesToInvestmentFields(overwrite = false) {
  const saved = getSavedIndices();
  const status = byId('investmentIndicesStatus');

  if (!saved) {
    if (status) status.textContent = 'Tentando buscar os valores atuais. Se não aparecer resultado, abra “Ver ou alterar as taxas” e preencha manualmente.';
    return false;
  }

  let changed = false;
  changed = setNumberInputValue('investCdiAnnual', saved.cdiAnnual, 2, overwrite) || changed;
  changed = setNumberInputValue('investSelicAnnual', saved.selicAnnual, 2, overwrite) || changed;
  changed = setNumberInputValue('investIpcaAnnual', saved.ipcaAnnual, 2, overwrite) || changed;
  changed = setNumberInputValue('investTrMonthly', withInvestmentDefault(saved.trMonthly, DEFAULT_INVESTMENT_ASSUMPTIONS.trMonthly), 4, overwrite) || changed;
  changed = setNumberInputValue('investCdbPercent', DEFAULT_INVESTMENT_ASSUMPTIONS.cdbPercent, 2, overwrite) || changed;
  changed = setNumberInputValue('investLciPercent', DEFAULT_INVESTMENT_ASSUMPTIONS.lciPercent, 2, overwrite) || changed;

  if (status) {
    status.textContent = changed
      ? 'Usando os valores atuais na comparação.'
      : 'Os valores atuais já estão aplicados. Você pode mudar qualquer campo se quiser testar outro cenário.';
  }

  if (changed) calculateInvestments();
  return changed;
}

function initInvestmentIndicesBridge() {
  if (!byId('investmentResult')) return;

  const applied = applySavedIndicesToInvestmentFields(false);

  // Se ainda não houver valores salvos, tenta buscar os indicadores automaticamente.
  // Assim o usuário não precisa sair da página de investimentos para conseguir comparar.
  if (!applied && typeof updateIndicesFromApi === 'function') {
    updateIndicesFromApi({ automatic: true })
      .then(() => applySavedIndicesToInvestmentFields(false))
      .catch(() => {
        const status = byId('investmentIndicesStatus');
        if (status) {
          status.textContent = 'Não consegui buscar os valores atuais agora. Abra “Ver ou alterar as taxas” e preencha os campos para comparar.';
        }
      });
  }
}

window.addEventListener('DOMContentLoaded', initIndicesPage);
window.addEventListener('DOMContentLoaded', initInvestmentIndicesBridge);
