# StakeBet — Roadmap

## Specs

| # | Nome | Status | Referências |
|---|---|---|---|
| 1 | refactor-namespaces | audited | ADR-001 |
| 2 | clean-architecture | audited | ADR-001, Spec-1 |
| 3 | multi-file-supabase | audited | ADR-001, Specs 1-2 |

## Grafo de Dependências

```
Spec 1 (refactor-namespaces) — audited
  └── Spec 2 (clean-architecture) — audited
        └── Spec 3 (multi-file-supabase) — audited
              └── 23 arquivos, Supabase Auth + DB, Vercel deploy
```

## Status Legend

- `planned`: Entrada no roadmap criada após /spec-plan
- `created`: Documentos de spec criados após /spec-new
- `verified`: Specs verificadas e auto-corrigidas após /spec-verify
- `in-progress`: Código sendo escrito
- `implemented`: Implementação completa
- `audited`: Auditoria passou, spec concluída
- `proposed`: Ideia inicial
- `discarded`: Intencionalmente abandonada
