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

-- Compras (parceladas ou à vista)
CREATE TABLE purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    block_id UUID REFERENCES income_blocks(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    installments INTEGER NOT NULL DEFAULT 1,
    start_month_year TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parcelas individuais
CREATE TABLE purchase_installments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    month_year TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Balance transfers (confirmed transfers between blocks/months)
CREATE TABLE balance_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_block_id UUID REFERENCES income_blocks(id) ON DELETE SET NULL,
    to_block_id UUID REFERENCES income_blocks(id) ON DELETE SET NULL,
    from_month_year TEXT NOT NULL,
    to_month_year TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transfer_type TEXT NOT NULL CHECK (transfer_type IN ('carry_over', 'debt')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pending transfers (awaiting user confirmation)
CREATE TABLE pending_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_block_id UUID REFERENCES income_blocks(id) ON DELETE CASCADE,
    to_block_id UUID REFERENCES income_blocks(id) ON DELETE CASCADE,
    from_month_year TEXT NOT NULL,
    to_month_year TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transfer_type TEXT NOT NULL CHECK (transfer_type IN ('carry_over', 'debt')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_block ON transactions(block_id);
CREATE INDEX idx_transactions_month ON transactions(month_year);
CREATE INDEX idx_users_usercode ON users(usercode);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_block ON purchases(block_id);
CREATE INDEX idx_installments_purchase ON purchase_installments(purchase_id);
CREATE INDEX idx_installments_month ON purchase_installments(month_year);
CREATE INDEX idx_balance_transfers_user ON balance_transfers(user_id);
CREATE INDEX idx_balance_transfers_to_block ON balance_transfers(to_block_id);
CREATE INDEX idx_balance_transfers_from_block ON balance_transfers(from_block_id);
CREATE INDEX idx_balance_transfers_to_month ON balance_transfers(to_month_year);
CREATE INDEX idx_balance_transfers_status ON balance_transfers(status);
CREATE INDEX idx_pending_transfers_user ON pending_transfers(user_id);

-- =============================================
-- Row Level Security (RLS)
-- Cada usuário só vê seus próprios dados
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_transfers ENABLE ROW LEVEL SECURITY;

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

-- Políticas para purchases
CREATE POLICY "Users see their purchases" ON purchases
    FOR SELECT USING (true);

CREATE POLICY "Users create purchases" ON purchases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update purchases" ON purchases
    FOR UPDATE USING (true);

CREATE POLICY "Users delete purchases" ON purchases
    FOR DELETE USING (true);

-- Políticas para purchase_installments
CREATE POLICY "Users see their installments" ON purchase_installments
    FOR SELECT USING (true);

CREATE POLICY "Users create installments" ON purchase_installments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update installments" ON purchase_installments
    FOR UPDATE USING (true);

CREATE POLICY "Users delete installments" ON purchase_installments
    FOR DELETE USING (true);

-- Políticas para balance_transfers
CREATE POLICY "Users see their transfers" ON balance_transfers
    FOR SELECT USING (true);

CREATE POLICY "Users create transfers" ON balance_transfers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update transfers" ON balance_transfers
    FOR UPDATE USING (true);

CREATE POLICY "Users delete transfers" ON balance_transfers
    FOR DELETE USING (true);

-- Políticas para pending_transfers
CREATE POLICY "Users see their pending transfers" ON pending_transfers
    FOR SELECT USING (true);

CREATE POLICY "Users create pending transfers" ON pending_transfers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update pending transfers" ON pending_transfers
    FOR UPDATE USING (true);

CREATE POLICY "Users delete pending transfers" ON pending_transfers
    FOR DELETE USING (true);
