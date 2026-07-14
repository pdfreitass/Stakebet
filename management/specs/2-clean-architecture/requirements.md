---
name: clean-architecture
status: audited
references: [ADR-001, Spec-1]
---

# Spec 2 — Clean Architecture (4 Camadas)

## Objetivo

Reorganizar os 13 namespaces planos do Spec #1 em 4 camadas arquiteturais com regra de dependência explícita, mantendo 100% de retrocompatibilidade.

## Camadas

### LAYER 1: SB.Domain — Pure Business Logic
**Dependências**: ZERO (sem DOM, localStorage, fetch, ou qualquer API externa)
**Contém**: 
- `SB.Util` → Formatação (R, R2, fmtMoney, fmtDataShort, fmtDataHora)
- `SB.Util` → Datas (sureEventDate, splitToDateTime, combineDateTime)
- `SB.Util` → Matemática (pct, probImplicita)
- `SB.Simples` → luc(), sortLucroBet(), statsSimples()
- `SB.Surebets` → sureBadgeStatus(), statsSure()
- `SB.DuploGreen` → dgLucro(), statsDG()
- `SB.Html` → computeEquity(), monthlyBuckets()

### LAYER 2: SB.Infrastructure — External Adapters
**Dependências**: SB.Domain apenas
**Contém**:
- `SB.Infrastructure.Storage` (= SB.Store) → localStorage CRUD
- `SB.Infrastructure.Sync` (= SB.Sync) → fetch API, scheduleAutoPush, SYNC_FILE_*

### LAYER 3: SB.App — Use Cases / Orchestration
**Dependências**: SB.Domain + SB.Infrastructure
**Contém**:
- `SB.App.Config` (= SB.Config) → Gestão de banca, metas, ciclos
- `SB.App.Casas` (= SB.Casas) → CRUD de bookmakers
- `SB.App.Simples` (= SB.Simples) → CRUD de apostas + export
- `SB.App.Surebets` (= SB.Surebets) → CRUD de surebets + export
- `SB.App.DuploGreen` (= SB.DuploGreen) → CRUD de duplo green + export
- `SB.App.Lixeira` (= SB.Lixeira) → Restore/delete permanente
- `SB.App.Relatorios` (= SB.Relatorios) → Coleta e coordenação de relatórios

### LAYER 4: SB.UI — Presentation
**Dependências**: SB.Domain + SB.Infrastructure + SB.App
**Contém**:
- `SB.UI.Html` (= SB.Html) → Templates HTML (cards, gráficos, barras)
- `SB.UI.Navigation` (= SB.Nav) → Estado de navegação, tabs
- `SB.UI.Home` (= SB.Home) → Dashboard principal

## Retrocompatibilidade

- `window.SB.Domain = SB.Util` → novo código usa `SB.Domain.fmtMoney()`
- `window.SB.Infrastructure = { Storage: SB.Store, Sync: SB.Sync }` → `SB.Infrastructure.Storage.load()`
- `window.SB.App = { Config: SB.Config, ... }` → `SB.App.Simples.addBet()`
- `window.SB.UI = { Html: SB.Html, ... }` → `SB.UI.Html.statCard()`

Código existente continua inalterado — todas as referências antigas (`SB.Util.fn()`) funcionam.

## Acceptance Criteria

- ✅ 4 layer markers inseridos no código-fonte
- ✅ Layer mapping objects criados (SB.Domain, SB.Infrastructure, SB.App, SB.UI)
- ✅ 13 namespaces originais preservados e funcionais
- ✅ 9 chaves localStorage inalteradas
- ✅ 60/60 onclick handlers com prefixo SB. preservados
- ✅ Nenhuma quebra de funcionalidade (retrocompatível)
