# IZI Cash - Controle Financeiro Pessoal

Sistema simples de controle financeiro por blocos de entrada.

## Como Configurar

### 1. Criar conta no Supabase (Gratuito)

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em **Start your project**
3. Faça login com GitHub ou Google
4. Clique em **New Project**
5. Preencha:
   - **Name:** IZICash
   - **Database Password:** crie uma senha forte
   - **Region:** South America (São Paulo)
6. Clique em **Create new project** e aguarde (2-3 minutos)

### 2. Criar as tabelas do banco

1. No painel do Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `sql/schema.sql`
4. Cole no editor e clique em **Run**
5. Deve aparecer "Success" verde

### 3. Pegar as credenciais

1. Vá em **Settings** (ícone de engrenagem)
2. Clique em **API** no submenu
3. Copie:
   - **Project URL** (ex: `https://xxxx.supabase.co`)
   - **anon public** key (começa com `eyJ...`)

### 4. Configurar o projeto

1. Abra o arquivo `js/config.js`
2. Substitua os valores:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://SEU-PROJETO.supabase.co',  // Cole sua URL aqui
    anonKey: 'eyJ...'  // Cole sua chave anon aqui
};
```

### 5. Usar o app

1. Abra o arquivo `index.html` no navegador
2. Digite um código de usuário (ex: `joao2024`)
3. Pronto! Os blocos padrão serão criados automaticamente

---

## Funcionalidades

- **2 Blocos independentes:** Dia 10 e Dia 20 (editáveis)
- **Gastos fixos:** Pré-configurados, editáveis nas configurações
- **Gastos variáveis:** Adicione rapidamente com o botão +
- **Limite diário:** Alerta visual quando próximo do limite
- **Histórico mensal:** Navegue entre meses
- **Multi-dispositivo:** Acesse de qualquer lugar com seu código

## Estrutura de Arquivos

```
IZICash/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos
├── js/
│   ├── config.js       # Credenciais Supabase (editar)
│   ├── supabase.js     # Conexão com banco
│   └── app.js          # Lógica do app
├── sql/
│   └── schema.sql      # Script do banco
└── README.md           # Este arquivo
```

## Hospedagem (Opcional)

Para acessar de qualquer lugar sem precisar abrir o arquivo local:

### Opção 1: Netlify (Grátis)
1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta IZICash para o painel
3. Pronto! Você receberá uma URL pública

### Opção 2: GitHub Pages (Grátis)
1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Ative GitHub Pages nas configurações

### Opção 3: Vercel (Grátis)
1. Acesse [vercel.com](https://vercel.com)
2. Conecte com GitHub
3. Deploy automático

---

## Dúvidas Frequentes

**P: O que é o "código de usuário"?**
R: É um código único que você escolhe (ex: `maria123`). Não precisa de email ou senha.

**P: Meus dados ficam salvos onde?**
R: No Supabase (nuvem). Você pode acessar de qualquer dispositivo.

**P: Posso usar offline?**
R: Não. Precisa de internet para sincronizar os dados.

**P: É seguro?**
R: Sim, mas o código de usuário não é uma senha. Se alguém souber seu código, pode ver seus dados. Use um código que só você saiba.

**P: Posso adicionar mais blocos?**
R: Sim! Nas configurações você pode adicionar novos blocos de entrada.

---

Feito com 💚 para simplificar suas finanças.
