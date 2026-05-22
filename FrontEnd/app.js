// Configuração da API
const API_URL = 'http://10.13.252.247/DosagemApi';

// Classe principal da aplicação
class DosagemApp {
    constructor() {
        this.checkAuth();
    }

    // Verificar autenticação
    async checkAuth() {
        const usuario = localStorage.getItem('usuario');
        
        if (!usuario) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const userData = JSON.parse(usuario);
            document.getElementById('userName').textContent = userData.nmUsuario || 'Usuário';
            
            // Mostrar botão de novo usuário apenas para admin
            const btnNovoUsuario = document.getElementById('btnNovoUsuario');
            if (userData.admin === 1 && btnNovoUsuario) {
                btnNovoUsuario.style.display = 'inline-block';
            }
            
            this.init();
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            window.location.href = 'login.html';
        }
    }

    init() {
        this.setupTabs();
        this.setupForms();
        this.setupModalClickOutside();
        this.listarBarris();
        this.listarDemandas();
        this.listarUsuarios();
        // this.iniciarPollingDemandas(); // DESATIVADO: excede limite de conexões do servidor
    }

    // Configurar clique fora do modal para fechar
    setupModalClickOutside() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modal.id === 'modalEditarBarril') {
                        this.fecharModalEditar();
                    } else if (modal.id === 'modalConfirmarExclusao') {
                        this.fecharModalConfirmar();
                    }
                }
            });
        });
    }

    // Configurar navegação por tabs
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;

                // Remove active de todos
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Adiciona active no clicado
                btn.classList.add('active');
                document.getElementById(tabName).classList.add('active');

                // Atualiza dados ao trocar de tab
                if (tabName === 'barris') {
                    this.listarBarris();
                } else if (tabName === 'demandas') {
                    this.listarDemandas();
                    this.carregarBarrisNoSelect();
                }
            });
        });
    }

    // Configurar formulários
    setupForms() {
        // Form de cadastro de barril
        document.getElementById('formBarril').addEventListener('submit', (e) => {
            e.preventDefault();
            this.cadastrarBarril();
        });

        // Form de edição de barril
        document.getElementById('formEditarBarril').addEventListener('submit', (e) => {
            e.preventDefault();
            this.atualizarBarril();
        });

        // Form de criação de demanda
        document.getElementById('formDemanda').addEventListener('submit', (e) => {
            e.preventDefault();
            this.criarDemanda();
        });

        // Form de edição de usuário
        document.getElementById('formEditarUsuario').addEventListener('submit', (e) => {
            e.preventDefault();
            this.atualizarUsuario();
        });

        // Form de cadastro de usuário
        document.getElementById('formCadastrarUsuario').addEventListener('submit', (e) => {
            e.preventDefault();
            this.cadastrarUsuario();
        });

        // Evento para atualizar limite de volume ao selecionar barril
        document.getElementById('idBarril').addEventListener('change', () => {
            this.atualizarLimiteVolume();
        });
    }

    // ========== BARRIS ==========

    async cadastrarBarril() {
        const deProduto = document.getElementById('deProduto').value;
        const vlLitrosTotal = parseFloat(document.getElementById('vlLitrosTotal').value);

        try {
            const response = await fetch(`${API_URL}/barril/cadBarril.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deProduto,
                    vlLitrosTotal
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Barril cadastrado com sucesso!', 'success');
                document.getElementById('formBarril').reset();
                this.listarBarris();
            } else {
                this.showToast(data.message || 'Erro ao cadastrar barril', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro de conexão com a API', 'error');
        }
    }

    abrirModalEditar(idBarril, deProduto, vlLitrosTotal) {
        document.getElementById('editIdBarril').value = idBarril;
        document.getElementById('editDeProduto').value = deProduto;
        document.getElementById('editVlLitrosTotal').value = vlLitrosTotal;
        document.getElementById('modalEditarBarril').classList.add('show');
    }

    fecharModalEditar() {
        document.getElementById('modalEditarBarril').classList.remove('show');
        document.getElementById('formEditarBarril').reset();
    }

    async atualizarBarril() {
        const idBarril = parseInt(document.getElementById('editIdBarril').value);
        const deProduto = document.getElementById('editDeProduto').value;
        const vlLitrosTotal = parseFloat(document.getElementById('editVlLitrosTotal').value);

        try {
            const response = await fetch(`${API_URL}/barril/atuBarril.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idBarril,
                    deProduto,
                    vlLitrosTotal
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Barril atualizado com sucesso!', 'success');
                this.fecharModalEditar();
                this.listarBarris();
            } else {
                this.showToast(data.message || 'Erro ao atualizar barril', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro de conexão com a API', 'error');
        }
    }

    async deletarBarril(idBarril) {
        // Abre modal de confirmação
        this.abrirModalConfirmar(
            'Confirmar Exclusão',
            'Tem certeza que deseja deletar este barril?',
            '⚠️ Esta ação não pode ser desfeita!',
            'Sim, Deletar',
            'danger',
            () => this.confirmarExclusaoBarril(idBarril)
        );
    }

    abrirModalConfirmar(titulo, texto, aviso, textoBotao, tipo, callback) {
        document.getElementById('modalConfirmarTitulo').textContent = titulo;
        document.getElementById('modalConfirmarTexto').textContent = texto;
        document.getElementById('modalConfirmarAviso').textContent = aviso;
        document.getElementById('btnConfirmarExclusao').textContent = textoBotao;
        
        // Alterna entre os ícones
        const iconeDelete = document.getElementById('iconeDelete');
        const iconeSuccess = document.getElementById('iconeSuccess');
        const iconeContainer = document.getElementById('modalConfirmarIcone');
        const btnConfirmar = document.getElementById('btnConfirmarExclusao');
        
        if (tipo === 'success') {
            iconeDelete.style.display = 'none';
            iconeSuccess.style.display = 'block';
            iconeContainer.classList.add('success');
            btnConfirmar.className = 'btn btn-success-confirm';
        } else {
            iconeDelete.style.display = 'block';
            iconeSuccess.style.display = 'none';
            iconeContainer.classList.remove('success');
            btnConfirmar.className = 'btn btn-danger';
        }
        
        const modal = document.getElementById('modalConfirmarExclusao');
        modal.classList.add('show');
        
        // Define o callback do botão de confirmação
        btnConfirmar.onclick = callback;
    }

    fecharModalConfirmar() {
        document.getElementById('modalConfirmarExclusao').classList.remove('show');
    }

    async confirmarExclusaoBarril(idBarril) {
        this.fecharModalConfirmar();

        try {
            const response = await fetch(`${API_URL}/barril/delBarril.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idBarril })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Barril deletado com sucesso!', 'success');
                this.listarBarris();
            } else {
                this.showToast(data.message || 'Erro ao deletar barril', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro de conexão com a API', 'error');
        }
    }

    async listarBarris() {
        const container = document.getElementById('listaBarris');
        container.innerHTML = '<p class="loading">Carregando barris...</p>';

        try {
            const response = await fetch(`${API_URL}/barril/conBarril.php`, {
                credentials: 'include'
            });
            const barris = await response.json();

            if (barris.length === 0) {
                container.innerHTML = '<p class="empty">Nenhum barril disponível no momento.</p>';
                return;
            }

            // Pegar ID do usuário logado
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
            const idUsuarioLogado = usuario.idUsuario;
            const isAdmin = usuario.admin === 1;

            container.innerHTML = barris.map(barril => {
                const percentual = (barril.vlLitrosAtual / barril.vlLitrosTotal) * 100;
                let statusClass = 'badge-success';
                if (percentual < 50) statusClass = 'badge-warning';
                if (percentual < 20) statusClass = 'badge-warning';

                // Verificar se o usuário logado é o dono do barril ou é admin
                const isOwner = barril.idUsuario === idUsuarioLogado;
                const canEdit = isOwner || isAdmin;

                return `
                    <div class="item">
                        <div class="item-header">
                            <div class="item-title">${barril.deProduto}</div>
                            <div>
                                <span class="badge ${statusClass}">ID: ${barril.idBarril}</span>
                                <span class="badge badge-info" style="margin-left: 8px;">👤 ${barril.nmUsuario || 'Desconhecido'}</span>
                            </div>
                        </div>
                        <div class="item-info">
                            <div>
                                <div class="info-label">Volume Total</div>
                                <div class="info-value">${barril.vlLitrosTotal.toFixed(2)} L</div>
                            </div>
                            <div>
                                <div class="info-label">Volume Atual</div>
                                <div class="info-value">${barril.vlLitrosAtual.toFixed(2)} L</div>
                            </div>
                            <div>
                                <div class="info-label">Disponibilidade</div>
                                <div class="info-value">${percentual.toFixed(1)}%</div>
                            </div>
                        </div>
                        <div class="progress">
                            <div class="progress-bar" style="width: ${percentual}%"></div>
                        </div>
                        <div class="item-actions">
                            ${canEdit ? `
                                <button class="btn-icon btn-edit" onclick="app.abrirModalEditar(${barril.idBarril}, '${barril.deProduto.replace(/'/g, "\\'")}', ${barril.vlLitrosTotal})">
                                    ✏️ Editar
                                </button>
                                <button class="btn-icon btn-delete" onclick="app.deletarBarril(${barril.idBarril})">
                                    🗑️ Deletar
                                </button>
                            ` : `
                                <span class="info-text" style="color: var(--text-muted); font-size: 0.9rem;">
                                    Apenas o proprietário pode editar/deletar
                                </span>
                            `}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Erro:', error);
            container.innerHTML = '<p class="empty">Erro ao carregar barris. Verifique a conexão.</p>';
        }
    }

    // ========== DEMANDAS ==========

    async carregarBarrisNoSelect() {
        const select = document.getElementById('idBarril');
        
        try {
            const response = await fetch(`${API_URL}/barril/conBarril.php`, {
                credentials: 'include'
            });
            const barris = await response.json();

            select.innerHTML = '<option value="">Selecione um barril</option>' +
                barris.map(b => `
                    <option value="${b.idBarril}" data-volume="${b.vlLitrosAtual}">
                        ${b.deProduto} - ${b.vlLitrosAtual.toFixed(2)}L disponíveis
                    </option>
                `).join('');

        } catch (error) {
            console.error('Erro ao carregar barris:', error);
        }
    }

    atualizarLimiteVolume() {
        const selectBarril = document.getElementById('idBarril');
        const inputVolume = document.getElementById('vlLitrosDemanda');
        const helperText = document.getElementById('volumeDisponivel');
        
        const selectedOption = selectBarril.options[selectBarril.selectedIndex];
        const volumeDisponivel = parseFloat(selectedOption.dataset.volume || 0);

        if (volumeDisponivel > 0) {
            inputVolume.max = volumeDisponivel;
            helperText.textContent = `Máximo disponível: ${volumeDisponivel.toFixed(2)}L`;
            helperText.style.color = 'var(--success)';
        } else {
            inputVolume.max = '';
            helperText.textContent = '';
        }
    }

    async criarDemanda() {
        const vlLitrosDemanda = parseFloat(document.getElementById('vlLitrosDemanda').value);
        const idBarril = parseInt(document.getElementById('idBarril').value);

        if (!idBarril) {
            this.showToast('Selecione um barril', 'warning');
            return;
        }

        // Validar volume disponível no frontend
        const selectBarril = document.getElementById('idBarril');
        const selectedOption = selectBarril.options[selectBarril.selectedIndex];
        const volumeDisponivel = parseFloat(selectedOption.dataset.volume || 0);

        if (vlLitrosDemanda > volumeDisponivel) {
            this.showToast(`Volume excede o disponível (${volumeDisponivel.toFixed(2)}L)`, 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/demanda/cadDemanda.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vlLitrosDemanda,
                    idBarril
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Demanda criada com sucesso!', 'success');
                document.getElementById('formDemanda').reset();
                this.listarDemandas();
                this.listarBarris(); // Recarregar barris pois o volume mudou
                this.carregarBarrisNoSelect();
            } else {
                this.showToast(data.message || 'Erro ao criar demanda', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro de conexão com a API', 'error');
        }
    }

    async listarDemandas() {
        const container = document.getElementById('listaDemandas');
        container.innerHTML = '<p class="loading">Carregando demandas...</p>';

        try {
            const response = await fetch(`${API_URL}/demanda/conDemanda.php`, {
                credentials: 'include'
            });
            const demandas = await response.json();

            if (demandas.length === 0) {
                container.innerHTML = '<p class="empty">Nenhuma demanda cadastrada.</p>';
                return;
            }

            // Separar demandas por status
            const naoIniciadas = demandas.filter(d => d.status === 0);
            const emAndamento = demandas.filter(d => d.status === 1);
            const concluidas = demandas.filter(d => d.status === 2);

            // Pegar dados do usuário logado
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
            const idUsuarioLogado = usuario.idUsuario;
            const isAdmin = usuario.admin === 1;

            // Verificar se existe alguma demanda em andamento
            const temDemandaEmAndamento = emAndamento.length > 0;

            // Função para renderizar uma demanda
            const renderDemanda = (demanda) => {
                const dataCadastro = new Date(demanda.dtCadastro);
                const dataFormatada = dataCadastro.toLocaleDateString('pt-BR') + ' ' + 
                                     dataCadastro.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                let dataInicio = '';
                if (demanda.dtInicio) {
                    const dtInicio = new Date(demanda.dtInicio);
                    dataInicio = dtInicio.toLocaleDateString('pt-BR') + ' ' + 
                                dtInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }
                
                let dataConclusao = '';
                let tempoDecorrido = '';
                if (demanda.dtConclusao) {
                    const dtConclusao = new Date(demanda.dtConclusao);
                    dataConclusao = dtConclusao.toLocaleDateString('pt-BR') + ' ' + 
                                   dtConclusao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    
                    // Calcular tempo decorrido se tiver dtInicio
                    if (demanda.dtInicio) {
                        const dtInicio = new Date(demanda.dtInicio);
                        const diffMs = dtConclusao - dtInicio;
                        const diffSecs = Math.floor(diffMs / 1000);
                        const diffMins = Math.floor(diffSecs / 60);
                        const diffHours = Math.floor(diffMins / 60);
                        const diffDays = Math.floor(diffHours / 24);
                        
                        if (diffDays > 0) {
                            const hours = diffHours % 24;
                            const mins = diffMins % 60;
                            tempoDecorrido = `${diffDays}d ${hours}h ${mins}m`;
                        } else if (diffHours > 0) {
                            const mins = diffMins % 60;
                            const secs = diffSecs % 60;
                            tempoDecorrido = `${diffHours}h ${mins}m ${secs}s`;
                        } else if (diffMins > 0) {
                            const secs = diffSecs % 60;
                            tempoDecorrido = `${diffMins}m ${secs}s`;
                        } else {
                            tempoDecorrido = `${diffSecs}s`;
                        }
                    }
                }

                // Verificar se pode deletar (admin ou dono do barril)
                const isOwnerBarril = demanda.idUsuarioBarril === idUsuarioLogado;
                const canDelete = isAdmin || isOwnerBarril;

                // Mapear status para texto e classe CSS
                const statusInfo = {
                    0: { texto: 'Não Iniciado', classe: 'status-nao-iniciado' },
                    1: { texto: 'Em Andamento', classe: 'status-em-andamento' },
                    2: { texto: 'Concluído', classe: 'status-concluido' }
                };
                const status = statusInfo[demanda.status] || statusInfo[0];

                // Botões baseados no status
                let acoes = '';
                if (demanda.status === 0) {
                    // Não Iniciado - pode Iniciar (mas desabilita se já tem outra em andamento)
                    const disabled = temDemandaEmAndamento ? 'disabled' : '';
                    acoes = `
                        <button class="btn btn-primary" onclick="app.iniciarDemanda(${demanda.idDemanda})" ${disabled}>
                            ▶️ Iniciar
                        </button>
                    `;
                } 

                return `
                    <div class="item" data-demanda-id="${demanda.idDemanda}">
                        <div class="item-header">
                            <div class="item-title">
                                Demanda #${demanda.idDemanda}
                                <span class="status-badge ${status.classe}">${status.texto}</span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                ${acoes}
                                ${canDelete && demanda.status !== 2 ? `
                                    <button class="btn-icon btn-delete" onclick="app.deletarDemanda(${demanda.idDemanda})">
                                        🗑️ Deletar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="item-info">
                            <div>
                                <div class="info-label">Volume Solicitado</div>
                                <div class="info-value">${demanda.vlLitrosDemanda.toFixed(2)} L</div>
                            </div>
                            <div>
                                <div class="info-label">Barril</div>
                                <div class="info-value">${demanda.deProduto} (ID: ${demanda.idBarril})</div>
                            </div>
                            <div>
                                <div class="info-label">Disponível no Barril</div>
                                <div class="info-value">${demanda.vlLitrosAtual.toFixed(2)} L</div>
                            </div>
                            <div>
                                <div class="info-label">Data de Cadastro</div>
                                <div class="info-value">${dataFormatada}</div>
                            </div>
                            ${dataInicio ? `
                            <div>
                                <div class="info-label">Data de Início</div>
                                <div class="info-value">${dataInicio}</div>
                            </div>
                            ` : ''}
                            ${dataConclusao ? `
                            <div>
                                <div class="info-label">Data de Conclusão</div>
                                <div class="info-value">${dataConclusao}</div>
                            </div>
                            ` : ''}
                            ${tempoDecorrido ? `
                            <div>
                                <div class="info-label">⏱️ Tempo Decorrido</div>
                                <div class="info-value" style="color: var(--primary); font-weight: 600;">${tempoDecorrido}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            };

            // Montar HTML com seções separadas
            let html = '';

            // Seção: Não Iniciado
            if (naoIniciadas.length > 0) {
                html += '<div class="section-header">🔵 Não Iniciado</div>';
                html += naoIniciadas.map(renderDemanda).join('');
            }

            // Seção: Em Andamento
            if (emAndamento.length > 0) {
                html += '<div class="section-header">🟡 Em Andamento</div>';
                html += emAndamento.map(renderDemanda).join('');
            }

            // Seção: Concluídas
            if (concluidas.length > 0) {
                html += '<div class="section-header">🟢 Concluídas</div>';
                html += concluidas.map(renderDemanda).join('');
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Erro:', error);
            container.innerHTML = '<p class="empty">Erro ao carregar demandas. Verifique a conexão.</p>';
        }
    }

    // Polling para atualizar status das demandas automaticamente
    iniciarPollingDemandas() {
        // Atualizar a cada 5 segundos
        setInterval(() => {
            // Apenas atualizar se estiver na aba de demandas
            const tabDemandas = document.getElementById('demandas');
            if (tabDemandas && tabDemandas.classList.contains('active')) {
                this.atualizarStatusDemandas();
            }
        }, 5000);
    }

    async atualizarStatusDemandas() {
        try {
            const response = await fetch(`${API_URL}/demanda/conDemanda.php`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                return;
            }
            
            const demandasAtuais = await response.json();

            // Pegar elementos visíveis na tela
            const elementosVisiveis = document.querySelectorAll('[data-demanda-id]');
            
            // Se a quantidade mudou, recarregar tudo
            if (elementosVisiveis.length !== demandasAtuais.length) {
                this.listarDemandas();
                this.listarBarris();
                this.carregarBarrisNoSelect();
                return;
            }

            // Verificar se algum status mudou
            let statusMudou = false;
            for (const demanda of demandasAtuais) {
                const elemento = document.querySelector(`[data-demanda-id="${demanda.idDemanda}"]`);
                if (elemento) {
                    const badge = elemento.querySelector('.status-badge');
                    const statusInfo = {
                        0: { texto: 'Não Iniciado', classe: 'status-nao-iniciado' },
                        1: { texto: 'Em Andamento', classe: 'status-em-andamento' },
                        2: { texto: 'Concluído', classe: 'status-concluido' }
                    };
                    const novoStatus = statusInfo[demanda.status];
                    
                    if (badge) {
                        const textoAtual = badge.textContent.trim();
                        
                        if (textoAtual !== novoStatus.texto) {
                            statusMudou = true;
                            break;
                        }
                    }
                } else {
                    // Elemento não encontrado, algo mudou
                    statusMudou = true;
                    break;
                }
            }

            if (statusMudou) {
                this.listarDemandas();
                this.listarBarris();
                this.carregarBarrisNoSelect();
            }
        } catch (error) {
            console.error('Erro no polling:', error);
        }
    }

    async iniciarDemanda(idDemanda) {
        try {
            const response = await fetch(`${API_URL}/demanda/atuStatusDemanda.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idDemanda,
                    status: 1 // Em Andamento
                })
            });
            
            if (!response.ok) {
                this.showToast(`Erro HTTP: ${response.status}`, 'error');
                return;
            }

            const data = await response.json();

            if (data.success) {
                this.showToast('Demanda iniciada!', 'success');
                this.listarDemandas();
            } else {
                this.showToast(data.message || 'Erro ao iniciar demanda', 'error');
            }
        } catch (error) {
            console.error('Erro ao iniciar demanda:', error);
            this.showToast('Erro de conexão com a API', 'error');
        }
    }

    async finalizarDemanda(idDemanda) {
        this.abrirModalConfirmar(
            'Finalizar Demanda',
            'Deseja finalizar esta demanda?',
            '✓ Esta operação confirmará a conclusão.',
            'Sim, Finalizar',
            'success',
            () => this.confirmarFinalizarDemanda(idDemanda)
        );
    }

    async confirmarFinalizarDemanda(idDemanda) {
        this.fecharModalConfirmar();

        try {
            const response = await fetch(`${API_URL}/demanda/atuStatusDemanda.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idDemanda,
                    status: 2 // Concluído
                })
            });
            
            if (!response.ok) {
                this.showToast(`Erro HTTP: ${response.status}`, 'error');
                return;
            }

            const data = await response.json();

            if (data.success) {
                this.showToast('Demanda finalizada com sucesso!', 'success');
                this.listarDemandas();
            } else {
                this.showToast(data.message || 'Erro ao finalizar demanda', 'error');
            }
        } catch (error) {
            console.error('Erro ao finalizar demanda:', error);
            this.showToast('Erro de conexão com a API', 'error');
        }
    }

    deletarDemanda(idDemanda) {
        this.abrirModalConfirmar(
            'Confirmar Exclusão',
            'Tem certeza que deseja deletar esta demanda?',
            '⚠️ Esta ação não pode ser desfeita!',
            'Sim, Deletar',
            'danger',
            () => this.confirmarDeletarDemanda(idDemanda)
        );
    }

    async confirmarDeletarDemanda(idDemanda) {
        this.fecharModalConfirmar();

        try {
            const response = await fetch(`${API_URL}/demanda/delDemanda.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idDemanda })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(data.message || 'Demanda deletada com sucesso!', 'success');
                this.listarDemandas();
                this.listarBarris(); // Recarregar barris pois pode ter devolvido volume
                this.carregarBarrisNoSelect();
            } else {
                this.showToast(data.message || 'Erro ao deletar demanda', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro de conexão com a API', 'error');
        }
    }

    // ========== USUÁRIOS ==========

    abrirCadastroUsuario() {
        document.getElementById('formCadastrarUsuario').reset();
        document.getElementById('formCadastroUsuarioCard').style.display = 'block';
        document.getElementById('formUsuarioCard').style.display = 'none';
        document.getElementById('formCadastroUsuarioCard').scrollIntoView({ behavior: 'smooth' });
    }

    cancelarCadastroUsuario() {
        document.getElementById('formCadastrarUsuario').reset();
        document.getElementById('formCadastroUsuarioCard').style.display = 'none';
    }

    async cadastrarUsuario() {
        const nmUsuario = document.getElementById('cadNmUsuario').value;
        const deEmail = document.getElementById('cadDeEmail').value;
        const deSenha = document.getElementById('cadDeSenha').value;
        const admin = document.getElementById('cadAdmin').checked ? 1 : 0;

        try {
            const response = await fetch(`${API_URL}/usuario/cadUsuario.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nmUsuario,
                    deEmail,
                    deSenha,
                    admin
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Usuário cadastrado com sucesso!', 'success');
                this.cancelarCadastroUsuario();
                this.listarUsuarios();
            } else {
                this.showToast(data.message || 'Erro ao cadastrar usuário', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro de conexão com a API', 'error');
        }
    }

    async listarUsuarios() {
        const container = document.getElementById('listaUsuarios');
        container.innerHTML = '<p class="loading">Carregando usuários...</p>';

        try {
            const response = await fetch(`${API_URL}/usuario/conUsuario.php`, {
                credentials: 'include'
            });
            const usuarios = await response.json();

            if (usuarios.length === 0) {
                container.innerHTML = '<p class="empty">Nenhum usuário cadastrado.</p>';
                return;
            }

            // Pegar dados do usuário logado
            const userData = JSON.parse(localStorage.getItem('usuario') || '{}');
            const isAdmin = userData.admin === 1;

            container.innerHTML = usuarios.map(usuario => {
                const adminBadge = usuario.admin === 1 ? '<span class="badge badge-warning" style="margin-left: 8px;">👑 Admin</span>' : '';
                
                return `
                    <div class="item">
                        <div class="item-header">
                            <div class="item-title">${usuario.nmUsuario}${adminBadge}</div>
                            <span class="badge badge-info">ID: ${usuario.idUsuario}</span>
                        </div>
                        <div class="item-info">
                            <div>
                                <div class="info-label">Email</div>
                                <div class="info-value">${usuario.deEmail}</div>
                            </div>
                            <div>
                                <div class="info-label">Tipo</div>
                                <div class="info-value">${usuario.admin === 1 ? 'Administrador' : 'Usuário'}</div>
                            </div>
                        </div>
                        ${isAdmin ? `
                            <div class="item-actions">
                                <button class="btn-icon btn-edit" onclick="app.abrirEdicaoUsuario(${usuario.idUsuario}, '${usuario.nmUsuario.replace(/'/g, "\\'")}', '${usuario.deEmail.replace(/'/g, "\\'")}', ${usuario.admin})">
                                    ✏️ Editar
                                </button>
                                <button class="btn-icon btn-delete" onclick="app.deletarUsuario(${usuario.idUsuario})">
                                    🗑️ Deletar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Erro:', error);
            container.innerHTML = '<p class="empty">Erro ao carregar usuários. Verifique a conexão.</p>';
        }
    }

    abrirEdicaoUsuario(idUsuario, nmUsuario, deEmail, admin) {
        document.getElementById('editIdUsuario').value = idUsuario;
        document.getElementById('editNmUsuario').value = nmUsuario;
        document.getElementById('editDeEmail').value = deEmail;
        document.getElementById('editAdmin').checked = admin === 1;
        document.getElementById('formUsuarioCard').style.display = 'block';
        document.getElementById('formCadastroUsuarioCard').style.display = 'none';
        document.getElementById('formUsuarioCard').scrollIntoView({ behavior: 'smooth' });
    }

    cancelarEdicaoUsuario() {
        document.getElementById('formEditarUsuario').reset();
        document.getElementById('formUsuarioCard').style.display = 'none';
        document.getElementById('formCadastroUsuarioCard').style.display = 'none';
    }

    async atualizarUsuario() {
        const idUsuario = parseInt(document.getElementById('editIdUsuario').value);
        const nmUsuario = document.getElementById('editNmUsuario').value;
        const deEmail = document.getElementById('editDeEmail').value;
        const admin = document.getElementById('editAdmin').checked ? 1 : 0;

        try {
            const response = await fetch(`${API_URL}/usuario/atuUsuario.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idUsuario,
                    nmUsuario,
                    deEmail,
                    admin
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Usuário atualizado com sucesso!', 'success');
                this.cancelarEdicaoUsuario();
                this.listarUsuarios();
            } else {
                this.showToast(data.message || 'Erro ao atualizar usuário', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro de conexão com a API', 'error');
        }
    }

    deletarUsuario(idUsuario) {
        this.abrirModalConfirmar(
            'Confirmar Exclusão',
            'Tem certeza que deseja deletar este usuário?',
            '⚠️ Esta ação não pode ser desfeita!',
            'Sim, Deletar',
            'danger',
            () => this.confirmarExclusaoUsuario(idUsuario)
        );
    }

    async confirmarExclusaoUsuario(idUsuario) {
        this.fecharModalConfirmar();

        try {
            const response = await fetch(`${API_URL}/usuario/delUsuario.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idUsuario })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Usuário deletado com sucesso!', 'success');
                this.listarUsuarios();
            } else {
                this.showToast(data.message || 'Erro ao deletar usuário', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro de conexão com a API', 'error');
        }
    }

    // ========== UTILIDADES ==========

    async logout() {
        try {
            await fetch(`${API_URL}/auth/logout.php`, {
                method: 'POST',
                credentials: 'include'
            });
            
            // Limpar localStorage
            localStorage.removeItem('usuario');
            
            // Redirecionar para login
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            // Mesmo com erro, limpar e redirecionar
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Inicializa a aplicação quando o DOM estiver pronto
const app = new DosagemApp();
