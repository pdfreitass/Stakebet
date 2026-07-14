# StakeBet — Vision

## V1 — Arquitetura Modular (Namespaces)

**Problema**: O arquivo `stakebet (26).html` contém ~2.000 linhas de JavaScript no escopo global (`window`), com ~154 funções e variáveis sem encapsulamento. Isso torna o código difícil de manter, testar e estender.

**Solução**: Refatorar o JavaScript monolítico em módulos organizados via namespaces dentro de um único objeto global `window.SB`, usando o padrão IIFE (Immediately Invoked Function Expression). Cada namespace tem uma responsabilidade clara e única:

- `SB.Util` — Funções utilitárias puras (formatação de moeda, datas, matemática)
- `SB.Html` — Funções que geram strings HTML (cards, gráficos, barras)
- `SB.Store` — Abstração de localStorage com as 9 chaves existentes
- `SB.Config` — Configurações do usuário (banca, meta, ciclos) + zerar tudo
- `SB.Casas` — Gestão de casas de apostas (bookmakers)
- `SB.Nav` — Navegação entre abas e gestão de estado da UI
- `SB.Simples` — CRUD de apostas simples + estatísticas + renderização
- `SB.Surebets` — CRUD de surebets + calculadora + estatísticas + renderização
- `SB.DuploGreen` — CRUD de duplo green + calculadora + estatísticas + renderização
- `SB.Lixeira` — Lixeira unificada (restaurar/excluir definitivo)
- `SB.Relatorios` — Exportação CSV/PDF e relatórios por período
- `SB.Sync` — Sincronização na nuvem (Vercel + PostgreSQL)
- `SB.Home` — Dashboard principal

**Restrições**: Sem build step, sem framework externo, o arquivo continua sendo um único `.html` que funciona offline no navegador. As 9 chaves do localStorage mantêm nomes e formatos idênticos.

**Implementado por**: Spec 1 (refactor-namespaces)

## V2 — Clean Architecture (4 Camadas)

**Problema**: Os 13 namespaces estão organizados de forma plana, sem separação clara entre regras de negócio, infraestrutura, casos de uso e apresentação. IA tem dificuldade em identificar o que pode ser modificado sem efeitos colaterais (ex: funções que tocam localStorage vs funções puras).

**Solução**: Reorganizar em 4 camadas arquiteturais com regra de dependência explícita:

```
SB.Domain        → Funções puras (zero dependências)
SB.Infrastructure → Adaptadores externos (localStorage, fetch, export)
SB.App           → Casos de uso (orquestração)
SB.UI            → Apresentação (HTML, DOM, navegação)
```

**Regra de Dependência**: UI → App → Domain, UI → Infrastructure → Domain. App e Infrastructure são pares.

**Mapeamento**:
| Namespace Original | Camada |
|---|---|
| `SB.Util` | `SB.Domain` |
| `SB.Store` | `SB.Infrastructure.Storage` |
| `SB.Sync` | `SB.Infrastructure.Sync` |
| `SB.Config`, `SB.Casas`, `SB.Simples`, `SB.Surebets`, `SB.DuploGreen`, `SB.Lixeira`, `SB.Relatorios` | `SB.App.*` |
| `SB.Html`, `SB.Nav`, `SB.Home` | `SB.UI.*` |

**Retrocompatibilidade**: Código existente continua usando `SB.Util.fn()`. Novo código pode usar `SB.Domain.fn()`.

**Implementado por**: Spec 2 (clean-architecture)
