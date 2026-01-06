// =============================================
// Zeny - Aplicação Principal
// =============================================

class ZenyApp {
    constructor() {
        this.authUser = null;  // Usuário do Supabase Auth
        this.user = null;      // Perfil do usuário na tabela users
        this.blocks = [];
        this.fixedExpenses = {};
        this.payments = {};
        this.transactions = {};
        this.currentMonth = this.getCurrentMonthYear();

        this.init();
    }

    // ========== INICIALIZAÇÃO ==========

    async init() {
        this.setupEventListeners();

        // Verificar se já está logado
        const session = await supabase.getSession();
        if (session && session.user) {
            await this.handleAuthSuccess(session.user);
        }
    }

    setupEventListeners() {
        // Login
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Cadastro
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Recuperar senha
        document.getElementById('forgotForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.forgotPassword();
        });

        // Navegação do mês
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));

        // Configurações
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettingsModal());

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

        // Modal de adicionar gasto
        document.getElementById('addExpenseForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Fechar modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Fechar modal clicando fora
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllModals();
            });
        });
    }

    // ========== NAVEGAÇÃO DE TELAS ==========

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('forgotScreen').classList.add('hidden');
        document.getElementById('verifyScreen').classList.add('hidden');
    }

    showRegister() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.remove('hidden');
        document.getElementById('forgotScreen').classList.add('hidden');
        document.getElementById('verifyScreen').classList.add('hidden');
    }

    showForgotPassword() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('forgotScreen').classList.remove('hidden');
        document.getElementById('verifyScreen').classList.add('hidden');
    }

    showVerifyEmail(email) {
        document.getElementById('verifyEmailText').textContent = email;
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('forgotScreen').classList.add('hidden');
        document.getElementById('verifyScreen').classList.remove('hidden');
    }

    showApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('forgotScreen').classList.add('hidden');
        document.getElementById('verifyScreen').classList.add('hidden');
        document.getElementById('appScreen').classList.remove('hidden');
    }

    // ========== AUTENTICAÇÃO ==========

    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showToast('Preencha todos os campos', 'error');
            return;
        }

        this.showLoading();

        try {
            const data = await supabase.signIn(email, password);
            await this.handleAuthSuccess(data.user);
            this.showToast('Login realizado!', 'success');
        } catch (error) {
            console.error('Erro no login:', error);
            this.showToast(error.message || 'Erro ao fazer login', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async register() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

        if (!username || !email || !password) {
            this.showToast('Preencha todos os campos', 'error');
            return;
        }

        if (password !== passwordConfirm) {
            this.showToast('As senhas não coincidem', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('A senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }

        this.showLoading();

        try {
            const data = await supabase.signUp(email, password, username);

            // Verifica se precisa confirmar email
            if (data.user && !data.user.confirmed_at) {
                this.showVerifyEmail(email);
                this.showToast('Cadastro realizado! Verifique seu email.', 'success');
            } else if (data.user) {
                // Já confirmado (ex: email auto-confirm habilitado)
                await this.handleAuthSuccess(data.user);
                this.showToast('Cadastro realizado!', 'success');
            }
        } catch (error) {
            console.error('Erro no cadastro:', error);
            this.showToast(error.message || 'Erro ao cadastrar', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async forgotPassword() {
        const email = document.getElementById('forgotEmail').value.trim();

        if (!email) {
            this.showToast('Digite seu email', 'error');
            return;
        }

        this.showLoading();

        try {
            await supabase.resetPassword(email);
            this.showToast('Email enviado! Verifique sua caixa de entrada.', 'success');
            this.showLogin();
        } catch (error) {
            console.error('Erro ao recuperar senha:', error);
            this.showToast(error.message || 'Erro ao enviar email', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleAuthSuccess(authUser) {
        this.authUser = authUser;

        // Pega ou cria perfil do usuário
        const username = authUser.user_metadata?.username || authUser.email.split('@')[0];
        this.user = await supabase.getOrCreateUserProfile(authUser.id, authUser.email, username);

        await this.loadData();
        this.showApp();

        // Se não tem blocos, mostra setup
        if (this.blocks.length === 0) {
            this.showSetupScreen();
        } else {
            this.hideSetupScreen();
            this.render();
        }
    }

    async logout() {
        await supabase.signOut();
        this.authUser = null;
        this.user = null;
        this.blocks = [];
        this.fixedExpenses = {};
        this.payments = {};
        this.transactions = {};

        document.getElementById('appScreen').classList.add('hidden');
        this.showLogin();

        // Limpar campos
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    }

    // ========== SETUP INICIAL ==========

    showSetupScreen() {
        document.getElementById('setupScreen').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');
    }

    hideSetupScreen() {
        document.getElementById('setupScreen').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
    }

    async createFirstBlock() {
        const name = document.getElementById('setupBlockName').value.trim();
        const day = parseInt(document.getElementById('setupBlockDay').value);
        const amount = parseFloat(document.getElementById('setupBlockAmount').value);
        const dailyLimit = parseFloat(document.getElementById('setupDailyLimit').value) || 0;

        if (!name || !day || isNaN(amount)) {
            this.showToast('Preencha todos os campos', 'error');
            return;
        }

        try {
            await supabase.createBlock(this.user.id, name, day, amount, dailyLimit);
            await this.loadData();

            if (this.blocks.length > 0) {
                this.hideSetupScreen();
                this.render();
                this.showToast('Bloco criado! Agora adicione seus gastos fixos nas configurações.', 'success');
            }
        } catch (error) {
            console.error('Erro ao criar bloco:', error);
            this.showToast('Erro ao criar bloco', 'error');
        }
    }

    // ========== DADOS ==========

    async loadData() {
        if (!this.user) return;

        // Carregar blocos
        this.blocks = await supabase.getBlocks(this.user.id);

        // Carregar gastos fixos, pagamentos e transações de cada bloco
        const allExpenseIds = [];

        for (const block of this.blocks) {
            this.fixedExpenses[block.id] = await supabase.getFixedExpenses(block.id);
            this.transactions[block.id] = await supabase.getTransactionsByBlock(block.id, this.currentMonth);

            // Coletar IDs dos gastos fixos
            for (const exp of this.fixedExpenses[block.id]) {
                allExpenseIds.push(exp.id);
            }
        }

        // Carregar status de pagamentos
        if (allExpenseIds.length > 0) {
            const payments = await supabase.getPayments(allExpenseIds, this.currentMonth);
            this.payments = {};
            for (const p of payments) {
                this.payments[p.expense_id] = p.paid;
            }
        }
    }

    async refreshData() {
        await this.loadData();
        this.render();
    }

    // ========== CÁLCULOS ==========

    calculateBlockTotals(block) {
        const fixedExpenses = this.fixedExpenses[block.id] || [];
        const transactions = this.transactions[block.id] || [];

        // Total de gastos fixos
        const totalFixed = fixedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        // Total de gastos fixos PAGOS
        const totalFixedPaid = fixedExpenses.reduce((sum, exp) => {
            if (this.payments[exp.id]) {
                return sum + parseFloat(exp.amount);
            }
            return sum;
        }, 0);

        // Total de gastos variáveis
        const totalVariable = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        // Total gasto (fixos pagos + variáveis)
        const totalGasto = totalFixedPaid + totalVariable;

        // Saldo disponível
        const saldo = parseFloat(block.amount) - totalGasto;

        // Limite diário
        const dailyLimit = parseFloat(block.daily_limit);
        const dailyRemaining = dailyLimit - totalVariable;

        return {
            entrada: parseFloat(block.amount),
            totalFixed,
            totalFixedPaid,
            totalFixedPending: totalFixed - totalFixedPaid,
            totalVariable,
            totalGasto,
            saldo,
            dailyLimit,
            dailyRemaining,
            dailyPercent: dailyLimit > 0 ? Math.min((totalVariable / dailyLimit) * 100, 100) : 0
        };
    }

    calculateMonthlyTotal() {
        let totalSobra = 0;
        for (const block of this.blocks) {
            const totals = this.calculateBlockTotals(block);
            totalSobra += totals.saldo;
        }
        return totalSobra;
    }

    // ========== RENDERIZAÇÃO ==========

    render() {
        this.renderSummary();
        this.renderBlocks();
        this.renderMonthSelector();
    }

    renderMonthSelector() {
        const [year, month] = this.currentMonth.split('-');
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const monthName = monthNames[parseInt(month) - 1];

        document.getElementById('currentMonth').textContent = `${monthName} ${year}`;
    }

    renderSummary() {
        const container = document.getElementById('summaryCards');
        if (!container) return;

        let html = '';

        // Cards de entrada
        let totalEntrada = 0;
        let totalSaida = 0;

        for (const block of this.blocks) {
            const totals = this.calculateBlockTotals(block);
            totalEntrada += totals.entrada;
            totalSaida += totals.totalGasto;
        }

        html += `
            <div class="summary-card">
                <label>Total Entrada</label>
                <span class="text-success">R$ ${totalEntrada.toFixed(2)}</span>
            </div>
            <div class="summary-card">
                <label>Total Saída</label>
                <span class="text-danger">R$ ${totalSaida.toFixed(2)}</span>
            </div>
        `;

        const totalMes = totalEntrada - totalSaida;
        html += `
            <div class="summary-card total">
                <label>Saldo do Mês</label>
                <span>R$ ${totalMes.toFixed(2)}</span>
            </div>
        `;

        container.innerHTML = html;
    }

    renderBlocks() {
        const container = document.getElementById('blocksContainer');
        if (!container) return;

        if (this.blocks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum bloco configurado</p>
                    <button class="btn-primary" onclick="app.openSettingsModal()">Configurar</button>
                </div>
            `;
            return;
        }

        let html = '';

        for (const block of this.blocks) {
            const totals = this.calculateBlockTotals(block);
            const fixedExpenses = this.fixedExpenses[block.id] || [];
            const transactions = this.transactions[block.id] || [];

            // Classes de cor
            const saldoClass = totals.saldo < 0 ? 'negative' : totals.saldo < 50 ? 'warning' : '';
            const progressClass = totals.dailyPercent >= 100 ? 'danger' : totals.dailyPercent >= 80 ? 'warning' : '';

            html += `
                <div class="block" data-block-id="${block.id}">
                    <div class="block-header">
                        <div>
                            <div class="block-title">${block.name}</div>
                            <div class="block-subtitle">Entrada: R$ ${totals.entrada.toFixed(2)} (dia ${block.day_of_month})</div>
                        </div>
                        <div class="block-balance">
                            <label>Saldo</label>
                            <span class="${saldoClass}">R$ ${totals.saldo.toFixed(2)}</span>
                        </div>
                    </div>

                    ${totals.dailyLimit > 0 ? `
                    <div class="daily-progress">
                        <div class="daily-progress-header">
                            <span>Gastos Variáveis: R$ ${totals.totalVariable.toFixed(2)}</span>
                            <span>Limite: R$ ${totals.dailyLimit.toFixed(2)}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-bar-fill ${progressClass}" style="width: ${totals.dailyPercent}%"></div>
                        </div>
                    </div>
                    ` : ''}

                    <div class="expenses-section">
                        <h3>Gastos Fixos <span class="expense-total">(${this.countPaidExpenses(fixedExpenses)}/${fixedExpenses.length} pagos)</span></h3>
                        ${fixedExpenses.length === 0 ? '<p class="empty-text">Nenhum gasto fixo cadastrado</p>' : ''}
                        ${fixedExpenses.map(exp => {
                            const isPaid = this.payments[exp.id] || false;
                            return `
                                <div class="expense-item ${isPaid ? 'paid' : ''}">
                                    <label class="checkbox-container">
                                        <input type="checkbox" ${isPaid ? 'checked' : ''}
                                            onchange="app.togglePayment('${exp.id}', this.checked)">
                                        <span class="checkmark"></span>
                                        <span class="expense-name">${exp.name}</span>
                                    </label>
                                    <span class="expense-amount">R$ ${parseFloat(exp.amount).toFixed(2)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="transactions-section">
                        <div class="transactions-header">
                            <h3>Gastos Variáveis</h3>
                            <button class="btn-add-expense" onclick="app.openQuickAdd('${block.id}')">+ Gasto</button>
                        </div>

                        <div class="quick-add-form hidden" id="quickAdd-${block.id}">
                            <input type="number" step="0.01" placeholder="Valor" id="quickValue-${block.id}" class="quick-input-value">
                            <input type="text" placeholder="Descrição (opcional)" id="quickDesc-${block.id}" class="quick-input-desc">
                            <div class="quick-add-buttons">
                                <button class="btn-quick-save" onclick="app.saveQuickExpense('${block.id}')">Salvar</button>
                                <button class="btn-quick-cancel" onclick="app.closeQuickAdd('${block.id}')">X</button>
                            </div>
                        </div>

                        ${transactions.length === 0 ? '<p class="empty-text">Nenhum gasto registrado</p>' : ''}
                        ${transactions.map(t => `
                            <div class="transaction-item">
                                <div class="transaction-info">
                                    <div class="description">${t.description}</div>
                                    <div class="date">${this.formatDate(t.transaction_date)}</div>
                                </div>
                                <div class="transaction-amount">- R$ ${parseFloat(t.amount).toFixed(2)}</div>
                                <button class="transaction-delete" onclick="app.deleteTransaction('${t.id}')">×</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    countPaidExpenses(expenses) {
        return expenses.filter(exp => this.payments[exp.id]).length;
    }

    // ========== AÇÕES ==========

    async togglePayment(expenseId, paid) {
        try {
            await supabase.togglePayment(expenseId, this.currentMonth, paid);
            this.payments[expenseId] = paid;
            this.render();
            this.showToast(paid ? 'Marcado como pago!' : 'Desmarcado', 'success');
        } catch (error) {
            console.error('Erro ao marcar pagamento:', error);
            this.showToast('Erro ao atualizar', 'error');
        }
    }

    async addExpense() {
        const blockId = document.getElementById('expenseBlock').value;
        const description = document.getElementById('expenseDescription').value.trim();
        const amount = parseFloat(document.getElementById('expenseAmount').value);

        if (!blockId || !description || !amount || amount <= 0) {
            this.showToast('Preencha todos os campos', 'error');
            return;
        }

        try {
            await supabase.createTransaction(this.user.id, blockId, description, amount, this.currentMonth);
            this.closeAllModals();
            await this.refreshData();
            this.showToast('Gasto adicionado!', 'success');

            // Verificar se estourou o limite
            const block = this.blocks.find(b => b.id === blockId);
            if (block && block.daily_limit > 0) {
                const totals = this.calculateBlockTotals(block);
                if (totals.dailyRemaining < 0) {
                    this.showToast('ATENÇÃO: Limite estourado!', 'error');
                } else if (totals.dailyRemaining < 20) {
                    this.showToast(`Restam R$ ${totals.dailyRemaining.toFixed(2)} do limite`, 'warning');
                }
            }
        } catch (error) {
            console.error('Erro ao adicionar gasto:', error);
            this.showToast('Erro ao adicionar gasto', 'error');
        }
    }

    async deleteTransaction(transactionId) {
        if (!confirm('Excluir este gasto?')) return;

        try {
            await supabase.deleteTransaction(transactionId);
            await this.refreshData();
            this.showToast('Gasto excluído', 'success');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            this.showToast('Erro ao excluir', 'error');
        }
    }

    // ========== GASTO RÁPIDO ==========

    openQuickAdd(blockId) {
        // Fecha outros forms abertos
        document.querySelectorAll('.quick-add-form').forEach(form => {
            form.classList.add('hidden');
        });

        // Abre o form deste bloco
        const form = document.getElementById(`quickAdd-${blockId}`);
        if (form) {
            form.classList.remove('hidden');
            document.getElementById(`quickValue-${blockId}`).focus();
        }
    }

    closeQuickAdd(blockId) {
        const form = document.getElementById(`quickAdd-${blockId}`);
        if (form) {
            form.classList.add('hidden');
            document.getElementById(`quickValue-${blockId}`).value = '';
            document.getElementById(`quickDesc-${blockId}`).value = '';
        }
    }

    async saveQuickExpense(blockId) {
        const valueInput = document.getElementById(`quickValue-${blockId}`);
        const descInput = document.getElementById(`quickDesc-${blockId}`);

        const amount = parseFloat(valueInput.value);
        const description = descInput.value.trim() || 'Gasto';

        if (!amount || amount <= 0) {
            this.showToast('Digite um valor', 'error');
            valueInput.focus();
            return;
        }

        try {
            await supabase.createTransaction(this.user.id, blockId, description, amount, this.currentMonth);

            // Limpa e fecha o form
            this.closeQuickAdd(blockId);

            // Atualiza a tela
            await this.refreshData();
            this.showToast('Gasto adicionado!', 'success');

            // Verifica limite
            const block = this.blocks.find(b => b.id === blockId);
            if (block && block.daily_limit > 0) {
                const totals = this.calculateBlockTotals(block);
                if (totals.dailyRemaining < 0) {
                    this.showToast('ATENÇÃO: Limite estourado!', 'error');
                } else if (totals.dailyRemaining < 20) {
                    this.showToast(`Restam R$ ${totals.dailyRemaining.toFixed(2)} do limite`, 'warning');
                }
            }
        } catch (error) {
            console.error('Erro ao adicionar gasto:', error);
            this.showToast('Erro ao adicionar', 'error');
        }
    }

    // ========== CONFIGURAÇÕES ==========

    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const container = document.getElementById('settingsContent');

        let html = '';

        for (const block of this.blocks) {
            const fixedExpenses = this.fixedExpenses[block.id] || [];

            html += `
                <div class="settings-section">
                    <div class="settings-header">
                        <h3>${block.name}</h3>
                        <button class="btn-delete-small" onclick="app.deleteBlock('${block.id}')">Excluir Bloco</button>
                    </div>

                    <div class="settings-item">
                        <span>Nome do bloco</span>
                        <input type="text" value="${block.name}"
                            onchange="app.updateBlockSetting('${block.id}', 'name', this.value)">
                    </div>

                    <div class="settings-item">
                        <span>Dia de entrada</span>
                        <input type="number" min="1" max="31" value="${block.day_of_month}"
                            onchange="app.updateBlockSetting('${block.id}', 'day_of_month', this.value)">
                    </div>

                    <div class="settings-item">
                        <span>Valor da entrada</span>
                        <input type="number" step="0.01" value="${block.amount}"
                            onchange="app.updateBlockSetting('${block.id}', 'amount', this.value)">
                    </div>

                    <div class="settings-item">
                        <span>Limite gastos variáveis</span>
                        <input type="number" step="0.01" value="${block.daily_limit}"
                            onchange="app.updateBlockSetting('${block.id}', 'daily_limit', this.value)">
                    </div>

                    <h4 class="settings-subtitle">Gastos Fixos</h4>

                    ${fixedExpenses.map(exp => `
                        <div class="settings-item expense-edit">
                            <input type="text" value="${exp.name}" class="expense-name-input"
                                onchange="app.updateFixedExpenseName('${exp.id}', this.value)">
                            <input type="number" step="0.01" value="${exp.amount}"
                                onchange="app.updateFixedExpense('${exp.id}', this.value)">
                            <button class="btn-delete-small" onclick="app.deleteFixedExpense('${exp.id}')">×</button>
                        </div>
                    `).join('')}

                    <button class="add-expense-btn" onclick="app.showAddFixedExpense('${block.id}')">
                        + Adicionar gasto fixo
                    </button>
                </div>
            `;
        }

        html += `
            <div class="settings-section">
                <h3>Adicionar Novo Bloco</h3>
                <div class="new-block-form">
                    <input type="text" id="newBlockName" placeholder="Nome (ex: Dia 15)">
                    <input type="number" id="newBlockDay" placeholder="Dia" min="1" max="31">
                    <input type="number" id="newBlockAmount" placeholder="Valor" step="0.01">
                    <button class="btn-primary" onclick="app.addBlock()">Criar</button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        modal.classList.remove('hidden');
    }

    async updateBlockSetting(blockId, field, value) {
        try {
            const update = {};
            if (field === 'name') {
                update[field] = value;
            } else {
                update[field] = parseFloat(value);
            }
            await supabase.updateBlock(blockId, update);
            await this.refreshData();
            this.showToast('Atualizado!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            this.showToast('Erro ao atualizar', 'error');
        }
    }

    async updateFixedExpense(expenseId, amount) {
        try {
            await supabase.updateFixedExpense(expenseId, { amount: parseFloat(amount) });
            await this.refreshData();
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            this.showToast('Erro ao atualizar', 'error');
        }
    }

    async updateFixedExpenseName(expenseId, name) {
        try {
            await supabase.updateFixedExpense(expenseId, { name });
            await this.refreshData();
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            this.showToast('Erro ao atualizar', 'error');
        }
    }

    async deleteFixedExpense(expenseId) {
        if (!confirm('Excluir este gasto fixo?')) return;

        try {
            await supabase.deleteFixedExpense(expenseId);
            await this.refreshData();
            this.openSettingsModal();
            this.showToast('Excluído!', 'success');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            this.showToast('Erro ao excluir', 'error');
        }
    }

    async deleteBlock(blockId) {
        if (!confirm('Excluir este bloco e todos os dados relacionados?')) return;

        try {
            await supabase.deleteBlock(blockId);
            await this.refreshData();
            this.closeAllModals();

            if (this.blocks.length === 0) {
                this.showSetupScreen();
            }

            this.showToast('Bloco excluído!', 'success');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            this.showToast('Erro ao excluir', 'error');
        }
    }

    showAddFixedExpense(blockId) {
        const name = prompt('Nome do gasto fixo:');
        if (!name) return;

        const amount = prompt('Valor (0 se não souber ainda):');
        if (amount === null) return;

        this.addFixedExpense(blockId, name, parseFloat(amount) || 0);
    }

    async addFixedExpense(blockId, name, amount) {
        try {
            await supabase.createFixedExpense(blockId, name, amount);
            await this.refreshData();
            this.openSettingsModal();
            this.showToast('Gasto fixo adicionado!', 'success');
        } catch (error) {
            console.error('Erro ao adicionar:', error);
            this.showToast('Erro ao adicionar', 'error');
        }
    }

    async addBlock() {
        const name = document.getElementById('newBlockName').value.trim();
        const day = parseInt(document.getElementById('newBlockDay').value);
        const amount = parseFloat(document.getElementById('newBlockAmount').value) || 0;

        if (!name || !day) {
            this.showToast('Preencha nome e dia', 'error');
            return;
        }

        try {
            await supabase.createBlock(this.user.id, name, day, amount, 0);
            await this.refreshData();
            this.openSettingsModal();
            this.showToast('Bloco criado!', 'success');
        } catch (error) {
            console.error('Erro ao criar bloco:', error);
            this.showToast('Erro ao criar bloco', 'error');
        }
    }

    // ========== MODAIS ==========

    openAddExpenseModal() {
        const modal = document.getElementById('addExpenseModal');
        const select = document.getElementById('expenseBlock');

        // Popular select com blocos
        select.innerHTML = this.blocks.map(block => {
            const totals = this.calculateBlockTotals(block);
            const remaining = totals.dailyLimit > 0 ? ` (Limite: R$ ${totals.dailyRemaining.toFixed(2)})` : '';
            return `<option value="${block.id}">${block.name}${remaining}</option>`;
        }).join('');

        // Limpar campos
        document.getElementById('expenseDescription').value = '';
        document.getElementById('expenseAmount').value = '';

        modal.classList.remove('hidden');
        document.getElementById('expenseDescription').focus();
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    // ========== UTILITÁRIOS ==========

    getCurrentMonthYear() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    async changeMonth(delta) {
        const [year, month] = this.currentMonth.split('-').map(Number);
        const date = new Date(year, month - 1 + delta, 1);
        this.currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        await this.loadData();
        this.render();
    }

    formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showLoading() {
        document.getElementById('loadingOverlay')?.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay')?.classList.add('hidden');
    }
}

// Inicializar app quando DOM carregar
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ZenyApp();

    // Iniciar verificação de versão
    VersionChecker.init();
});

// =============================================
// Sistema de Verificação de Versão
// =============================================

const VersionChecker = {
    VERSION_KEY: 'izi_app_version',
    CHECK_INTERVAL: 60000, // Verifica a cada 60 segundos

    init() {
        // Verificar imediatamente
        this.checkVersion();

        // Verificar periodicamente
        setInterval(() => this.checkVersion(), this.CHECK_INTERVAL);

        // Verificar quando a janela ganha foco (voltou pro app)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkVersion();
            }
        });
    },

    async checkVersion() {
        try {
            // Busca o version.json com cache bust
            const response = await fetch(`version.json?t=${Date.now()}`);
            if (!response.ok) return;

            const data = await response.json();
            const newVersion = data.version;
            const savedVersion = localStorage.getItem(this.VERSION_KEY);

            // Primeira vez - salva a versão atual
            if (!savedVersion) {
                localStorage.setItem(this.VERSION_KEY, newVersion);
                return;
            }

            // Se a versão mudou, mostra o modal
            if (savedVersion !== newVersion) {
                this.showUpdateModal();
                // Atualiza a versão salva para não mostrar novamente
                localStorage.setItem(this.VERSION_KEY, newVersion);
            }
        } catch (error) {
            // Silenciosamente ignora erros de rede
            console.log('Verificação de versão falhou:', error);
        }
    },

    showUpdateModal() {
        const modal = document.getElementById('updateModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
};
