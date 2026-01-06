// =============================================
// IZI Cash - Conexão com Supabase
// =============================================

class SupabaseClient {
    constructor() {
        this.url = SUPABASE_CONFIG.url;
        this.key = SUPABASE_CONFIG.anonKey;
        this.headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    async request(table, method = 'GET', query = '', body = null) {
        const url = `${this.url}/rest/v1/${table}${query}`;
        const options = {
            method,
            headers: this.headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        if (method === 'DELETE') {
            return true;
        }

        return response.json();
    }

    // ========== USERS ==========

    async getUserByCode(usercode) {
        const data = await this.request('users', 'GET', `?usercode=eq.${usercode}&select=*`);
        return data.length > 0 ? data[0] : null;
    }

    async createUser(usercode) {
        const data = await this.request('users', 'POST', '', { usercode });
        return data[0];
    }

    async getOrCreateUser(usercode) {
        let user = await this.getUserByCode(usercode);
        let isNewUser = false;
        if (!user) {
            user = await this.createUser(usercode);
            isNewUser = true;
        }
        return { user, isNewUser };
    }

    // ========== INCOME BLOCKS ==========

    async getBlocks(userId) {
        return this.request('income_blocks', 'GET',
            `?user_id=eq.${userId}&select=*&order=day_of_month.asc`);
    }

    async createBlock(userId, name, dayOfMonth, amount, dailyLimit = 0) {
        const data = await this.request('income_blocks', 'POST', '', {
            user_id: userId,
            name,
            day_of_month: dayOfMonth,
            amount,
            daily_limit: dailyLimit
        });
        return data[0];
    }

    async updateBlock(blockId, updates) {
        return this.request('income_blocks', 'PATCH', `?id=eq.${blockId}`, updates);
    }

    async deleteBlock(blockId) {
        return this.request('income_blocks', 'DELETE', `?id=eq.${blockId}`);
    }

    // ========== FIXED EXPENSES ==========

    async getFixedExpenses(blockId) {
        return this.request('fixed_expenses', 'GET',
            `?block_id=eq.${blockId}&select=*&order=created_at.asc`);
    }

    async createFixedExpense(blockId, name, amount) {
        const data = await this.request('fixed_expenses', 'POST', '', {
            block_id: blockId,
            name,
            amount
        });
        return data[0];
    }

    async updateFixedExpense(expenseId, updates) {
        return this.request('fixed_expenses', 'PATCH', `?id=eq.${expenseId}`, updates);
    }

    async deleteFixedExpense(expenseId) {
        return this.request('fixed_expenses', 'DELETE', `?id=eq.${expenseId}`);
    }

    // ========== FIXED EXPENSE PAYMENTS (Marcar como pago) ==========

    async getPayments(expenseIds, monthYear) {
        if (expenseIds.length === 0) return [];
        const ids = expenseIds.join(',');
        return this.request('fixed_expense_payments', 'GET',
            `?expense_id=in.(${ids})&month_year=eq.${monthYear}&select=*`);
    }

    async togglePayment(expenseId, monthYear, paid) {
        // Tenta atualizar primeiro
        const existing = await this.request('fixed_expense_payments', 'GET',
            `?expense_id=eq.${expenseId}&month_year=eq.${monthYear}&select=*`);

        if (existing.length > 0) {
            // Atualiza
            return this.request('fixed_expense_payments', 'PATCH',
                `?expense_id=eq.${expenseId}&month_year=eq.${monthYear}`,
                { paid, paid_at: paid ? new Date().toISOString() : null });
        } else {
            // Cria novo
            return this.request('fixed_expense_payments', 'POST', '', {
                expense_id: expenseId,
                month_year: monthYear,
                paid,
                paid_at: paid ? new Date().toISOString() : null
            });
        }
    }

    // ========== TRANSACTIONS ==========

    async getTransactions(userId, monthYear) {
        return this.request('transactions', 'GET',
            `?user_id=eq.${userId}&month_year=eq.${monthYear}&select=*&order=created_at.desc`);
    }

    async getTransactionsByBlock(blockId, monthYear) {
        return this.request('transactions', 'GET',
            `?block_id=eq.${blockId}&month_year=eq.${monthYear}&select=*&order=created_at.desc`);
    }

    async createTransaction(userId, blockId, description, amount, monthYear) {
        const data = await this.request('transactions', 'POST', '', {
            user_id: userId,
            block_id: blockId,
            description,
            amount,
            month_year: monthYear,
            transaction_date: new Date().toISOString().split('T')[0]
        });
        return data[0];
    }

    async deleteTransaction(transactionId) {
        return this.request('transactions', 'DELETE', `?id=eq.${transactionId}`);
    }
}

// Instância global
window.supabase = new SupabaseClient();
