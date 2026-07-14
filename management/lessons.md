# StakeBet — Lessons Learned

## L1 — Cuidado com strings HTML que referenciam funções globais

O código original gera HTML com handlers `onclick="fn(args)"`. Ao mover funções para namespaces, esses handlers precisam ser atualizados para `onclick="SB.Modulo.fn(args)"`. Uma busca minuciosa por todas as ocorrências em strings de template é essencial — esquecer uma quebra a funcionalidade silenciosamente (sem erro de console visível até o clique).

## L2 — Dependências cíclicas são armadilhas

Módulos como `SB.Config` e `SB.Nav` potencialmente criam ciclos: Config chama Nav (showTab) e Nav chama Config (fillCfgForm). A solução é usar lazy references — invocar pelo namespace completo `SB.Nav.showTab()` em vez de capturar a referência no momento da definição do IIFE. Como todos os namespaces são propriedades de `window.SB`, eles estão disponíveis no momento da chamada, não da definição.

## L3 — IDs do DOM são o contrato oculto

Cada função de renderização espera elementos DOM com IDs específicos (ex: `s-hero`, `u-stats`, `dg-monthly`). Esses IDs são o "contrato" entre HTML e JS. A refatoração não deve renomear nenhum ID do DOM.

## L4 — Versionamento das chaves localStorage

As chaves já usam suffix `_v1` (ex: `sb_simples_v1`), o que é boa prática. Qualquer migração futura de formato deve usar `_v2` e incluir lógica de migração. Esta refatoração não altera formato — mantém `_v1`.
