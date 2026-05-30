# 🍽️ Receitas AI — Chef Inteligente

App de receitas com IA que sugere pratos com base nos ingredientes disponíveis.

---

## 🚀 Como subir no GitHub + Vercel

### 1. Instalar dependências
```bash
npm install
```

### 2. Testar localmente
```bash
npm run dev
```
Acesse: http://localhost:5173

### 3. Subir no GitHub

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/receitas-ai.git
git push -u origin main
```

### 4. Deploy no Vercel

1. Acesse https://vercel.com e faça login com sua conta GitHub
2. Clique em **"Add New Project"**
3. Selecione o repositório `receitas-ai`
4. Configurações:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Clique em **Deploy** ✅

Pronto! Em ~1 minuto seu app estará em um link público como:
`https://receitas-ai.vercel.app`

---

## 📱 PWA — Instalar no celular

Após o deploy:
1. Abra o link no Chrome (Android) ou Safari (iPhone)
2. Toque em **"Adicionar à tela inicial"**
3. O app será instalado como um app nativo!

---

## 🖼️ Ícones

Substitua os arquivos em `/public/icons/` pelos ícones do app:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

---

## 🛠️ Tecnologias

- React 18
- Vite 5
- vite-plugin-pwa
- API Claude (Anthropic)

---

Desenvolvido por **Rafael Mulato**
