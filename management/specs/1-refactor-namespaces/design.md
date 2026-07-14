---
name: refactor-namespaces
status: audited
references: [ADR-001, arch.md]
---

# Spec 1 — Design: Refatoração para Namespaces

## Estratégia de Implementação

A refatoração será feita **in-place** — o arquivo original será modificado diretamente, substituindo o bloco `<script>` monolítico por 14 blocos IIFE (13 namespaces + 1 inicialização). A ordem dos blocos no arquivo respeita a ordem de dependências (módulos folha primeiro).

## Estrutura do `<script>` pós-refatoração

```
<script>
/* ════════ SB.Util ════════ */
window.SB = window.SB || {};
window.SB.Util = (function() { ... })();

/* ════════ SB.Html ════════ */
window.SB.Html = (function() { ... })();

/* ════════ SB.Store ════════ */
window.SB.Store = (function() { ... })();

/* ════════ SB.Config ════════ */
window.SB.Config = (function() { ... })();

/* ════════ SB.Casas ════════ */
window.SB.Casas = (function() { ... })();

/* ════════ SB.Simples ════════ */
window.SB.Simples = (function() { ... })();

/* ════════ SB.Surebets ════════ */
window.SB.Surebets = (function() { ... })();

/* ════════ SB.DuploGreen ════════ */
window.SB.DuploGreen = (function() { ... })();

/* ════════ SB.Lixeira ════════ */
window.SB.Lixeira = (function() { ... })();

/* ════════ SB.Relatorios ════════ */
window.SB.Relatorios = (function() { ... })();

/* ════════ SB.Sync ════════ */
window.SB.Sync = (function() { ... })();

/* ════════ SB.Nav ════════ */
window.SB.Nav = (function() { ... })();

/* ════════ SB.Home ════════ */
window.SB.Home = (function() { ... })();

/* ════════ INIT ════════ */
(function() { ... })();
</script>
```

## Contratos de Interface por Módulo

### SB.Util
**Responsabilidade**: Funções puras de utilidade — matemática, formatação, datas.
**Estado interno**: `_countUpSeq` (privado)
**Exporta**:
```
R(n) → number
R2(n) → string
pct(a, b) → number
fmtMoney(n) → string
sureEventDate(op) → string (ISO date)
animateCountUp(el, endValue, prefix) → void
fmtDataShort(iso) → string
fmtDataHora(iso) → string
showToast(msg, icon) → void
probImplicita(odd) → number
splitToDateTime(iso) → {date, time}
combineDateTime(dateVal, timeVal, fallbackNow) → string (ISO)
LOGO_B64 → string (base64 do logo, usado por printReport)
```

### SB.Html
**Responsabilidade**: Gerar strings HTML para cards, gráficos e componentes visuais. Funções puras — recebem dados, retornam HTML.
**Dependências**: SB.Util
**Exporta**:
```
bkR(label, color, barColor, w, val, valColor) → string
statCard(icon, label, value, valueClass, sub) → string
miniStat(value, label, colorClass, icon) → string
metaCard(current, target, label) → string
rankCard(mais, menos) → string
emptyState(icon, msg) → string
monthlyBuckets(items, dateFn, lucroFn, monthsBack) → [{key, label, total}]
monthlyBarsHtml(buckets) → string
pieChartHtml(segments) → string
computeEquity(itemsSorted, bancaInicial, lucroFn) → {curve, drawdown, final}
sumCard(label, val, color) → string
legResultBox(lucro, roiLeg, cenarioLabel) → string
```

### SB.Store
**Responsabilidade**: Abstrair todas as operações de localStorage. Único ponto de contato com `localStorage.setItem/getItem/removeItem`.
**Estado interno**: Objeto `KEYS` com as 9 chaves (privado)
**Dependências**: SB.Sync (scheduleAutoPush, referência lazy)
**Exporta**:
```
KEYS (read-only) → {CFG, CASAS, SIMPLES, SURE, DG, TRASH_SIMPLES, TRASH_SURE, TRASH_DG, SYNC}
load(key) → any (JSON.parse)
save(key, data) → void (JSON.stringify + scheduleAutoPush)
remove(key) → void
```

### SB.Config
**Responsabilidade**: Gerenciar configurações do usuário (banca, meta, ciclos) e operação de zerar tudo.
**Estado interno**: `cfg` (objeto de configuração)
**Dependências**: SB.Store, SB.Util, SB.Html, SB.Casas, SB.Simples, SB.Surebets, SB.DuploGreen, SB.Lixeira, SB.Nav (referências lazy)
**Exporta**:
```
cfg (read-only) → object
loadCfg() → object
saveCfg() → void
fillCfgForm() → void
onCfgChange() → void
toggleNovoCiclo(modulo) → void
confirmarNovoCiclo(modulo) → void
toggleCasasPanel() → void
onConfirmZerarInput() → void
resetAll() → void
```

### SB.Casas
**Responsabilidade**: CRUD de casas de apostas (bookmakers).
**Estado interno**: `casas` (array de strings)
**Dependências**: SB.Store, SB.Html
**Exporta**:
```
casas (read-only) → string[]
loadCasas() → string[]
saveCasas() → void
addCasaIfNew(name) → void
casaOptionsHtml() → string
renderCasaSelects() → void
addCasaManual() → void
removeCasa(name) → void
renderCasas() → void
```

### SB.Nav
**Responsabilidade**: Navegação entre abas, gestão de estado da UI (curTab, novaTipo, curHistTipo).
**Estado interno**: `curTab`, `novaTipo`, `curHistTipo`, `TAB_TAGS`
**Dependências**: SB.Simples, SB.Surebets, SB.DuploGreen, SB.Home, SB.Config, SB.Lixeira, SB.Relatorios (referências lazy)
**Exporta**:
```
curTab (read-only)
novaTipo (read-only)
showTab(t) → void
setNovaTipo(t) → void
setHistoricoTipo(t) → void
cancelEdit() → void
hasUnsavedNovaData() → boolean
```

### SB.Simples
**Responsabilidade**: CRUD de apostas simples + estatísticas + renderização + exportação CSV/PDF.
**Estado interno**: `bets` (array), `nid` (próximo ID), `editingBetId`, `curT`, `retornoManual`
**Dependências**: SB.Util, SB.Html, SB.Store, SB.Casas, SB.Lixeira, SB.Config
**Exporta**:
```
bets (read-only)
luc(b) → number
sortLucroBet(b) → number
statsSimples() → object
renderSimples() → void
betCard(b) → string
setT(t) → void
setTFromUI(t) → void
onCasa() → void
updateOddProbHint(oddFieldId, hintId) → void
onOddApostaChange() → void
onRetornoManualEdit() → void
addBet() → void
editBet(id) → void
resetSimplesForm() → void
delBet(id) → void
exportCSVSimples() → void
exportPDFSimples() → void
```

### SB.Surebets
**Responsabilidade**: CRUD de surebets + calculadora de arbitragem + estatísticas + renderização + exportação.
**Estado interno**: `sure` (array), `snid` (ID), `editingSureId`, `legCounts`, `legOverride`
**Dependências**: SB.Util, SB.Html, SB.Store, SB.Casas, SB.Lixeira, SB.Config
**Exporta**:
```
sure (read-only)
sureBadgeStatus(op) → string
setSureStatus(id, status) → void
delSure(id) → void
statsSure() → object
renderSure() → void
sureCard(op) → string
setLegCount(prefix, n) → void
legCardHtml(prefix, i, removable) → string
onLegStakeManualEdit(prefix, i) → void
resetLegOverride(prefix, i) → void
renderLegsContainer(prefix) → void
captureLegValues(prefix) → array
restoreLegValues(prefix, vals) → void
addLeg(prefix) → void
removeLeg(prefix, i) → void
onLegCasa(prefix, i) → void
calcSure(prefix) → object|null
registerSure() → void
editSure(id) → void
resetSureForm() → void
exportCSVSure() → void
exportPDFSure() → void
```

### SB.DuploGreen
**Responsabilidade**: CRUD de duplo green + estatísticas + renderização + exportação.
**Estado interno**: `dg` (array), `dgnid` (ID), `editingDGId`
**Dependências**: SB.Util, SB.Html, SB.Store, SB.Casas, SB.Lixeira, SB.Config, SB.Surebets (calcSure, legCounts, legOverride)
**Exporta**:
```
dg (read-only)
dgLucro(op) → number
setDGStatus(id, status) → void
delDG(id) → void
statsDG() → object
renderDG() → void
dgCard(op, ctx) → string
saveDGResults(id, ctx) → void
registerDG() → void
editDG(id) → void
resetDGForm() → void
exportCSVDG() → void
exportPDFDG() → void
```

### SB.Lixeira
**Responsabilidade**: Lixeira unificada para os 3 tipos de aposta.
**Estado interno**: `trashBets`, `trashSure`, `trashDG` (arrays)
**Dependências**: SB.Util, SB.Html, SB.Store
**Exporta**:
```
restoreBet(id) → void
permDelBet(id) → void
restoreSureOp(id) → void
permDelSureOp(id) → void
restoreDG(id) → void
permDelDG(id) → void
esvaziarLixeira() → void
renderTrash() → void
```

### SB.Relatorios
**Responsabilidade**: Relatórios unificados por período e tipo + exportação CSV/PDF.
**Estado interno**: `reportPeriod`, `reportType`
**Dependências**: SB.Util, SB.Simples, SB.Surebets, SB.DuploGreen
**Exporta**:
```
setReportPeriod(p) → void
setReportType(t) → void
updateReportPreview() → void
exportReportCSV() → void
exportReportPDF() → void
printReport(title, summaryHtml, headers, rows) → void   ← chamado cross-module por Simples/Surebets/DG
downloadCSV(rows, name) → void                           ← chamado cross-module por Simples/Surebets/DG
```
**Privado** (não exportado): `csvCell`, `reportPeriodLabel`, `resolveReportRange`, `collectReportRows`

### SB.Sync
**Responsabilidade**: Sincronização na nuvem + backup/restore.
**Estado interno**: `syncCfg`, `_syncPushTimer`
**Dependências**: SB.Store, SB.Util, SB.Config, SB.Casas, SB.Simples, SB.Surebets, SB.DuploGreen, SB.Lixeira
**Exporta**:
```
loadSyncCfg() → object
saveSyncConfig() → void
syncPush(showFeedback) → void
syncPull(silent) → void
scheduleAutoPush() → void
collectAllData() → object
applyAllData(data) → void
exportBackup() → void
importBackup(ev) → void
fillSyncForm() → void
```

### SB.Home
**Responsabilidade**: Dashboard principal.
**Dependências**: SB.Util, SB.Html, SB.Simples, SB.Surebets, SB.DuploGreen
**Exporta**:
```
updateHeaderBanca() → void
renderHome() → void
renderAll() → void
```

### IIFE de Inicialização
**Responsabilidade**: Inicializar o app ao carregar a página.
**Inclui**:
- `initScrollNav()` — listener de scroll para esconder/mostrar barra inferior
- `init()` — inicialização principal (renderCasaSelects, setLegCount, fillCfgForm, renderHome, syncPull)
- `window.onafterprint` — limpa a área de impressão após imprimir

## Tratamento de Dependências Cíclicas

Módulos que potencialmente criam ciclos (Config ↔ Nav, Config ↔ Simples/Surebets/DG) usam **referências lazy**: acessam `SB.OutroModulo.fn()` diretamente no corpo da função, nunca capturam a referência no fechamento do IIFE. Isso funciona porque no momento da chamada (runtime), todos os namespaces já estão definidos em `window.SB`.

## Convenções de Código

1. Cada módulo começa com comentário `/* ════════ SB.Nome ════════ */`
2. Variáveis de estado interno são declaradas com `var` dentro do IIFE (não exportadas)
3. Funções exportadas são listadas no objeto `return { ... }` em ordem alfabética
4. Chamadas cross-module usam sempre o caminho completo: `SB.Util.fmtMoney(...)`
5. Strings HTML com onclick usam: `onclick="SB.Modulo.fn(...)"`
