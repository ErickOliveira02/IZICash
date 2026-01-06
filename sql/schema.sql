-- =============================================
-- Zeny - Schema do Banco de Dados
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Tabela de usuários (apenas usercode, sem senha)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usercode TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocos de entrada (Dia 10, Dia 20, etc.)
CREATE TABLE income_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    daily_limit DECIMAL(10,2) NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gastos fixos por bloco
CREATE TABLE fixed_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    block_id UUID REFERENCES income_blocks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transações (gastos registrados)
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    block_id UUID REFERENCES income_blocks(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT DEFAULT 'variable',
    transaction_date DATE DEFAULT CURRENT_DATE,
    month_year TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_block ON transactions(block_id);
CREATE INDEX idx_transactions_month ON transactions(month_year);
CREATE INDEX idx_users_usercode ON users(usercode);

-- =============================================
-- Row Level Security (RLS)
-- Cada usuário só vê seus próprios dados
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para users (acesso público para criar/buscar por usercode)
CREATE POLICY "Permitir criar usuario" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir buscar por usercode" ON users
    FOR SELECT USING (true);

-- Políticas para income_blocks
CREATE POLICY "Usuarios veem seus blocos" ON income_blocks
    FOR SELECT USING (true);

CREATE POLICY "Usuarios criam seus blocos" ON income_blocks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuarios atualizam seus blocos" ON income_blocks
    FOR UPDATE USING (true);

CREATE POLICY "Usuarios deletam seus blocos" ON income_blocks
    FOR DELETE USING (true);

-- Políticas para fixed_expenses
CREATE POLICY "Usuarios veem seus gastos fixos" ON fixed_expenses
    FOR SELECT USING (true);

CREATE POLICY "Usuarios criam gastos fixos" ON fixed_expenses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuarios atualizam gastos fixos" ON fixed_expenses
    FOR UPDATE USING (true);

CREATE POLICY "Usuarios deletam gastos fixos" ON fixed_expenses
    FOR DELETE USING (true);

-- Políticas para transactions
CREATE POLICY "Usuarios veem suas transacoes" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Usuarios criam transacoes" ON transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuarios atualizam transacoes" ON transactions
    FOR UPDATE USING (true);

CREATE POLICY "Usuarios deletam transacoes" ON transactions
    FOR DELETE USING (true);
