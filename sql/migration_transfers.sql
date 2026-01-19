-- =============================================
-- Migration: Balance Transfers System
-- Transfers balance (positive or negative) between blocks/months
-- =============================================

-- Balance transfers (confirmed transfers)
CREATE TABLE IF NOT EXISTS balance_transfers (
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
CREATE TABLE IF NOT EXISTS pending_transfers (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_balance_transfers_user ON balance_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transfers_to_block ON balance_transfers(to_block_id);
CREATE INDEX IF NOT EXISTS idx_balance_transfers_from_block ON balance_transfers(from_block_id);
CREATE INDEX IF NOT EXISTS idx_balance_transfers_to_month ON balance_transfers(to_month_year);
CREATE INDEX IF NOT EXISTS idx_balance_transfers_status ON balance_transfers(status);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_user ON pending_transfers(user_id);

-- RLS Policies
ALTER TABLE balance_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_transfers ENABLE ROW LEVEL SECURITY;

-- Policies for balance_transfers
CREATE POLICY "Users see their transfers" ON balance_transfers
    FOR SELECT USING (true);

CREATE POLICY "Users create transfers" ON balance_transfers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update transfers" ON balance_transfers
    FOR UPDATE USING (true);

CREATE POLICY "Users delete transfers" ON balance_transfers
    FOR DELETE USING (true);

-- Policies for pending_transfers
CREATE POLICY "Users see their pending transfers" ON pending_transfers
    FOR SELECT USING (true);

CREATE POLICY "Users create pending transfers" ON pending_transfers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update pending transfers" ON pending_transfers
    FOR UPDATE USING (true);

CREATE POLICY "Users delete pending transfers" ON pending_transfers
    FOR DELETE USING (true);
