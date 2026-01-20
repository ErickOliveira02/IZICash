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

        // Fitness state
        this.workoutRoutine = null;
        this.workoutExercises = {};
        this.completedDaysThisWeek = new Set();
        this.activeSession = null;
        this.sessionExercises = [];
        this.currentExerciseIndex = 0;
        this.restTimer = null;
        this.restSeconds = 60;
        this.fitnessTab = 'workouts';
        this.selectedTemplate = null;
        this.creatingRoutine = {
            days: [],
            currentDayIndex: 0,
            exercises: {}
        };

        // AI Agent state
        this.agentChat = {
            messages: [],
            step: 'goal',
            profile: {
                goal: null,
                frequency: null,
                level: null,
                focus: []
            }
        };

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

        // Configurações (only on Finanças screen)
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettingsModal());

        // Sidebar - Logo buttons
        document.getElementById('headerLogoBtn')?.addEventListener('click', () => this.openSidebar());
        document.getElementById('appHeaderLogoBtn')?.addEventListener('click', () => this.openSidebar());

        // Sidebar - Overlay close
        document.getElementById('sidebarOverlay')?.addEventListener('click', () => this.closeSidebar());

        // Sidebar - Logout
        document.getElementById('sidebarLogout')?.addEventListener('click', () => this.logout());

        // Sidebar - Menu navigation
        document.querySelectorAll('.sidebar-menu li').forEach(li => {
            li.addEventListener('click', () => this.navigateTo(li.dataset.screen));
        });

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

        // Fitness tabs
        document.querySelectorAll('.fitness-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchFitnessTab(btn.dataset.tab));
        });

        // FAB create routine
        document.getElementById('fabCreateRoutine')?.addEventListener('click', () => this.openCreateRoutine());

        // Fitness header logo
        document.getElementById('fitnessHeaderLogoBtn')?.addEventListener('click', () => this.openSidebar());
        document.getElementById('fitnessSettingsBtn')?.addEventListener('click', () => this.openFitnessSettings());

        // Finish session button
        document.getElementById('finishSessionBtn')?.addEventListener('click', () => this.finishSession(false));
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
        // Show home screen by default after login
        this.showHome();
    }

    // ========== SIDEBAR NAVIGATION ==========

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('hidden');
        overlay.classList.remove('hidden');
        // Trigger animation
        requestAnimationFrame(() => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => {
            sidebar.classList.add('hidden');
            overlay.classList.add('hidden');
        }, 300);
    }

    navigateTo(screen) {
        this.closeSidebar();

        // Update sidebar active state
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        document.querySelector(`[data-screen="${screen}"]`)?.classList.add('active');

        if (screen === 'home') {
            this.showHome();
        } else if (screen === 'financas') {
            this.showFinancas();
        } else if (screen === 'fitness') {
            this.showFitness();
        }
    }

    showHome() {
        document.getElementById('homeScreen').classList.remove('hidden');
        document.getElementById('appScreen').classList.add('hidden');
        document.getElementById('fitnessScreen').classList.add('hidden');
        document.getElementById('activeSessionScreen').classList.add('hidden');
        // Update sidebar state
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        document.querySelector('[data-screen="home"]')?.classList.add('active');
    }

    showFinancas() {
        // Hide all login screens
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('forgotScreen').classList.add('hidden');
        document.getElementById('verifyScreen').classList.add('hidden');
        document.getElementById('usernameScreen').classList.add('hidden');
        // Show appScreen, hide homeScreen
        document.getElementById('homeScreen').classList.add('hidden');
        document.getElementById('fitnessScreen').classList.add('hidden');
        document.getElementById('activeSessionScreen').classList.add('hidden');
        document.getElementById('appScreen').classList.remove('hidden');
        // Update sidebar state
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        document.querySelector('[data-screen="financas"]')?.classList.add('active');
    }

    showFitness() {
        // Hide all screens
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('homeScreen').classList.add('hidden');
        document.getElementById('appScreen').classList.add('hidden');
        document.getElementById('activeSessionScreen').classList.add('hidden');
        // Show fitness
        document.getElementById('fitnessScreen').classList.remove('hidden');
        // Update sidebar
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        document.querySelector('[data-screen="fitness"]')?.classList.add('active');
        // Render content
        this.renderFitness();
    }

    switchFitnessTab(tabName) {
        this.fitnessTab = tabName;
        // Update tab buttons
        document.querySelectorAll('.fitness-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        // Show/hide tab content
        document.getElementById('workoutsTab').classList.toggle('hidden', tabName !== 'workouts');
        document.getElementById('dietTab').classList.toggle('hidden', tabName !== 'diet');
        // Show/hide FAB
        this.updateFabVisibility();
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

            if (this.blocks.length === 0) {
                // No blocks yet - go to setup screen (inside appScreen)
                this.showFinancas();
                this.showSetupScreen();
            } else {
                // Has blocks - show home screen
                this.showApp();
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
            // New user - go to setup screen (inside appScreen)
            this.showFinancas();
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

        // Se não tem blocos, mostra setup (inside appScreen)
        if (this.blocks.length === 0) {
            this.showFinancas();
            this.showSetupScreen();
        } else {
            // Has blocks - show home screen
            this.showApp();
            this.hideSetupScreen();
            this.render();
            // Verifica transferências pendentes após carregar tudo
            await this.checkPendingTransfers();
        }
    }

    async logout() {
        // Close sidebar if open
        this.closeSidebar();

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
        document.getElementById('homeScreen').classList.add('hidden');
        this.showLogin();

        // Clear form fields
        document.getElementById('loginIdentifier').value = '';
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
                            // Verifica se o ciclo deste bloco já terminou
                            // O ciclo só termina quando o PRÓXIMO bloco começa
                            let shouldAsk = false;

                            if (nextBlockInfo.monthYear === currentMonthYear) {
                                // Próximo bloco é no mesmo mês - perguntar se já passou o dia do próximo bloco
                                shouldAsk = currentDay >= nextBlockInfo.block.day_of_month;
                            } else {
                                // Próximo bloco é no próximo mês
                                // Só perguntar se já estamos no mês do próximo bloco E passou o dia
                                const realNow = new Date();
                                const realMonthYear = `${realNow.getFullYear()}-${String(realNow.getMonth() + 1).padStart(2, '0')}`;

                                if (realMonthYear === nextBlockInfo.monthYear && currentDay >= nextBlockInfo.block.day_of_month) {
                                    // Estamos no mês do próximo bloco e já passou o dia
                                    shouldAsk = true;
                                } else if (realMonthYear > nextBlockInfo.monthYear) {
                                    // Já passamos do mês do próximo bloco
                                    shouldAsk = true;
                                }
                                // Se ainda não chegamos no mês/dia do próximo bloco, não pergunta
                            }

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
                // Navigate to home screen after first block creation
                this.showHome();
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

        // Carregar dados de fitness
        await this.loadFitnessData();
    }

    async loadFitnessData() {
        if (!this.user) return;

        try {
            this.workoutRoutine = await supabase.getWorkoutRoutine(this.user.id);

            if (this.workoutRoutine) {
                const exercises = await supabase.getWorkoutExercises(this.workoutRoutine.id);
                this.workoutExercises = {};
                for (const ex of exercises) {
                    const dayKey = parseInt(ex.day_of_week);
                    if (!this.workoutExercises[dayKey]) {
                        this.workoutExercises[dayKey] = [];
                    }
                    this.workoutExercises[dayKey].push(ex);
                }

                // Carrega sessões da semana atual
                const weekStart = this.getWeekStart();
                const weekSessions = await supabase.getWeekSessions(this.user.id, weekStart);
                this.completedDaysThisWeek = new Set();
                for (const session of weekSessions) {
                    this.completedDaysThisWeek.add(parseInt(session.day_of_week));
                }
            }
        } catch (e) {
            console.error('Error loading fitness data:', e);
            this.workoutRoutine = null;
            this.workoutExercises = {};
            this.completedDaysThisWeek = new Set();
        }
    }

    getWeekStart() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek;
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart.toISOString();
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

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.add('hidden');
    }

    // ========== FITNESS MODULE ==========

    renderFitness() {
        this.updateFabVisibility();
        if (this.fitnessTab === 'workouts') {
            this.renderWorkouts();
        }
    }

    updateFabVisibility() {
        const fab = document.getElementById('fabCreateRoutine');
        if (!fab) return;
        const hasRoutine = this.workoutRoutine !== null;
        fab.classList.toggle('hidden', hasRoutine || this.fitnessTab !== 'workouts');
    }

    renderWorkouts() {
        const container = document.getElementById('workoutsContent');
        if (!container) return;

        if (!this.workoutRoutine) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Nenhuma rotina de treino</p>
                    <p class="text-secondary">Clique em "+ Criar rotina" para começar</p>
                </div>
            `;
            return;
        }

        const today = new Date().getDay();
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const completedDays = this.completedDaysThisWeek || new Set();

        let html = '';
        for (const day of this.workoutRoutine.days) {
            const isToday = day === today;
            const isCompleted = completedDays.has(day);
            const exercises = this.workoutExercises[day] || [];

            html += `
                <div class="workout-day-card ${isToday ? 'today' : ''} ${isCompleted ? 'completed' : ''}">
                    <div class="workout-day-header">
                        <h3>${dayNames[day]}</h3>
                        ${isCompleted ? '<span class="completed-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> FEITO</span>' : ''}
                        ${isToday && !isCompleted ? '<span class="today-badge">HOJE</span>' : ''}
                    </div>
                    <div class="workout-exercises-list">
                        ${exercises.map(ex => `
                            <div class="workout-exercise-item">
                                <div class="exercise-info">
                                    <div class="exercise-name">${ex.name}</div>
                                    <div class="exercise-details">${ex.sets}x${ex.reps} • ${ex.weight}kg</div>
                                </div>
                            </div>
                        `).join('')}
                        ${exercises.length === 0 ? '<p class="empty-text">Nenhum exercício</p>' : ''}
                    </div>
                    ${isToday && exercises.length > 0 && !isCompleted ? `
                        <button class="btn-start-workout" onclick="app.startWorkoutSession(${day})">
                            Iniciar Treino
                        </button>
                    ` : ''}
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // ========== FITNESS SETTINGS ==========

    openFitnessSettings() {
        if (!this.workoutRoutine) {
            this.showToast('Nenhuma rotina para configurar', 'error');
            return;
        }
        document.getElementById('fitnessSettingsModal').classList.remove('hidden');
    }

    editRoutine() {
        this.closeModal('fitnessSettingsModal');
        // Abre o fluxo de criação com a rotina atual para edição
        this.selectedTemplate = 'custom';
        this.creatingRoutine = {
            days: [...this.workoutRoutine.days],
            currentDayIndex: 0,
            exercises: { ...this.workoutExercises }
        };
        this.openExercisesForDay();
    }

    confirmDeleteRoutine() {
        this.closeModal('fitnessSettingsModal');
        document.getElementById('confirmDeleteRoutineModal').classList.remove('hidden');
    }

    async deleteRoutine() {
        if (!this.workoutRoutine) return;

        this.showLoading();
        try {
            await supabase.deleteWorkoutRoutine(this.workoutRoutine.id);
            this.workoutRoutine = null;
            this.workoutExercises = {};
            this.closeModal('confirmDeleteRoutineModal');
            this.renderFitness();
            this.showToast('Rotina apagada!', 'success');
        } catch (error) {
            console.error('Error deleting routine:', error);
            this.showToast('Erro ao apagar rotina', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // ========== ROUTINE CREATION ==========

    openCreateRoutine() {
        this.selectedTemplate = null;
        this.creatingRoutine = { days: [], currentDayIndex: 0, exercises: {} };
        this.renderTemplates();
        document.getElementById('selectTemplateModal').classList.remove('hidden');
    }

    renderTemplates() {
        const container = document.getElementById('templatesList');
        let html = '';

        // AI Agent card first
        html += `
            <div class="template-card agent-card" onclick="app.selectTemplate('agent')">
                <div class="template-icon ai-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                        <circle cx="8" cy="14" r="1"/>
                        <circle cx="16" cy="14" r="1"/>
                        <path d="M9 18h6"/>
                    </svg>
                </div>
                <div class="template-name">Com Agente</div>
                <div class="template-frequency">Personalizado</div>
                <span class="agent-badge">IA</span>
            </div>
        `;

        for (const [key, template] of Object.entries(WORKOUT_TEMPLATES)) {
            html += `
                <div class="template-card" onclick="app.selectTemplate('${key}')">
                    <div class="template-icon">${template.icon}</div>
                    <div class="template-name">${template.name}</div>
                    <div class="template-frequency">${template.frequency}</div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    selectTemplate(templateKey) {
        this.selectedTemplate = templateKey;
        document.getElementById('selectTemplateModal').classList.add('hidden');

        if (templateKey === 'agent') {
            this.openAgentChat();
        } else if (templateKey === 'custom') {
            document.querySelectorAll('.day-checkbox input').forEach(cb => cb.checked = false);
            document.getElementById('selectDaysModal').classList.remove('hidden');
        } else {
            this.applyTemplate(templateKey);
        }
    }

    applyTemplate(templateKey) {
        const template = WORKOUT_TEMPLATES[templateKey];
        if (!template || template.days.length === 0) return;

        document.querySelectorAll('.day-checkbox input').forEach(cb => cb.checked = false);

        const defaultDays = this.getDefaultDaysForTemplate(template.days.length);
        defaultDays.forEach(d => {
            const cb = document.querySelector(`.day-checkbox input[value="${d}"]`);
            if (cb) cb.checked = true;
        });

        this.creatingRoutine.days = defaultDays;
        this.creatingRoutine.currentDayIndex = 0;
        this.creatingRoutine.exercises = {};

        template.days.forEach((dayTemplate, idx) => {
            const dayNum = defaultDays[idx];
            this.creatingRoutine.exercises[dayNum] = dayTemplate.exercises.map(ex => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: 0,
                category: ex.category
            }));
        });

        this.openExercisesForDay();
    }

    getDefaultDaysForTemplate(numDays) {
        const dayMappings = {
            1: [1],
            2: [1, 4],
            3: [1, 3, 5],
            4: [1, 2, 4, 5],
            5: [1, 2, 3, 4, 5],
            6: [1, 2, 3, 4, 5, 6]
        };
        return dayMappings[numDays] || [1, 3, 5];
    }

    confirmDaysSelection() {
        const selected = [];
        document.querySelectorAll('.day-checkbox input:checked').forEach(cb => {
            selected.push(parseInt(cb.value));
        });

        if (selected.length === 0) {
            this.showToast('Selecione pelo menos um dia', 'error');
            return;
        }

        this.creatingRoutine.days = selected.sort((a, b) => a - b);
        this.creatingRoutine.currentDayIndex = 0;
        this.creatingRoutine.exercises = {};
        selected.forEach(d => this.creatingRoutine.exercises[d] = []);

        document.getElementById('selectDaysModal').classList.add('hidden');
        this.openExercisesForDay();
    }

    openExercisesForDay() {
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const day = this.creatingRoutine.days[this.creatingRoutine.currentDayIndex];

        let title = dayNames[day];
        if (this.selectedTemplate && this.selectedTemplate !== 'custom' && this.selectedTemplate !== 'agent') {
            const template = WORKOUT_TEMPLATES[this.selectedTemplate];
            const dayTemplate = template.days[this.creatingRoutine.currentDayIndex];
            if (dayTemplate) {
                title = `${dayTemplate.letter} - ${dayTemplate.name}`;
            }
        } else if (this.selectedTemplate === 'agent') {
            // For agent-generated routines, show day letter
            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
            const letter = letters[this.creatingRoutine.currentDayIndex] || '';
            title = `Treino ${letter} - ${dayNames[day]}`;
        }

        document.getElementById('exerciseModalTitle').textContent = title;
        this.renderExerciseRows();
        document.getElementById('addExercisesModal').classList.remove('hidden');
    }

    renderExerciseRows() {
        const day = this.creatingRoutine.days[this.creatingRoutine.currentDayIndex];
        if (!this.creatingRoutine.exercises[day]) {
            this.creatingRoutine.exercises[day] = [];
        }
        const exercises = this.creatingRoutine.exercises[day];
        const container = document.getElementById('exercisesList');

        if (!exercises || exercises.length === 0) {
            container.innerHTML = '<p class="empty-text">Adicione exercícios para este dia</p>';
            return;
        }

        container.innerHTML = exercises.map((ex, idx) => {
            const category = ex.category ? EXERCISE_DATABASE[ex.category] : null;
            const categoryName = category ? category.name : '';

            return `
                <div class="exercise-form-row" data-index="${idx}">
                    <div class="exercise-row-header">
                        <span class="exercise-row-name">${ex.name || 'Exercício ' + (idx + 1)}</span>
                        ${categoryName ? `<span class="exercise-row-category">${categoryName}</span>` : ''}
                        <button class="btn-remove-exercise" onclick="app.removeExerciseRow(${idx})">×</button>
                    </div>
                    <div class="exercise-row-inputs">
                        <div class="input-group">
                            <label>Séries</label>
                            <input type="number" value="${ex.sets}"
                                onchange="app.updateExerciseField(${idx}, 'sets', this.value)">
                        </div>
                        <div class="input-group">
                            <label>Reps</label>
                            <input type="number" value="${ex.reps}"
                                onchange="app.updateExerciseField(${idx}, 'reps', this.value)">
                        </div>
                        <div class="input-group">
                            <label>Carga (kg)</label>
                            <input type="number" value="${ex.weight}" step="0.5"
                                onchange="app.updateExerciseField(${idx}, 'weight', this.value)">
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    openExercisePicker() {
        document.getElementById('exerciseSearch').value = '';
        this.renderExerciseCategories();
        document.getElementById('exerciseSearchResults').classList.add('hidden');
        document.getElementById('exerciseCategories').classList.remove('hidden');
        document.getElementById('exercisePickerModal').classList.remove('hidden');
    }

    closeExercisePicker() {
        document.getElementById('exercisePickerModal').classList.add('hidden');
    }

    renderExerciseCategories() {
        const container = document.getElementById('exerciseCategories');

        container.innerHTML = Object.entries(EXERCISE_DATABASE).map(([key, category]) => `
            <div class="category-item" data-category="${key}">
                <div class="category-header" onclick="app.toggleCategory('${key}')">
                    <span class="category-icon">${category.icon}</span>
                    <span class="category-name">${category.name}</span>
                    <span class="category-count">${category.exercises.length}</span>
                    <span class="category-arrow">›</span>
                </div>
                <div class="category-exercises">
                    ${category.exercises.map(ex => `
                        <div class="exercise-option" onclick="app.addExerciseFromPicker('${ex}', '${key}')">
                            ${ex}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    toggleCategory(categoryKey) {
        const item = document.querySelector(`.category-item[data-category="${categoryKey}"]`);
        if (item) {
            item.classList.toggle('expanded');
        }
    }

    addExerciseFromPicker(exerciseName, categoryKey) {
        const day = this.creatingRoutine.days[this.creatingRoutine.currentDayIndex];
        if (!this.creatingRoutine.exercises[day]) {
            this.creatingRoutine.exercises[day] = [];
        }
        this.creatingRoutine.exercises[day].push({
            name: exerciseName,
            sets: 3,
            reps: 12,
            weight: 0,
            category: categoryKey
        });
        this.closeExercisePicker();
        this.renderExerciseRows();
    }

    searchExercise(query) {
        const categoriesEl = document.getElementById('exerciseCategories');
        const resultsEl = document.getElementById('exerciseSearchResults');

        if (!query || query.length < 2) {
            categoriesEl.classList.remove('hidden');
            resultsEl.classList.add('hidden');
            return;
        }

        const results = searchExercises(query);
        categoriesEl.classList.add('hidden');
        resultsEl.classList.remove('hidden');

        if (results.length === 0) {
            resultsEl.innerHTML = '<p class="empty-text">Nenhum exercício encontrado</p>';
            return;
        }

        resultsEl.innerHTML = results.slice(0, 15).map(result => `
            <div class="search-result-item" onclick="app.addExerciseFromPicker('${result.name}', '${result.category}')">
                <span class="search-result-icon">${result.icon}</span>
                <div class="search-result-info">
                    <div class="search-result-name">${result.name}</div>
                    <div class="search-result-category">${result.categoryName}</div>
                </div>
            </div>
        `).join('');
    }

    removeExerciseRow(idx) {
        const day = this.creatingRoutine.days[this.creatingRoutine.currentDayIndex];
        if (this.creatingRoutine.exercises[day]) {
            this.creatingRoutine.exercises[day].splice(idx, 1);
        }
        this.renderExerciseRows();
    }

    updateExerciseField(idx, field, value) {
        const day = this.creatingRoutine.days[this.creatingRoutine.currentDayIndex];
        if (!this.creatingRoutine.exercises[day] || !this.creatingRoutine.exercises[day][idx]) return;
        if (field === 'name') {
            this.creatingRoutine.exercises[day][idx][field] = value;
        } else {
            this.creatingRoutine.exercises[day][idx][field] = parseFloat(value) || 0;
        }
    }

    prevDay() {
        if (this.creatingRoutine.currentDayIndex > 0) {
            this.creatingRoutine.currentDayIndex--;
            this.openExercisesForDay();
        }
    }

    async nextDay() {
        const day = this.creatingRoutine.days[this.creatingRoutine.currentDayIndex];
        const exercises = this.creatingRoutine.exercises[day] || [];

        const validExercises = exercises.filter(e => e.name && e.name.trim() !== '');
        if (validExercises.length === 0) {
            this.showToast('Adicione pelo menos um exercício', 'error');
            return;
        }
        this.creatingRoutine.exercises[day] = validExercises;

        if (this.creatingRoutine.currentDayIndex < this.creatingRoutine.days.length - 1) {
            this.creatingRoutine.currentDayIndex++;
            this.openExercisesForDay();
        } else {
            await this.saveRoutine();
        }
    }

    async saveRoutine() {
        this.showLoading();
        try {
            // Delete existing routine first
            if (this.workoutRoutine) {
                await supabase.deleteWorkoutRoutine(this.workoutRoutine.id);
            }

            const routine = await supabase.createWorkoutRoutine(
                this.user.id,
                'Minha Rotina',
                this.creatingRoutine.days
            );

            for (const day of this.creatingRoutine.days) {
                const exercises = this.creatingRoutine.exercises[day];
                for (let i = 0; i < exercises.length; i++) {
                    await supabase.createWorkoutExercise(
                        routine.id,
                        day,
                        exercises[i].name,
                        exercises[i].sets,
                        exercises[i].reps,
                        exercises[i].weight,
                        i
                    );
                }
            }

            this.closeAllModals();
            await this.loadFitnessData();
            this.renderFitness();
            this.showToast('Rotina criada com sucesso!', 'success');
        } catch (error) {
            console.error('Error saving routine:', error);
            this.showToast('Erro ao salvar rotina', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // ========== AI AGENT CHAT ==========

    openAgentChat() {
        this.agentChat = {
            messages: [],
            step: 'goal',
            profile: {
                goal: null,
                frequency: null,
                level: null,
                focus: []
            }
        };

        document.getElementById('agentChatModal').classList.remove('hidden');
        this.renderAgentChat();
        this.addAgentMessage(
            'Olá! Vou criar uma rotina de treino personalizada para você. Qual é seu objetivo principal?',
            ['Emagrecer', 'Ganhar massa', 'Manutenção', 'Condicionamento']
        );
    }

    closeAgentChat() {
        document.getElementById('agentChatModal').classList.add('hidden');
    }

    addAgentMessage(text, options = null) {
        const container = document.getElementById('agentChatContainer');

        // Add typing indicator
        const typingHtml = '<div class="chat-typing" id="typingIndicator"><span></span><span></span><span></span></div>';
        container.insertAdjacentHTML('beforeend', typingHtml);
        container.scrollTop = container.scrollHeight;

        // Simulate typing delay
        setTimeout(() => {
            const typing = document.getElementById('typingIndicator');
            if (typing) typing.remove();

            let messageHtml = `<div class="chat-message agent">${text}`;

            if (options && options.length > 0) {
                messageHtml += '<div class="chat-options">';
                options.forEach(opt => {
                    messageHtml += `<button class="chat-option-btn" onclick="app.selectAgentOption('${opt}')">${opt}</button>`;
                });
                messageHtml += '</div>';
            }

            messageHtml += '</div>';

            container.insertAdjacentHTML('beforeend', messageHtml);
            container.scrollTop = container.scrollHeight;

            this.agentChat.messages.push({ type: 'agent', text, options });
        }, 600);
    }

    addUserMessage(text) {
        const container = document.getElementById('agentChatContainer');
        container.insertAdjacentHTML('beforeend', `<div class="chat-message user">${text}</div>`);
        container.scrollTop = container.scrollHeight;
        this.agentChat.messages.push({ type: 'user', text });
    }

    renderAgentChat() {
        document.getElementById('agentChatContainer').innerHTML = '';
    }

    selectAgentOption(option) {
        this.addUserMessage(option);
        this.processAgentInput(option);
    }

    sendAgentMessage() {
        const input = document.getElementById('agentChatInput');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        this.addUserMessage(text);
        this.processAgentInput(text);
    }

    processAgentInput(input) {
        const normalizedInput = input.toLowerCase().trim();
        const step = this.agentChat.step;

        switch (step) {
            case 'goal':
                this.parseGoal(normalizedInput);
                break;
            case 'frequency':
                this.parseFrequency(normalizedInput);
                break;
            case 'level':
                this.parseLevel(normalizedInput);
                break;
            case 'focus':
                this.parseFocus(normalizedInput);
                break;
            case 'confirm':
                this.handleConfirmation(normalizedInput);
                break;
        }
    }

    parseGoal(input) {
        const goalMap = {
            'emagrecer': 'emagrecimento',
            'perder peso': 'emagrecimento',
            'perder': 'emagrecimento',
            'ganhar massa': 'hipertrofia',
            'ganhar': 'hipertrofia',
            'massa': 'hipertrofia',
            'hipertrofia': 'hipertrofia',
            'crescer': 'hipertrofia',
            'manutenção': 'manutencao',
            'manutencao': 'manutencao',
            'manter': 'manutencao',
            'condicionamento': 'condicionamento',
            'cardio': 'condicionamento',
            'resistência': 'condicionamento'
        };

        let goal = null;
        for (const [keyword, value] of Object.entries(goalMap)) {
            if (input.includes(keyword)) {
                goal = value;
                break;
            }
        }

        if (goal) {
            this.agentChat.profile.goal = goal;
            this.agentChat.step = 'frequency';
            this.addAgentMessage(
                'Quantas vezes por semana você pode treinar?',
                ['2 vezes', '3 vezes', '4 vezes', '5 vezes', '6 vezes']
            );
        } else {
            this.addAgentMessage(
                'Não entendi. Qual é seu objetivo principal?',
                ['Emagrecer', 'Ganhar massa', 'Manutenção', 'Condicionamento']
            );
        }
    }

    parseFrequency(input) {
        const frequencyMatch = input.match(/(\d+)/);
        let frequency = frequencyMatch ? parseInt(frequencyMatch[1]) : null;

        if (!frequency) {
            const wordMap = { 'duas': 2, 'três': 3, 'tres': 3, 'quatro': 4, 'cinco': 5, 'seis': 6 };
            for (const [word, num] of Object.entries(wordMap)) {
                if (input.includes(word)) {
                    frequency = num;
                    break;
                }
            }
        }

        if (frequency && frequency >= 2 && frequency <= 6) {
            this.agentChat.profile.frequency = frequency;
            this.agentChat.step = 'level';
            this.addAgentMessage(
                'Qual é seu nível de experiência com musculação?',
                ['Iniciante', 'Intermediário', 'Avançado']
            );
        } else {
            this.addAgentMessage(
                'Por favor, informe quantas vezes por semana (entre 2 e 6).',
                ['2 vezes', '3 vezes', '4 vezes', '5 vezes', '6 vezes']
            );
        }
    }

    parseLevel(input) {
        const levelMap = {
            'iniciante': 'iniciante',
            'começo': 'iniciante',
            'novo': 'iniciante',
            'nunca': 'iniciante',
            'intermediário': 'intermediario',
            'intermediario': 'intermediario',
            'médio': 'intermediario',
            'medio': 'intermediario',
            'avançado': 'avancado',
            'avancado': 'avancado',
            'experiente': 'avancado',
            'muito': 'avancado'
        };

        let level = null;
        for (const [keyword, value] of Object.entries(levelMap)) {
            if (input.includes(keyword)) {
                level = value;
                break;
            }
        }

        if (level) {
            this.agentChat.profile.level = level;
            this.agentChat.step = 'focus';
            this.addAgentMessage(
                'Tem algum grupo muscular que você quer dar mais foco? (ou "nenhum" para treino equilibrado)',
                ['Pernas', 'Glúteos', 'Braços', 'Costas', 'Peito', 'Nenhum']
            );
        } else {
            this.addAgentMessage(
                'Qual é seu nível de experiência?',
                ['Iniciante', 'Intermediário', 'Avançado']
            );
        }
    }

    parseFocus(input) {
        const focusMap = {
            'pernas': 'pernas',
            'perna': 'pernas',
            'glúteos': 'gluteos',
            'gluteos': 'gluteos',
            'glúteo': 'gluteos',
            'bunda': 'gluteos',
            'braços': 'bracos',
            'bracos': 'bracos',
            'braço': 'bracos',
            'costas': 'costas',
            'costa': 'costas',
            'peito': 'peito',
            'peitoral': 'peito',
            'nenhum': null,
            'não': null,
            'nao': null,
            'equilibrado': null
        };

        let focus = [];
        for (const [keyword, value] of Object.entries(focusMap)) {
            if (input.includes(keyword)) {
                if (value === null) {
                    focus = [];
                    break;
                }
                if (!focus.includes(value)) {
                    focus.push(value);
                }
            }
        }

        this.agentChat.profile.focus = focus;
        this.agentChat.step = 'confirm';
        this.generateRoutineSummary();
    }

    generateRoutineSummary() {
        const profile = this.agentChat.profile;
        const split = this.chooseSplit(profile);
        const routine = this.buildAgentRoutine(profile, split);

        this.agentChat.generatedRoutine = routine;

        const goalLabels = {
            'emagrecimento': 'Emagrecer',
            'hipertrofia': 'Ganhar massa',
            'manutencao': 'Manutenção',
            'condicionamento': 'Condicionamento'
        };

        const levelLabels = {
            'iniciante': 'Iniciante',
            'intermediario': 'Intermediário',
            'avancado': 'Avançado'
        };

        const focusLabel = profile.focus.length > 0
            ? profile.focus.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')
            : 'Equilibrado';

        let summaryHtml = `
            <div class="chat-summary">
                <h4>Resumo do Treino</h4>
                <div class="chat-summary-item">
                    <span class="label">Objetivo</span>
                    <span class="value">${goalLabels[profile.goal] || profile.goal}</span>
                </div>
                <div class="chat-summary-item">
                    <span class="label">Frequência</span>
                    <span class="value">${profile.frequency}x por semana</span>
                </div>
                <div class="chat-summary-item">
                    <span class="label">Nível</span>
                    <span class="value">${levelLabels[profile.level] || profile.level}</span>
                </div>
                <div class="chat-summary-item">
                    <span class="label">Foco</span>
                    <span class="value">${focusLabel}</span>
                </div>
                <div class="chat-summary-item">
                    <span class="label">Divisão</span>
                    <span class="value">${split.name}</span>
                </div>
                <div class="chat-action-buttons">
                    <button class="btn-retry" onclick="app.retryAgentChat()">Refazer</button>
                    <button class="btn-confirm" onclick="app.confirmAgentRoutine()">Confirmar</button>
                </div>
            </div>
        `;

        const container = document.getElementById('agentChatContainer');
        container.insertAdjacentHTML('beforeend', `<div class="chat-message agent">Pronto! Criei sua rotina personalizada:${summaryHtml}</div>`);
        container.scrollTop = container.scrollHeight;
    }

    chooseSplit(profile) {
        const { frequency, level, goal } = profile;

        // Choose split based on frequency and level
        if (frequency <= 2) {
            return { key: 'fullbody', name: 'Full Body' };
        } else if (frequency === 3) {
            if (level === 'iniciante') {
                return { key: 'fullbody', name: 'Full Body' };
            }
            return { key: 'abc', name: 'ABC' };
        } else if (frequency === 4) {
            if (level === 'iniciante') {
                return { key: 'ab', name: 'AB (Superior/Inferior)' };
            }
            return { key: 'abcd', name: 'ABCD' };
        } else if (frequency >= 5) {
            if (level === 'iniciante') {
                return { key: 'abc', name: 'ABC' };
            } else if (level === 'intermediario') {
                return { key: 'abcd', name: 'ABCD' };
            }
            return { key: 'ppl', name: 'Push/Pull/Legs' };
        }

        return { key: 'abc', name: 'ABC' };
    }

    buildAgentRoutine(profile, split) {
        const { frequency, level, goal, focus } = profile;
        const template = WORKOUT_TEMPLATES[split.key];

        if (!template || template.days.length === 0) {
            return this.buildCustomAgentRoutine(profile);
        }

        // Get default days based on frequency
        const days = this.getDefaultDaysForTemplate(frequency);

        // Build exercises for each day from template, with adjustments
        const exercises = {};
        const setsMultiplier = level === 'iniciante' ? 0.75 : level === 'avancado' ? 1.25 : 1;
        const repsAdjust = goal === 'emagrecimento' ? 3 : goal === 'hipertrofia' ? -2 : 0;
        const templateDaysCount = template.days.length;

        // Loop through all frequency days, cycling through template days if needed
        for (let idx = 0; idx < frequency; idx++) {
            const dayNum = days[idx];
            // Cycle through template days (e.g., for 5 days with PPL: A, B, C, A, B)
            const templateIdx = idx % templateDaysCount;
            const dayTemplate = template.days[templateIdx];

            exercises[dayNum] = dayTemplate.exercises.map(ex => ({
                name: ex.name,
                sets: Math.max(2, Math.round(ex.sets * setsMultiplier)),
                reps: Math.max(6, ex.reps + repsAdjust),
                weight: 0,
                category: ex.category
            }));

            // Add extra exercises for focus areas
            if (focus.length > 0) {
                focus.forEach(focusArea => {
                    const category = this.mapFocusToCategory(focusArea);
                    if (category) {
                        const extraExercise = this.getRandomExercise(category, exercises[dayNum]);
                        if (extraExercise) {
                            exercises[dayNum].push(extraExercise);
                        }
                    }
                });
            }

            // Add cardio for emagrecimento on first day
            if (goal === 'emagrecimento' && idx === 0) {
                exercises[dayNum].push({
                    name: 'Esteira',
                    sets: 1,
                    reps: 20, // 20 minutes
                    weight: 0,
                    category: 'cardio'
                });
            }
        }

        return { days, exercises, template: split.key };
    }

    buildCustomAgentRoutine(profile) {
        const { frequency, level, goal, focus } = profile;
        const days = this.getDefaultDaysForTemplate(frequency);
        const exercises = {};

        // Simple custom routine builder
        days.forEach((dayNum, idx) => {
            exercises[dayNum] = [];

            // Distribute muscle groups across days
            const muscleGroups = this.distributeMuscleGroups(frequency, idx, focus);

            muscleGroups.forEach(group => {
                const category = EXERCISE_DATABASE[group];
                if (category) {
                    // Pick 2-3 exercises per muscle group
                    const numExercises = level === 'iniciante' ? 2 : level === 'avancado' ? 4 : 3;
                    const picked = this.pickExercisesFromCategory(group, numExercises, exercises[dayNum]);
                    exercises[dayNum].push(...picked);
                }
            });
        });

        return { days, exercises, template: 'custom' };
    }

    mapFocusToCategory(focus) {
        const map = {
            'pernas': 'pernas',
            'gluteos': 'pernas',
            'bracos': 'biceps',
            'costas': 'costas',
            'peito': 'peito'
        };
        return map[focus] || null;
    }

    getRandomExercise(category, existingExercises) {
        const catData = EXERCISE_DATABASE[category];
        if (!catData) return null;

        const existingNames = existingExercises.map(e => e.name);
        const available = catData.exercises.filter(e => !existingNames.includes(e));

        if (available.length === 0) return null;

        const randomName = available[Math.floor(Math.random() * available.length)];
        return {
            name: randomName,
            sets: 3,
            reps: 12,
            weight: 0,
            category
        };
    }

    pickExercisesFromCategory(categoryKey, count, existingExercises) {
        const category = EXERCISE_DATABASE[categoryKey];
        if (!category) return [];

        const existingNames = existingExercises.map(e => e.name);
        const available = category.exercises.filter(e => !existingNames.includes(e));

        const picked = [];
        for (let i = 0; i < Math.min(count, available.length); i++) {
            const randomIdx = Math.floor(Math.random() * available.length);
            const name = available.splice(randomIdx, 1)[0];
            picked.push({
                name,
                sets: 3,
                reps: 12,
                weight: 0,
                category: categoryKey
            });
        }

        return picked;
    }

    distributeMuscleGroups(frequency, dayIdx, focus) {
        const allGroups = ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'pernas'];

        if (frequency <= 2) {
            // Full body each day
            return ['peito', 'costas', 'pernas', 'ombros'];
        } else if (frequency === 3) {
            const splits = [
                ['peito', 'triceps'],
                ['costas', 'biceps'],
                ['pernas', 'ombros']
            ];
            return splits[dayIdx % 3];
        } else if (frequency === 4) {
            const splits = [
                ['peito'],
                ['costas'],
                ['pernas'],
                ['ombros', 'biceps', 'triceps']
            ];
            return splits[dayIdx % 4];
        } else {
            const splits = [
                ['peito', 'triceps'],
                ['costas', 'biceps'],
                ['pernas'],
                ['ombros'],
                ['peito', 'costas']
            ];
            return splits[dayIdx % 5];
        }
    }

    retryAgentChat() {
        this.openAgentChat();
    }

    async confirmAgentRoutine() {
        const routine = this.agentChat.generatedRoutine;
        if (!routine) {
            this.showToast('Erro ao gerar rotina', 'error');
            return;
        }

        // Apply the generated routine to creatingRoutine and proceed to exercise editing
        this.creatingRoutine.days = routine.days;
        this.creatingRoutine.currentDayIndex = 0;
        this.creatingRoutine.exercises = routine.exercises;

        document.getElementById('agentChatModal').classList.add('hidden');
        this.selectedTemplate = 'agent';
        this.openExercisesForDay();
    }

    handleConfirmation(input) {
        if (input.includes('sim') || input.includes('confirmar') || input.includes('ok')) {
            this.confirmAgentRoutine();
        } else if (input.includes('não') || input.includes('nao') || input.includes('refazer')) {
            this.retryAgentChat();
        } else {
            this.addAgentMessage(
                'Deseja confirmar esta rotina ou prefere refazer?',
                ['Confirmar', 'Refazer']
            );
        }
    }

    // ========== ACTIVE SESSION ==========

    async startWorkoutSession(dayOfWeek) {
        const exercises = this.workoutExercises[dayOfWeek] || [];
        if (exercises.length === 0) return;

        this.showLoading();
        try {
            const session = await supabase.createWorkoutSession(
                this.workoutRoutine.id,
                this.user.id,
                dayOfWeek,
                exercises.length
            );

            this.activeSession = {
                id: session.id,
                dayOfWeek,
                exercisesCompleted: 0,
                exercisesTotal: exercises.length
            };

            this.sessionExercises = exercises.map(ex => ({
                ...ex,
                completed: false,
                currentWeight: ex.weight,
                completedSets: 0
            }));
            this.expandedCardIndex = 0;
            this.exerciseInProgress = null;

            document.getElementById('fitnessScreen').classList.add('hidden');
            document.getElementById('activeSessionScreen').classList.remove('hidden');

            window.scrollTo(0, 0);
            this.renderSessionExercises();
        } catch (error) {
            console.error('Error starting session:', error);
            this.showToast('Erro ao iniciar treino', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderSessionExercises() {
        const container = document.getElementById('sessionContent');

        container.innerHTML = this.sessionExercises.map((ex, idx) => {
            const isExpanded = idx === this.expandedCardIndex;
            const isCompleted = ex.completed;
            const isInProgress = idx === this.exerciseInProgress;

            // Generate series checkboxes
            let seriesHtml = '';
            for (let s = 1; s <= ex.sets; s++) {
                const isSetCompleted = s <= ex.completedSets;
                seriesHtml += `
                    <button class="series-checkbox ${isSetCompleted ? 'completed' : ''}"
                            onclick="app.toggleSeries(${idx}, ${s})"
                            ${isCompleted ? 'disabled' : ''}>
                        ${isSetCompleted ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' : s}
                    </button>
                `;
            }

            return `
                <div class="session-exercise-card ${isExpanded ? 'expanded' : 'collapsed'} ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}"
                     data-index="${idx}"
                     onclick="app.toggleCard(${idx})">
                    <div class="session-exercise-header">
                        <div class="session-exercise-title">
                            <h4>${ex.name}</h4>
                            ${isCompleted ? '<svg class="exercise-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                            ${isInProgress && !isCompleted ? '<span class="in-progress-badge">EM ANDAMENTO</span>' : ''}
                        </div>
                        <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' exercício')}"
                           target="_blank"
                           class="btn-play-youtube"
                           onclick="event.stopPropagation()">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </a>
                    </div>
                    <div class="session-exercise-body">
                        <div class="session-exercise-details">
                            <div class="session-detail">
                                <label>Reps</label>
                                <span>${ex.reps}</span>
                            </div>
                            <div class="session-detail">
                                <label>Carga</label>
                                <input type="number"
                                    value="${ex.currentWeight > 0 ? ex.currentWeight : ''}"
                                    placeholder="0"
                                    step="0.5"
                                    class="input-carga"
                                    onclick="event.stopPropagation()"
                                    onchange="app.updateSessionWeight(${idx}, this.value)"
                                    ${isCompleted ? 'disabled' : ''}>
                            </div>
                        </div>
                        <div class="session-series">
                            <label>Séries</label>
                            <div class="series-checkboxes" onclick="event.stopPropagation()">
                                ${seriesHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleCard(idx) {
        const exercise = this.sessionExercises[idx];

        // Se o exercício já está completo, não faz nada
        if (exercise.completed) return;

        // Se já está expandido, colapsa
        if (this.expandedCardIndex === idx) {
            this.expandedCardIndex = null;
            this.renderSessionExercises();
            return;
        }

        // Se tem exercício em progresso e não é esse, mostra modal
        if (this.exerciseInProgress !== null && this.exerciseInProgress !== idx) {
            document.getElementById('exerciseInProgressModal').classList.remove('hidden');
            return;
        }

        // Expande o card
        this.expandedCardIndex = idx;
        this.renderSessionExercises();
    }

    updateSessionWeight(idx, value) {
        this.sessionExercises[idx].currentWeight = parseFloat(value) || 0;
    }

    toggleSeries(exerciseIdx, seriesNum) {
        const exercise = this.sessionExercises[exerciseIdx];
        if (exercise.completed) return;

        // Toggle series - if clicking on completed, uncomplete it
        if (seriesNum <= exercise.completedSets) {
            exercise.completedSets = seriesNum - 1;
            // Se desmarcou todas as séries, libera o exercício
            if (exercise.completedSets === 0 && this.exerciseInProgress === exerciseIdx) {
                this.exerciseInProgress = null;
            }
        } else {
            // Mark this series and all previous as completed
            exercise.completedSets = seriesNum;
            // Marca o exercício como em progresso
            if (this.exerciseInProgress === null) {
                this.exerciseInProgress = exerciseIdx;
            }
        }

        // Check if all series are completed
        if (exercise.completedSets >= exercise.sets) {
            exercise.completed = true;
            this.activeSession.exercisesCompleted++;
            this.exerciseInProgress = null;

            // Check if all exercises are done
            if (this.activeSession.exercisesCompleted === this.activeSession.exercisesTotal) {
                this.expandedCardIndex = null;
                this.renderSessionExercises();
                this.finishSession(true);
                return;
            }

            // Abre o próximo exercício não completado
            const nextIndex = this.sessionExercises.findIndex((ex, idx) => idx > exerciseIdx && !ex.completed);
            if (nextIndex !== -1) {
                this.expandedCardIndex = nextIndex;
            } else {
                // Se não tem próximo, procura o primeiro não completado
                const firstIncomplete = this.sessionExercises.findIndex(ex => !ex.completed);
                this.expandedCardIndex = firstIncomplete !== -1 ? firstIncomplete : null;
            }
        }

        this.renderSessionExercises();
    }

    startRestTimer() {
        this.restSeconds = 60;
        document.getElementById('restTimerModal').classList.remove('hidden');
        this.updateTimerDisplay();

        this.restTimer = setInterval(() => {
            this.restSeconds--;
            this.updateTimerDisplay();

            if (this.restSeconds <= 0) {
                this.skipRest();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        document.getElementById('timerSeconds').textContent = this.restSeconds;
        const circle = document.getElementById('timerCircle');
        const progress = (60 - this.restSeconds) / 60 * 283;
        circle.style.strokeDashoffset = progress;
    }

    skipRest() {
        if (this.restTimer) {
            clearInterval(this.restTimer);
            this.restTimer = null;
        }
        document.getElementById('restTimerModal').classList.add('hidden');
        this.restSeconds = 60;
    }

    toggleRestTimer() {
        if (this.restTimer) {
            this.skipRest();
        } else {
            this.startRestTimer();
        }
    }

    async finishSession(completed) {
        if (!completed && this.activeSession.exercisesCompleted < this.activeSession.exercisesTotal) {
            document.getElementById('confirmFinishModal').classList.remove('hidden');
            return;
        }

        await this.completeSession(completed);
    }

    async forceFinishSession() {
        this.closeModal('confirmFinishModal');
        await this.completeSession(true);
    }

    async completeSession(completed) {
        this.showLoading();
        try {
            await supabase.finishWorkoutSession(
                this.activeSession.id,
                completed,
                this.activeSession.exercisesCompleted
            );

            // Marca o dia como completado na semana
            if (!this.completedDaysThisWeek) {
                this.completedDaysThisWeek = new Set();
            }
            this.completedDaysThisWeek.add(this.activeSession.dayOfWeek);

            for (const ex of this.sessionExercises) {
                if (ex.currentWeight !== ex.weight) {
                    await supabase.updateExerciseWeight(ex.id, ex.currentWeight);
                }
            }

            const congratsTitle = document.getElementById('congratsTitle');
            const congratsMessage = document.getElementById('congratsMessage');

            if (completed) {
                congratsTitle.textContent = 'Parabéns! 🎉';
                congratsMessage.textContent = 'Você completou seu treino de hoje!';
            } else {
                congratsTitle.textContent = 'Treino Finalizado';
                congratsMessage.textContent = 'Na próxima, tente completar todos os exercícios! Você consegue! 💪';
            }

            document.getElementById('congratsModal').classList.remove('hidden');

        } catch (error) {
            console.error('Error finishing session:', error);
            this.showToast('Erro ao finalizar', 'error');
        } finally {
            this.hideLoading();
        }
    }

    closeCongratsAndReturn() {
        document.getElementById('congratsModal').classList.add('hidden');
        document.getElementById('activeSessionScreen').classList.add('hidden');
        this.activeSession = null;
        this.sessionExercises = [];
        this.loadFitnessData().then(() => this.showFitness());
    }

    exitSession() {
        if (this.activeSession) {
            document.getElementById('confirmExitModal').classList.remove('hidden');
        } else {
            this.closeCongratsAndReturn();
        }
    }

    cancelSession() {
        // Cancel without saving
        if (this.restTimer) {
            clearInterval(this.restTimer);
            this.restTimer = null;
        }
        this.activeSession = null;
        this.sessionExercises = [];
        this.currentExerciseIndex = 0;
        this.closeAllModals();
        document.getElementById('activeSessionScreen').classList.add('hidden');
        document.getElementById('fitnessScreen').classList.remove('hidden');
        this.showToast('Treino cancelado', 'info');
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
