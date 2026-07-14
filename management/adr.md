# Architecture Decision Records

## ADR-001: Namespace Pattern (IIFE) para Refatoração

**Status**: Accepted

**Contexto**: O StakeBet é um single-file HTML de ~3.080 linhas com ~2.000 linhas de JavaScript no escopo global. Precisa ser refatorado para melhor manutenção, mas:
- Deve continuar funcionando como arquivo único offline
- Não pode usar build step (webpack, vite, etc.)
- Não pode usar ES modules (type="module" quebraria file:// em alguns navegadores)
- Deve manter 100% de compatibilidade com dados existentes no localStorage

**Alternativas Consideradas**:

1. **ES Modules (`<script type="module">`)**: Rejeitado — alguns navegadores bloqueiam módulos ES quando abertos via `file://` por CORS.
2. **CommonJS/AMD**: Rejeitado — requer build step (browserify/webpack).
3. **Classes ES6 com static methods**: Viável, mas overengineering para um código sem estado interno complexo.
4. **IIFE + Namespace objects**: ✅ Escolhido — zero dependências, funciona em `file://`, organiza o código sem overhead.

**Decisão**: Usar o padrão IIFE com namespaces aninhados em um único objeto global `window.SB`.

```javascript
window.SB = window.SB || {};

window.SB.Util = (function() {
  function R(n) { return Math.round(n||0); }
  function fmtMoney(n) { ... }
  return { R: R, fmtMoney: fmtMoney };
})();
```

Cada módulo expõe apenas sua interface pública. Funções internas não são exportadas.

**Consequências**:
- ✅ Navegador compatível com `file://`
- ✅ Sem build step
- ✅ Encapsulamento real via closures
- ✅ Interface pública explícita em cada módulo
- ⚠️ Referências internas precisam ser atualizadas (ex: `SB.Util.fmtMoney()` em vez de `fmtMoney()`)
- ⚠️ Handlers `onclick` em strings HTML precisam usar `SB.Modulo.fn()` em vez de `fn()`
