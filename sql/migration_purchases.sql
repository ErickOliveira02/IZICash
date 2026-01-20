-- =============================================
-- Migration: Add purchases (installment support)
-- Run this in Supabase SQL Editor
-- =============================================

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

-- Índices para performance
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_block ON purchases(block_id);
CREATE INDEX idx_installments_purchase ON purchase_installments(purchase_id);
CREATE INDEX idx_installments_month ON purchase_installments(month_year);

-- RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_installments ENABLE ROW LEVEL SECURITY;

-- Policies para purchases
CREATE POLICY "Users see their purchases" ON purchases
    FOR SELECT USING (true);

CREATE POLICY "Users create purchases" ON purchases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update purchases" ON purchases
    FOR UPDATE USING (true);

CREATE POLICY "Users delete purchases" ON purchases
    FOR DELETE USING (true);

-- Policies para purchase_installments
CREATE POLICY "Users see their installments" ON purchase_installments
    FOR SELECT USING (true);

CREATE POLICY "Users create installments" ON purchase_installments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update installments" ON purchase_installments
    FOR UPDATE USING (true);

CREATE POLICY "Users delete installments" ON purchase_installments
    FOR DELETE USING (true);
