// =============================================
// Zeny - Conexão com Supabase
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
        this.accessToken = null;
    }

    getHeaders() {
        const headers = {
            'apikey': this.key,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        } else {
            headers['Authorization'] = `Bearer ${this.key}`;
        }
        return headers;
    }

    async request(table, method = 'GET', query = '', body = null) {
        const url = `${this.url}/rest/v1/${table}${query}`;
        const options = {
            method,
            headers: this.getHeaders()
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

    // ========== AUTENTICAÇÃO ==========

    async signUp(email, password, username) {
        const response = await fetch(`${this.url}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': this.key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                data: { username }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || data.msg || 'Erro ao cadastrar');
        }

        return data;
    }

    async signIn(email, password) {
        const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': this.key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || data.msg || 'Email ou senha incorretos');
        }

        // Salvar token
        this.accessToken = data.access_token;
        localStorage.setItem('izi_access_token', data.access_token);
        localStorage.setItem('izi_refresh_token', data.refresh_token);

        return data;
    }

    async signOut() {
        const token = localStorage.getItem('izi_access_token');
        if (token) {
            try {
                await fetch(`${this.url}/auth/v1/logout`, {
                    method: 'POST',
                    headers: {
                        'apikey': this.key,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (e) {
                // Ignora erros de logout
            }
        }

        this.accessToken = null;
        localStorage.removeItem('izi_access_token');
        localStorage.removeItem('izi_refresh_token');
        localStorage.removeItem('izi_user');
    }

    // ========== GOOGLE OAUTH ==========

    signInWithGoogle() {
        const redirectUrl = window.location.origin + window.location.pathname;
        const authUrl = `${this.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
        window.location.href = authUrl;
    }

    async handleOAuthCallback() {
        // Verifica se há tokens no hash da URL (após redirect do Google)
        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token')) {
            return null;
        }

        // Parse dos parâmetros do hash
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken) {
            return null;
        }

        // Salva os tokens
        this.accessToken = accessToken;
        localStorage.setItem('izi_access_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('izi_refresh_token', refreshToken);
        }

        // Limpa o hash da URL
        history.replaceState(null, '', window.location.pathname);

        // Busca dados do usuário
        const response = await fetch(`${this.url}/auth/v1/user`, {
            headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao obter dados do usuário');
        }

        const user = await response.json();
        return { user, isOAuth: true };
    }

    async resetPassword(email) {
        const response = await fetch(`${this.url}/auth/v1/recover`, {
            method: 'POST',
            headers: {
                'apikey': this.key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error_description || data.msg || 'Erro ao enviar email');
        }

        return true;
    }

    async updatePassword(newPassword) {
        const token = localStorage.getItem('izi_access_token');
        if (!token) {
            throw new Error('Usuário não autenticado');
        }

        const response = await fetch(`${this.url}/auth/v1/user`, {
            method: 'PUT',
            headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: newPassword
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error_description || data.msg || 'Erro ao definir senha');
        }

        return true;
    }

    async getSession() {
        const token = localStorage.getItem('izi_access_token');
        if (!token) return null;

        this.accessToken = token;

        try {
            const response = await fetch(`${this.url}/auth/v1/user`, {
                headers: {
                    'apikey': this.key,
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // Token inválido, tenta refresh
                return await this.refreshSession();
            }

            const user = await response.json();
            return { user };
        } catch (error) {
            return null;
        }
    }

    async refreshSession() {
        const refreshToken = localStorage.getItem('izi_refresh_token');
        if (!refreshToken) return null;

        try {
            const response = await fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'apikey': this.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: refreshToken
                })
            });

            if (!response.ok) {
                this.signOut();
                return null;
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            localStorage.setItem('izi_access_token', data.access_token);
            localStorage.setItem('izi_refresh_token', data.refresh_token);

            return { user: data.user };
        } catch (error) {
            this.signOut();
            return null;
        }
    }

    // ========== USERS (perfil local) ==========

    async getUserByAuthId(authId) {
        const data = await this.request('users', 'GET', `?auth_id=eq.${authId}&select=*`);
        return data.length > 0 ? data[0] : null;
    }

    async getEmailByUsername(username) {
        // Busca por username ou usercode (case insensitive)
        const lower = username.toLowerCase();
        const data = await this.request('users', 'GET', `?or=(username.ilike.${lower},usercode.ilike.${lower})&select=email`);
        return data.length > 0 ? data[0].email : null;
    }

    async createUserProfile(authId, email, username) {
        const data = await this.request('users', 'POST', '', {
            auth_id: authId,
            email,
            username,
            usercode: username.toLowerCase()
        });
        return data[0];
    }

    async getOrCreateUserProfile(authId, email, username) {
        let user = await this.getUserByAuthId(authId);
        if (!user) {
            user = await this.createUserProfile(authId, email, username);
        }
        return user;
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

    // ========== PURCHASES (Compras parceladas) ==========

    async createPurchase(userId, blockId, description, totalAmount, installments, startMonthYear) {
        const purchase = await this.request('purchases', 'POST', '', {
            user_id: userId,
            block_id: blockId,
            description,
            total_amount: totalAmount,
            installments,
            start_month_year: startMonthYear
        });

        const purchaseId = purchase[0].id;
        const installmentAmount = Math.round((totalAmount / installments) * 100) / 100;

        const [startYear, startMonth] = startMonthYear.split('-').map(Number);
        const installmentRecords = [];

        for (let i = 0; i < installments; i++) {
            let month = startMonth + i;
            let year = startYear;
            while (month > 12) {
                month -= 12;
                year++;
            }
            const monthYear = `${year}-${String(month).padStart(2, '0')}`;

            installmentRecords.push({
                purchase_id: purchaseId,
                installment_number: i + 1,
                month_year: monthYear,
                amount: installmentAmount,
                paid: false
            });
        }

        await this.request('purchase_installments', 'POST', '', installmentRecords);

        return purchase[0];
    }

    async getPurchaseInstallments(userId, monthYear) {
        return this.request('purchase_installments', 'GET',
            `?month_year=eq.${monthYear}&select=*,purchases!inner(id,user_id,block_id,description,total_amount,installments)&purchases.user_id=eq.${userId}&order=created_at.asc`);
    }

    async getInstallmentsByBlock(blockId, monthYear) {
        return this.request('purchase_installments', 'GET',
            `?month_year=eq.${monthYear}&select=*,purchases!inner(id,user_id,block_id,description,total_amount,installments)&purchases.block_id=eq.${blockId}&order=created_at.asc`);
    }

    async toggleInstallmentPaid(installmentId, paid) {
        return this.request('purchase_installments', 'PATCH', `?id=eq.${installmentId}`, { paid });
    }

    async deletePurchase(purchaseId) {
        return this.request('purchases', 'DELETE', `?id=eq.${purchaseId}`);
    }

    async getPurchasesByUser(userId) {
        return this.request('purchases', 'GET',
            `?user_id=eq.${userId}&select=*,purchase_installments(*)&order=created_at.desc`);
    }

    // ========== BALANCE TRANSFERS ==========

    async getBalanceTransfers(userId, monthYear = null) {
        let query = `?user_id=eq.${userId}&select=*&order=created_at.desc`;
        if (monthYear) {
            query = `?user_id=eq.${userId}&or=(from_month_year.eq.${monthYear},to_month_year.eq.${monthYear})&select=*&order=created_at.desc`;
        }
        return this.request('balance_transfers', 'GET', query);
    }

    async getActiveTransfersForBlock(blockId, monthYear) {
        return this.request('balance_transfers', 'GET',
            `?to_block_id=eq.${blockId}&to_month_year=eq.${monthYear}&status=eq.active&select=*`);
    }

    async getOutgoingTransfersForBlock(blockId, monthYear) {
        return this.request('balance_transfers', 'GET',
            `?from_block_id=eq.${blockId}&from_month_year=eq.${monthYear}&status=eq.active&select=*`);
    }

    async createBalanceTransfer(userId, fromBlockId, toBlockId, fromMonthYear, toMonthYear, amount, transferType) {
        const data = await this.request('balance_transfers', 'POST', '', {
            user_id: userId,
            from_block_id: fromBlockId,
            to_block_id: toBlockId,
            from_month_year: fromMonthYear,
            to_month_year: toMonthYear,
            amount,
            transfer_type: transferType,
            status: 'active'
        });
        return data[0];
    }

    async updateBalanceTransferStatus(transferId, status) {
        return this.request('balance_transfers', 'PATCH', `?id=eq.${transferId}`, { status });
    }

    async deleteBalanceTransfer(transferId) {
        return this.request('balance_transfers', 'DELETE', `?id=eq.${transferId}`);
    }

    // ========== PENDING TRANSFERS ==========

    async getPendingTransfers(userId) {
        return this.request('pending_transfers', 'GET',
            `?user_id=eq.${userId}&select=*&order=created_at.asc`);
    }

    async createPendingTransfer(userId, fromBlockId, toBlockId, fromMonthYear, toMonthYear, amount, transferType) {
        const data = await this.request('pending_transfers', 'POST', '', {
            user_id: userId,
            from_block_id: fromBlockId,
            to_block_id: toBlockId,
            from_month_year: fromMonthYear,
            to_month_year: toMonthYear,
            amount,
            transfer_type: transferType
        });
        return data[0];
    }

    async deletePendingTransfer(transferId) {
        return this.request('pending_transfers', 'DELETE', `?id=eq.${transferId}`);
    }

    async deleteAllPendingTransfers(userId) {
        return this.request('pending_transfers', 'DELETE', `?user_id=eq.${userId}`);
    }
}

// Instância global
window.supabase = new SupabaseClient();
