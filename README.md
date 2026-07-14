# StakeBet — Controle profissional de apostas

Aplicativo web para gestão de apostas esportivas com 3 estratégias:
- **Apostas Simples** — Green/Red/Live/Cashout
- **Surebets** — Arbitragem multi-casa com calculadora integrada
- **Duplo Green** — Pagamento antecipado com múltiplas entradas

## 🚀 Deploy rápido

### 1. Supabase (banco + auth)
```bash
# Crie um projeto em https://supabase.com
# Rode o schema SQL no SQL Editor:
cat supabase/schema.sql
# Copie as credenciais (URL + anon key) de Settings > API
```

### 2. Vercel (frontend)
```bash
npm install
# Edite public/js/infrastructure/supabase.js com suas credenciais
# ou defina as variáveis no init.js:
#   window.SB_SUPABASE_URL = 'https://xxx.supabase.co'
#   window.SB_SUPABASE_KEY = 'xxx'
npm run deploy
```

### 3. Local dev
```bash
npm install
npm run dev
# Abra http://localhost:3000
```

## 📁 Estrutura

```
public/
├── index.html              ← App principal
├── login.html              ← Tela de login/cadastro
├── css/style.css           ← Estilos (tema escuro)
└── js/
    ├── domain/             ← Regras de negócio puras
    ├── infrastructure/     ← Supabase, Storage, Export
    ├── app/                ← Casos de uso (CRUD, Auth)
    ├── ui/                 ← Renderização HTML
    └── init.js             ← Bootstrap
supabase/
└── schema.sql              ← Schema do banco
```

## 🏗️ Arquitetura

```
SB.Domain       → Funções puras (zero dependências)
SB.Infrastructure → Adaptadores externos (Supabase, CSV/PDF)
SB.App          → Casos de uso (Auth, Config, CRUD)
SB.UI           → Apresentação (HTML, DOM, navegação)
```

## 🔐 Autenticação

Email + senha via Supabase Auth. Dados isolados por usuário (Row-Level Security).
