# StakeBet — Architecture

## Visão Geral

StakeBet é um single-file web app (HTML + CSS + JS vanilla) para gestão profissional de apostas esportivas. Opera 100% offline via localStorage com sincronização opcional via Vercel Serverless + PostgreSQL.

## Diagrama de Módulos (pós-refatoração)

```
┌─────────────────────────────────────────────────────────┐
│                    window.SB (namespace raiz)            │
├─────────────────────────────────────────────────────────┤
│  SB.Util       → R, R2, pct, fmtMoney, animateCountUp, │
│                  fmtDataShort, fmtDataHora, showToast,  │
│                  probImplicita, splitToDateTime,        │
│                  combineDateTime                        │
├─────────────────────────────────────────────────────────┤
│  SB.Html       → bkR, statCard, miniStat, metaCard,    │
│                  rankCard, emptyState, monthlyBuckets,  │
│                  monthlyBarsHtml, pieChartHtml,         │
│                  computeEquity, sumCard, legResultBox   │
├─────────────────────────────────────────────────────────┤
│  SB.Store      → load(key), save(key, data),           │
│                  remove(key), KEYS (const)              │
│                  (abstrai 9 chaves localStorage)        │
├─────────────────────────────────────────────────────────┤
│  SB.Config     → cfg (state), loadCfg, saveCfg,        │
│                  fillCfgForm, onCfgChange,              │
│                  toggleNovoCiclo, confirmarNovoCiclo,   │
│                  resetAll                               │
├─────────────────────────────────────────────────────────┤
│  SB.Casas      → casas (state), loadCasas, saveCasas,  │
│                  addCasaIfNew, renderCasaSelects,       │
│                  addCasaManual, removeCasa, renderCasas │
├─────────────────────────────────────────────────────────┤
│  SB.Nav        → showTab, setNovaTipo, setHistoricoTipo,│
│                  cancelEdit, hasUnsavedNovaData,        │
│                  curTab, novaTipo (state)               │
├─────────────────────────────────────────────────────────┤
│  SB.Simples    → bets, nid (state), luc, sortLucroBet, │
│                  statsSimples, renderSimples, betCard,  │
│                  setT, setTFromUI, addBet, editBet,     │
│                  resetSimplesForm, delBet,              │
│                  exportCSVSimples, exportPDFSimples     │
├─────────────────────────────────────────────────────────┤
│  SB.Surebets   → sure, snid (state), sureBadgeStatus,  │
│                  setSureStatus, delSure, statsSure,     │
│                  renderSure, sureCard, setLegCount,     │
│                  calcSure, registerSure, editSure,      │
│                  resetSureForm, exportCSVSure,          │
│                  exportPDFSure, leg* helpers            │
├─────────────────────────────────────────────────────────┤
│  SB.DuploGreen → dg, dgnid (state), dgLucro,           │
│                  setDGStatus, delDG, statsDG,           │
│                  renderDG, dgCard, saveDGResults,       │
│                  registerDG, editDG, resetDGForm,       │
│                  exportCSVDG, exportPDFDG               │
├─────────────────────────────────────────────────────────┤
│  SB.Lixeira    → trashBets, trashSure, trashDG (state),│
│                  restoreBet, permDelBet, restoreSureOp, │
│                  permDelSureOp, restoreDG, permDelDG,   │
│                  esvaziarLixeira, renderTrash           │
├─────────────────────────────────────────────────────────┤
│  SB.Relatorios → reportPeriod, reportType (state),     │
│                  setReportPeriod, setReportType,        │
│                  collectReportRows, updateReportPreview,│
│                  exportReportCSV, exportReportPDF       │
├─────────────────────────────────────────────────────────┤
│  SB.Sync       → syncCfg (state), saveSyncConfig,      │
│                  syncPush, syncPull, scheduleAutoPush,  │
│                  collectAllData, applyAllData,          │
│                  exportBackup, importBackup             │
├─────────────────────────────────────────────────────────┤
│  SB.Home       → updateHeaderBanca, renderHome         │
├─────────────────────────────────────────────────────────┤
│  SB.init()     → IIFE de inicialização (scroll + init) │
└─────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

```
User Input → onclick handler → SB.Modulo.fn()
  → SB.Store.save() → localStorage
  → SB.Modulo.render*() → DOM update
  → (se auto-sync) SB.Sync.scheduleAutoPush()
```

## Dependências entre Módulos

- `SB.Util` — zero dependências (módulo folha)
- `SB.Html` — depende apenas de `SB.Util`
- `SB.Store` — depende apenas de `SB.Util` e `SB.Sync` (scheduleAutoPush)
- `SB.Casas` — depende de `SB.Store`, `SB.Html`, `SB.Sync`
- `SB.Config` — depende de `SB.Store`, `SB.Html`, `SB.Util`, `SB.Casas`, `SB.Simples`, `SB.Surebets`, `SB.DuploGreen`, `SB.Lixeira`, `SB.Nav`
- `SB.Nav` — depende de `SB.Simples`, `SB.Surebets`, `SB.DuploGreen`, `SB.Home`, `SB.Config`, `SB.Lixeira`, `SB.Relatorios`
- `SB.Simples` — depende de `SB.Util`, `SB.Html`, `SB.Store`, `SB.Casas`, `SB.Lixeira`, `SB.Config`
- `SB.Surebets` — depende de `SB.Util`, `SB.Html`, `SB.Store`, `SB.Casas`, `SB.Lixeira`, `SB.Config`
- `SB.DuploGreen` — depende de `SB.Util`, `SB.Html`, `SB.Store`, `SB.Casas`, `SB.Lixeira`, `SB.Config`
- `SB.Lixeira` — depende de `SB.Util`, `SB.Html`, `SB.Store`
- `SB.Relatorios` — depende de `SB.Util`, `SB.Simples`, `SB.Surebets`, `SB.DuploGreen`
- `SB.Sync` — depende de `SB.Store`, `SB.Util`, `SB.Config`, `SB.Casas`, `SB.Simples`, `SB.Surebets`, `SB.DuploGreen`, `SB.Lixeira`
- `SB.Home` — depende de `SB.Util`, `SB.Html`, `SB.Simples`, `SB.Surebets`, `SB.DuploGreen`

## localStorage Keys (imutáveis)

| Key | Conteúdo |
|-----|----------|
| `sb_config_v1` | `{bancaSimples, bancaSure, bancaDG, metaSimples, metaSure, metaDG, cicloInicioSimples, cicloInicioSure, cicloInicioDG}` |
| `sb_casas_v1` | `string[]` (nomes de bookmakers) |
| `sb_simples_v1` | `Bet[]` — `{id, casa, odd, aposta, retorno, tipo, desc, descricao, data}` |
| `sb_sure_v1` | `SureOp[]` — `{id, evento, descricao, dataFim, criada, nota, pernas, investimento, lucroMin, lucroMax, roiMin, cenarios, tipo}` |
| `sb_dg_v1` | `DGOp[]` — `{id, evento, descricao, dataFim, criada, nota, pernas, investimento, recebidos, comissoes, tipo}` |
| `sb_trash_simples_v1` | `Bet[]` com `_deletedAt` adicional |
| `sb_trash_sure_v1` | `SureOp[]` com `_deletedAt` adicional |
| `sb_trash_dg_v1` | `DGOp[]` com `_deletedAt` adicional |
| `sb_sync_v1` | `{url, pin, auto}` |
