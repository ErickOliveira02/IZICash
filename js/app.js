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
        this.installments = {}; // Parcelas de compras por bloco
        this.transfers = [];    // Transferências de saldo entre blocos
        this.pendingTransfers = []; // Transferências pendentes de confirmação
        this.currentMonth = this.getCurrentMonthYear();

        this.init();
    }

    // ========== INICIALIZAÇÃO ==========

    async init() {
        this.setupEventListeners();

        // Verificar se é callback do OAuth (Google)
        const oauthResult = await supabase.handleOAuthCallback();
        if (oauthResult && oauthResult.user) {
            await this.handleOAuthSuccess(oauthResult.user);
            return;
        }

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

        // Escolher username (OAuth)
        document.getElementById('usernameForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitUsername();
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

        // Modal de adicionar gasto fixo
        document.getElementById('addFixedExpenseForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitFixedExpense();
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
        document.getElementById('usernameScreen').classList.add('hidden');
    }

    showRegister() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.remove('hidden');
        document.getElementById('forgotScreen').classList.add('hidden');
        document.getElementById('verifyScreen').classList.add('hidden');
        document.getElementById('usernameScreen').classList.add('hidden');
    }

    showForgotPassword() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('forgotScreen').classList.remove('hidden');
        document.getElementById('verifyScreen').classList.add('hidden');
        document.getElementById('usernameScreen').classList.add('hidden');
    }

    showVerifyEmail(email) {
        document.getElementById('verifyEmailText').textContent = email;
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('forgotScreen').classList.add('hidden');
        document.getElementById('verifyScreen').classList.remove('hidden');
        document.getElementById('usernameScreen').classList.add('hidden');
    }

    showUsernameScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('forgotScreen').classList.add('hidden');
        document.getElementById('verifyScreen').classList.add('hidden');
        document.getElementById('usernameScreen').classList.remove('hidden');
    }

    showApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('forgotScreen').classList.add('hidden');
        document.getElementById('verifyScreen').classList.add('hidden');
        document.getElementById('usernameScreen').classList.add('hidden');
        document.getElementById('appScreen').classList.remove('hidden');
    }

    // ========== AUTENTICAÇÃO ==========

    async login() {
        const identifier = document.getElementById('loginIdentifier').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!identifier || !password) {
            this.showToast('Preencha todos os campos', 'error');
            return;
        }

        this.showLoading();

        try {
            let email = identifier;

            // Se não tiver @, é username - busca o email
            if (!identifier.includes('@')) {
                email = await supabase.getEmailByUsername(identifier);
                if (!email) {
                    throw new Error('Usuário não encontrado');
                }
            }

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

            // data pode ser o user direto ou {user: ...}
            const user = data.user || data;

            // Verifica se precisa confirmar email
            if (user && !user.confirmed_at && !user.email_confirmed_at) {
                this.showVerifyEmail(email);
                this.showToast('Cadastro realizado! Verifique seu email.', 'success');
            } else if (user && user.id) {
                // Já confirmado (ex: email auto-confirm habilitado)
                await this.handleAuthSuccess(user);
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

    // ========== GOOGLE OAUTH ==========

    loginWithGoogle() {
        supabase.signInWithGoogle();
    }

    async handleOAuthSuccess(authUser) {
        this.authUser = authUser;

        // Verifica se usuário já tem perfil (já escolheu username antes)
        const existingUser = await supabase.getUserByAuthId(authUser.id);

        if (existingUser) {
            // Usuário já existe, faz login normal
            this.user = existingUser;
            await this.loadData();
            this.showApp();

            if (this.blocks.length === 0) {
                this.showSetupScreen();
            } else {
                this.hideSetupScreen();
                this.render();
                // Verifica transferências pendentes após carregar tudo
                await this.checkPendingTransfers();
            }
            this.showToast('Bem-vindo de volta!', 'success');
        } else {
            // Novo usuário, precisa escolher username
            this.showUsernameScreen();
        }
    }

    updateUsernameCounter() {
        const input = document.getElementById('chooseUsername');
        const counter = document.getElementById('usernameCounter');
        const length = input.value.length;
        counter.textContent = `${length}/20`;

        if (length >= 18) {
            counter.classList.add('limit');
        } else {
            counter.classList.remove('limit');
        }
    }

    async submitUsername() {
        const username = document.getElementById('chooseUsername').value.trim();
        const password = document.getElementById('choosePassword').value;
        const passwordConfirm = document.getElementById('choosePasswordConfirm').value;

        if (!username) {
            this.showToast('Digite um username', 'error');
            return;
        }

        if (username.length < 3) {
            this.showToast('Username deve ter pelo menos 3 caracteres', 'error');
            return;
        }

        if (!password) {
            this.showToast('Digite uma senha', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('Senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        if (password !== passwordConfirm) {
            this.showToast('As senhas não coincidem', 'error');
            return;
        }

        this.showLoading();

        try {
            // Verifica se username já existe
            const existingEmail = await supabase.getEmailByUsername(username);
            if (existingEmail) {
                this.showToast('Username já está em uso', 'error');
                this.hideLoading();
                return;
            }

            // Atualiza a senha do usuário no Supabase Auth
            await supabase.updatePassword(password);

            // Cria perfil do usuário
            this.user = await supabase.createUserProfile(
                this.authUser.id,
                this.authUser.email,
                username
            );

            await this.loadData();
            this.showApp();
            this.showSetupScreen();
            this.showToast('Conta criada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao criar perfil:', error);
            this.showToast(error.message || 'Erro ao criar perfil', 'error');
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
            // Verifica transferências pendentes após carregar tudo
            await this.checkPendingTransfers();
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
        this.installments = {};
        this.transfers = [];
        this.pendingTransfers = [];

        document.getElementById('appScreen').classList.add('hidden');
        this.showLogin();

        // Limpar campos
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    }

    // ========== TRANSFERÊNCIA DE SALDO ==========

    async checkPendingTransfers() {
        if (!this.user || this.blocks.length === 0) return;

        try {
            // Carrega transferências pendentes existentes
            this.pendingTransfers = await supabase.getPendingTransfers(this.user.id);

            // Se houver pendentes, mostra o modal
            if (this.pendingTransfers.length > 0) {
                this.showTransferModal(this.pendingTransfers[0]);
                return;
            }

            // Verifica se precisa criar novas transferências pendentes
            await this.detectPendingTransfers();

            // Se criou pendentes, mostra o modal
            if (this.pendingTransfers.length > 0) {
                this.showTransferModal(this.pendingTransfers[0]);
            }
        } catch (error) {
            console.error('Erro ao verificar transferências:', error);
        }
    }

    async detectPendingTransfers() {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonthYear = this.getCurrentMonthYear();

        // Ordena blocos por dia
        const sortedBlocks = [...this.blocks].sort((a, b) => a.day_of_month - b.day_of_month);

        for (let i = 0; i < sortedBlocks.length; i++) {
            const block = sortedBlocks[i];

            // Se já passou o dia deste bloco
            if (currentDay >= block.day_of_month) {
                // Calcula o saldo deste bloco
                const totals = this.calculateBlockTotals(block);

                // Se tem saldo (positivo ou negativo) e não foi transferido ainda
                if (totals.saldo !== 0 && totals.transfersOut === 0) {
                    // Verifica se já existe transfer ativo para este bloco/mês
                    const existingTransfer = this.transfers.find(t =>
                        t.from_block_id === block.id &&
                        t.from_month_year === currentMonthYear &&
                        t.status === 'active'
                    );

                    if (!existingTransfer) {
                        // Determina o próximo bloco
                        const nextBlockInfo = this.getNextBlock(block, sortedBlocks, currentMonthYear);

                        if (nextBlockInfo) {
                            // Se passou o dia do próximo bloco, significa que precisamos perguntar
                            const shouldAsk = currentDay >= nextBlockInfo.block.day_of_month ||
                                              nextBlockInfo.monthYear !== currentMonthYear;

                            if (shouldAsk) {
                                // Cria transferência pendente
                                const transferType = totals.saldo > 0 ? 'carry_over' : 'debt';
                                try {
                                    const pending = await supabase.createPendingTransfer(
                                        this.user.id,
                                        block.id,
                                        nextBlockInfo.block.id,
                                        currentMonthYear,
                                        nextBlockInfo.monthYear,
                                        totals.saldo,
                                        transferType
                                    );
                                    this.pendingTransfers.push(pending);
                                } catch (e) {
                                    console.error('Erro ao criar transferência pendente:', e);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    getNextBlock(currentBlock, sortedBlocks, currentMonthYear) {
        const currentIndex = sortedBlocks.findIndex(b => b.id === currentBlock.id);

        // Próximo bloco no mesmo mês
        if (currentIndex < sortedBlocks.length - 1) {
            return {
                block: sortedBlocks[currentIndex + 1],
                monthYear: currentMonthYear
            };
        }

        // Primeiro bloco do próximo mês
        const nextMonthYear = this.incrementMonth(currentMonthYear);
        return {
            block: sortedBlocks[0],
            monthYear: nextMonthYear
        };
    }

    incrementMonth(monthYear) {
        const [year, month] = monthYear.split('-').map(Number);
        let newMonth = month + 1;
        let newYear = year;

        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }

        return `${newYear}-${String(newMonth).padStart(2, '0')}`;
    }

    formatMonthYear(monthYear) {
        const [year, month] = monthYear.split('-');
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    showTransferModal(pendingTransfer) {
        const modal = document.getElementById('transferModal');
        const title = document.getElementById('transferModalTitle');
        const content = document.getElementById('transferModalContent');

        const fromBlock = this.blocks.find(b => b.id === pendingTransfer.from_block_id);
        const toBlock = this.blocks.find(b => b.id === pendingTransfer.to_block_id);

        if (!fromBlock || !toBlock) {
            console.error('Blocos não encontrados para transferência');
            return;
        }

        const amount = parseFloat(pendingTransfer.amount);
        const isDebt = amount < 0;
        const absAmount = Math.abs(amount);

        if (isDebt) {
            title.textContent = 'Saldo Negativo';
            content.innerHTML = `
                <div class="transfer-info">
                    <div class="block-name">${fromBlock.name}</div>
                    <div class="month-label">${this.formatMonthYear(pendingTransfer.from_month_year)}</div>
                    <div class="balance-amount negative">-R$ ${absAmount.toFixed(2)}</div>
                </div>

                <div class="transfer-arrow">↓</div>

                <div class="transfer-destination">
                    <div class="label">Carregar dívida para:</div>
                    <div class="destination-block">${toBlock.name} - ${this.formatMonthYear(pendingTransfer.to_month_year)}</div>
                </div>

                <div class="transfer-buttons">
                    <button class="btn-danger" onclick="app.confirmTransfer('${pendingTransfer.id}')">Carregar dívida</button>
                    <button class="btn-secondary" onclick="app.cancelTransfer('${pendingTransfer.id}')">Zerar dívida</button>
                </div>
            `;
        } else {
            title.textContent = 'Transferência de Saldo';
            content.innerHTML = `
                <div class="transfer-info">
                    <div class="block-name">${fromBlock.name}</div>
                    <div class="month-label">${this.formatMonthYear(pendingTransfer.from_month_year)}</div>
                    <div class="balance-amount positive">R$ ${absAmount.toFixed(2)}</div>
                </div>

                <div class="transfer-arrow">↓</div>

                <div class="transfer-destination">
                    <div class="label">Transferir para:</div>
                    <div class="destination-block">${toBlock.name} - ${this.formatMonthYear(pendingTransfer.to_month_year)}</div>
                </div>

                <div class="transfer-buttons">
                    <button class="btn-primary" onclick="app.confirmTransfer('${pendingTransfer.id}')">Transferir</button>
                    <button class="btn-secondary" onclick="app.cancelTransfer('${pendingTransfer.id}')">Não transferir</button>
                </div>
            `;
        }

        modal.classList.remove('hidden');
    }

    async confirmTransfer(pendingTransferId) {
        const pending = this.pendingTransfers.find(p => p.id === pendingTransferId);
        if (!pending) return;

        try {
            // Cria a transferência confirmada
            await supabase.createBalanceTransfer(
                this.user.id,
                pending.from_block_id,
                pending.to_block_id,
                pending.from_month_year,
                pending.to_month_year,
                pending.amount,
                pending.transfer_type
            );

            // Remove a pendente
            await supabase.deletePendingTransfer(pendingTransferId);
            this.pendingTransfers = this.pendingTransfers.filter(p => p.id !== pendingTransferId);

            // Fecha o modal
            document.getElementById('transferModal').classList.add('hidden');

            // Recarrega dados e verifica se há mais pendentes
            await this.loadData();
            this.render();

            const isDebt = parseFloat(pending.amount) < 0;
            this.showToast(isDebt ? 'Dívida carregada!' : 'Saldo transferido!', 'success');

            // Verifica próxima pendente
            if (this.pendingTransfers.length > 0) {
                this.showTransferModal(this.pendingTransfers[0]);
            }
        } catch (error) {
            console.error('Erro ao confirmar transferência:', error);
            this.showToast('Erro ao transferir', 'error');
        }
    }

    async cancelTransfer(pendingTransferId) {
        const pending = this.pendingTransfers.find(p => p.id === pendingTransferId);
        if (!pending) return;

        try {
            // Remove a pendente sem criar transferência
            await supabase.deletePendingTransfer(pendingTransferId);
            this.pendingTransfers = this.pendingTransfers.filter(p => p.id !== pendingTransferId);

            // Fecha o modal
            document.getElementById('transferModal').classList.add('hidden');

            const isDebt = parseFloat(pending.amount) < 0;
            this.showToast(isDebt ? 'Dívida zerada!' : 'Transferência cancelada', 'success');

            // Verifica próxima pendente
            if (this.pendingTransfers.length > 0) {
                this.showTransferModal(this.pendingTransfers[0]);
            }
        } catch (error) {
            console.error('Erro ao cancelar transferência:', error);
            this.showToast('Erro ao cancelar', 'error');
        }
    }

    async toggleTransferStatus(transferId) {
        try {
            const transfer = this.transfers.find(t => t.id === transferId);
            if (!transfer) return;

            const newStatus = transfer.status === 'active' ? 'cancelled' : 'active';
            await supabase.updateBalanceTransferStatus(transferId, newStatus);

            await this.loadData();
            this.render();
            this.openSettingsModal(); // Reabre o modal de configurações

            this.showToast(newStatus === 'active' ? 'Transferência reativada!' : 'Transferência cancelada!', 'success');
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            this.showToast('Erro ao alterar status', 'error');
        }
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

        // Carregar gastos fixos, pagamentos, transações e parcelas de cada bloco
        const allExpenseIds = [];

        for (const block of this.blocks) {
            this.fixedExpenses[block.id] = await supabase.getFixedExpenses(block.id);
            this.transactions[block.id] = await supabase.getTransactionsByBlock(block.id, this.currentMonth);

            // Carregar parcelas do mês para este bloco
            try {
                this.installments[block.id] = await supabase.getInstallmentsByBlock(block.id, this.currentMonth);
            } catch (e) {
                this.installments[block.id] = [];
            }

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

        // Carregar transferências de saldo
        try {
            this.transfers = await supabase.getBalanceTransfers(this.user.id, this.currentMonth);
        } catch (e) {
            this.transfers = [];
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
        const installments = this.installments[block.id] || [];

        // Total de gastos fixos
        const totalFixed = fixedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        // Total de gastos fixos PAGOS
        const totalFixedPaid = fixedExpenses.reduce((sum, exp) => {
            if (this.payments[exp.id]) {
                return sum + parseFloat(exp.amount);
            }
            return sum;
        }, 0);

        // Total de parcelas do mês
        const totalInstallments = installments.reduce((sum, inst) => sum + parseFloat(inst.amount), 0);

        // Total de parcelas PAGAS
        const totalInstallmentsPaid = installments.reduce((sum, inst) => {
            if (inst.paid) {
                return sum + parseFloat(inst.amount);
            }
            return sum;
        }, 0);

        // Total de gastos variáveis
        const totalVariable = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        // Transferências recebidas (aumenta saldo - pode ser positivo ou negativo)
        const transfersIn = this.transfers.filter(t =>
            t.to_block_id === block.id &&
            t.to_month_year === this.currentMonth &&
            t.status === 'active'
        );
        const totalTransfersIn = transfersIn.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        // Transferências enviadas (diminui saldo)
        const transfersOut = this.transfers.filter(t =>
            t.from_block_id === block.id &&
            t.from_month_year === this.currentMonth &&
            t.status === 'active'
        );
        const totalTransfersOut = transfersOut.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        // Total gasto (fixos pagos + parcelas pagas + variáveis)
        const totalGasto = totalFixedPaid + totalInstallmentsPaid + totalVariable;

        // Saldo disponível (entrada + transferências recebidas - transferências enviadas - gastos)
        const saldo = parseFloat(block.amount) + totalTransfersIn - totalTransfersOut - totalGasto;

        // Limite diário
        const dailyLimit = parseFloat(block.daily_limit);
        const dailyRemaining = dailyLimit - totalVariable;

        // Verifica se tem dívida recebida (transferência negativa)
        const hasDebt = totalTransfersIn < 0;
        const debtAmount = hasDebt ? Math.abs(totalTransfersIn) : 0;

        return {
            entrada: parseFloat(block.amount),
            totalFixed,
            totalFixedPaid,
            totalFixedPending: totalFixed - totalFixedPaid,
            totalInstallments,
            totalInstallmentsPaid,
            totalInstallmentsPending: totalInstallments - totalInstallmentsPaid,
            totalVariable,
            totalGasto,
            saldo,
            dailyLimit,
            dailyRemaining,
            dailyPercent: dailyLimit > 0 ? Math.min((totalVariable / dailyLimit) * 100, 100) : 0,
            transfersIn: totalTransfersIn,
            transfersOut: totalTransfersOut,
            hasDebt,
            debtAmount
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
            const installments = this.installments[block.id] || [];

            // Classes de cor
            const saldoClass = totals.saldo < 0 ? 'negative' : totals.saldo < 50 ? 'warning' : '';
            const progressClass = totals.dailyPercent >= 100 ? 'danger' : totals.dailyPercent >= 80 ? 'warning' : '';

            // Badges de transferência
            let transferBadge = '';
            if (totals.hasDebt) {
                transferBadge = `<div class="debt-badge">Saldo devedor: -R$ ${totals.debtAmount.toFixed(2)}</div>`;
            } else if (totals.transfersIn > 0) {
                transferBadge = `<div class="transfer-badge">Sobra recebida: +R$ ${totals.transfersIn.toFixed(2)}</div>`;
            }

            html += `
                <div class="block" data-block-id="${block.id}">
                    <div class="block-header">
                        <div>
                            <div class="block-title">${block.name}</div>
                            <div class="block-subtitle">Entrada: R$ ${totals.entrada.toFixed(2)} (dia ${block.day_of_month})</div>
                            ${transferBadge}
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

                    <div class="installments-section">
                        <div class="installments-header">
                            <h3>Compras/Parcelas <span class="expense-total">(${this.countPaidInstallments(installments)}/${installments.length} pagas)</span></h3>
                            <button class="btn-add-purchase" onclick="app.openAddPurchase('${block.id}')">+ Compra</button>
                        </div>

                        <div class="purchase-form hidden" id="purchaseForm-${block.id}">
                            <input type="text" placeholder="Descrição (ex: Óculos)" id="purchaseDesc-${block.id}" class="purchase-input">
                            <input type="number" step="0.01" placeholder="Valor total" id="purchaseValue-${block.id}" class="purchase-input">
                            <input type="number" min="1" max="48" placeholder="Parcelas" id="purchaseInstallments-${block.id}" class="purchase-input-small" value="1">
                            <div class="purchase-buttons">
                                <button class="btn-quick-save" onclick="app.savePurchase('${block.id}')">Salvar</button>
                                <button class="btn-quick-cancel" onclick="app.closePurchaseForm('${block.id}')">X</button>
                            </div>
                        </div>

                        ${installments.length === 0 ? '<p class="empty-text">Nenhuma parcela neste mês</p>' : ''}
                        ${installments.map(inst => {
                            const purchase = inst.purchases;
                            const parcelInfo = purchase.installments > 1 ? ` (${inst.installment_number}/${purchase.installments})` : '';
                            return `
                                <div class="expense-item installment-item ${inst.paid ? 'paid' : ''}">
                                    <label class="checkbox-container">
                                        <input type="checkbox" ${inst.paid ? 'checked' : ''}
                                            onchange="app.toggleInstallment('${inst.id}', this.checked)">
                                        <span class="checkmark"></span>
                                        <span class="expense-name">${purchase.description}${parcelInfo}</span>
                                    </label>
                                    <span class="expense-amount">R$ ${parseFloat(inst.amount).toFixed(2)}</span>
                                    ${inst.installment_number === 1 ? `<button class="installment-delete" onclick="app.deletePurchase('${purchase.id}')">×</button>` : ''}
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

    countPaidInstallments(installments) {
        return installments.filter(inst => inst.paid).length;
    }

    // ========== COMPRAS/PARCELAS ==========

    openAddPurchase(blockId) {
        document.querySelectorAll('.purchase-form').forEach(form => {
            form.classList.add('hidden');
        });

        const form = document.getElementById(`purchaseForm-${blockId}`);
        if (form) {
            form.classList.remove('hidden');
            document.getElementById(`purchaseDesc-${blockId}`).focus();
        }
    }

    closePurchaseForm(blockId) {
        const form = document.getElementById(`purchaseForm-${blockId}`);
        if (form) {
            form.classList.add('hidden');
            document.getElementById(`purchaseDesc-${blockId}`).value = '';
            document.getElementById(`purchaseValue-${blockId}`).value = '';
            document.getElementById(`purchaseInstallments-${blockId}`).value = '1';
        }
    }

    async savePurchase(blockId) {
        const descInput = document.getElementById(`purchaseDesc-${blockId}`);
        const valueInput = document.getElementById(`purchaseValue-${blockId}`);
        const installmentsInput = document.getElementById(`purchaseInstallments-${blockId}`);

        const description = descInput.value.trim();
        const totalAmount = parseFloat(valueInput.value);
        const installments = parseInt(installmentsInput.value) || 1;

        if (!description) {
            this.showToast('Digite uma descrição', 'error');
            descInput.focus();
            return;
        }

        if (!totalAmount || totalAmount <= 0) {
            this.showToast('Digite um valor válido', 'error');
            valueInput.focus();
            return;
        }

        if (installments < 1 || installments > 48) {
            this.showToast('Parcelas deve ser entre 1 e 48', 'error');
            installmentsInput.focus();
            return;
        }

        try {
            await supabase.createPurchase(
                this.user.id,
                blockId,
                description,
                totalAmount,
                installments,
                this.currentMonth
            );

            this.closePurchaseForm(blockId);
            await this.refreshData();

            const parcelValue = (totalAmount / installments).toFixed(2);
            if (installments > 1) {
                this.showToast(`Compra adicionada! ${installments}x de R$ ${parcelValue}`, 'success');
            } else {
                this.showToast('Compra adicionada!', 'success');
            }
        } catch (error) {
            console.error('Erro ao adicionar compra:', error);
            this.showToast('Erro ao adicionar compra', 'error');
        }
    }

    async toggleInstallment(installmentId, paid) {
        try {
            await supabase.toggleInstallmentPaid(installmentId, paid);
            await this.refreshData();
            this.showToast(paid ? 'Parcela paga!' : 'Parcela desmarcada', 'success');
        } catch (error) {
            console.error('Erro ao atualizar parcela:', error);
            this.showToast('Erro ao atualizar', 'error');
        }
    }

    async deletePurchase(purchaseId) {
        if (!confirm('Excluir esta compra e todas as parcelas?')) return;

        try {
            await supabase.deletePurchase(purchaseId);
            await this.refreshData();
            this.showToast('Compra excluída!', 'success');
        } catch (error) {
            console.error('Erro ao excluir compra:', error);
            this.showToast('Erro ao excluir', 'error');
        }
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

        // Histórico de transferências
        if (this.transfers.length > 0) {
            html += `
                <div class="settings-section">
                    <h3>Histórico de Transferências</h3>
                    <div class="transfer-history-section">
                        ${this.transfers.map(t => {
                            const fromBlock = this.blocks.find(b => b.id === t.from_block_id);
                            const toBlock = this.blocks.find(b => b.id === t.to_block_id);
                            const amount = parseFloat(t.amount);
                            const isDebt = amount < 0;
                            const absAmount = Math.abs(amount);
                            const fromBlockName = fromBlock ? fromBlock.name : 'Bloco removido';
                            const toBlockName = toBlock ? toBlock.name : 'Bloco removido';

                            return `
                                <div class="transfer-history-item">
                                    <div class="transfer-details">
                                        <div class="transfer-route">${fromBlockName} → ${toBlockName}</div>
                                        <div class="transfer-date">${this.formatMonthYear(t.from_month_year)} → ${this.formatMonthYear(t.to_month_year)}</div>
                                    </div>
                                    <span class="transfer-amount ${isDebt ? 'negative' : 'positive'}">
                                        ${isDebt ? '-' : '+'}R$ ${absAmount.toFixed(2)}
                                    </span>
                                    <span class="transfer-status ${t.status}">${t.status === 'active' ? 'Ativo' : 'Cancelado'}</span>
                                    <button class="btn-toggle-status ${t.status === 'active' ? 'cancel' : 'reactivate'}"
                                        onclick="app.toggleTransferStatus('${t.id}')">
                                        ${t.status === 'active' ? 'Cancelar' : 'Reativar'}
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

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
        document.getElementById('fixedExpenseBlockId').value = blockId;
        document.getElementById('fixedExpenseName').value = '';
        document.getElementById('fixedExpenseAmount').value = '';
        document.getElementById('addFixedExpenseModal').classList.remove('hidden');
        document.getElementById('fixedExpenseName').focus();
    }

    async submitFixedExpense() {
        const blockId = document.getElementById('fixedExpenseBlockId').value;
        const name = document.getElementById('fixedExpenseName').value.trim();
        const amount = parseFloat(document.getElementById('fixedExpenseAmount').value) || 0;

        if (!name) {
            this.showToast('Digite o nome do gasto', 'error');
            return;
        }

        await this.addFixedExpense(blockId, name, amount);
        document.getElementById('addFixedExpenseModal').classList.add('hidden');
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
