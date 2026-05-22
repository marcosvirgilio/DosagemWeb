// Configuração da API
const API_URL = 'http://10.13.252.247/DosagemApi';

// Classe de Autenticação
class AuthApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupForms();
    }

    // Configurar navegação por tabs
    setupTabs() {
        const tabBtns = document.querySelectorAll('.login-tab-btn');
        const tabContents = document.querySelectorAll('.login-tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;

                // Remove active de todos
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Adiciona active no clicado
                btn.classList.add('active');
                document.getElementById(tabName).classList.add('active');
            });
        });
    }

    // Configurar formulários
    setupForms() {
        // Form de login - evento submit
        const formLogin = document.getElementById('formLogin');
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Botão de login - fallback onclick
        const btnLogin = document.getElementById('btnLogin');
        if (btnLogin) {
            btnLogin.addEventListener('click', (e) => {
                e.preventDefault();
                if (formLogin.checkValidity()) {
                    this.login();
                } else {
                    formLogin.reportValidity();
                }
            });
        }

        // Form de registro - evento submit
        const formRegister = document.getElementById('formRegister');
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Botão de registro - fallback onclick
        const btnRegister = document.getElementById('btnRegister');
        if (btnRegister) {
            btnRegister.addEventListener('click', (e) => {
                e.preventDefault();
                if (formRegister.checkValidity()) {
                    this.register();
                } else {
                    formRegister.reportValidity();
                }
            });
        }

        // Fallback para Enter nos campos
        const inputs = document.querySelectorAll('#formLogin input, #formRegister input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const form = input.closest('form');
                    if (form.id === 'formLogin') {
                        if (formLogin.checkValidity()) {
                            this.login();
                        } else {
                            formLogin.reportValidity();
                        }
                    } else if (form.id === 'formRegister') {
                        if (formRegister.checkValidity()) {
                            this.register();
                        } else {
                            formRegister.reportValidity();
                        }
                    }
                }
            });
        });
    }

    // Login
    async login() {
        const deEmail = document.getElementById('loginEmail').value;
        const deSenha = document.getElementById('loginSenha').value;
        const btnLogin = document.getElementById('btnLogin');

        this.showLoader();
        btnLogin.disabled = true;

        try {
            const response = await fetch(`${API_URL}/auth/login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    deEmail,
                    deSenha
                })
            });

            const data = await response.json();

            this.hideLoader();

            if (data.success) {
                this.showToast('Login realizado com sucesso!', 'success');
                
                // Salvar dados do usuário no localStorage
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                // Redirecionar para a página principal
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showToast(data.message || 'Erro ao fazer login', 'error');
                btnLogin.disabled = false;
            }
        } catch (error) {
            console.error('Erro:', error);
            this.hideLoader();
            this.showToast('Erro de conexão com a API', 'error');
            btnLogin.disabled = false;
        }
    }

    // Registro
    async register() {
        const nmUsuario = document.getElementById('registerNome').value;
        const deEmail = document.getElementById('registerEmail').value;
        const deSenha = document.getElementById('registerSenha').value;
        const confirmaSenha = document.getElementById('registerConfirmaSenha').value;
        const btnRegister = document.getElementById('btnRegister');

        // Validar senhas
        if (deSenha !== confirmaSenha) {
            this.showToast('As senhas não coincidem', 'error');
            return;
        }

        if (deSenha.length < 6) {
            this.showToast('A senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }

        this.showLoader();
        btnRegister.disabled = true;

        try {
            const response = await fetch(`${API_URL}/auth/register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    nmUsuario,
                    deEmail,
                    deSenha
                })
            });

            const data = await response.json();

            this.hideLoader();

            if (data.success) {
                this.showToast('Cadastro realizado com sucesso!', 'success');
                
                // Salvar dados do usuário no localStorage
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                // Redirecionar para a página principal
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showToast(data.message || 'Erro ao cadastrar', 'error');
                btnRegister.disabled = false;
            }
        } catch (error) {
            console.error('Erro:', error);
            this.hideLoader();
            this.showToast('Erro de conexão com a API', 'error');
            btnRegister.disabled = false;
        }
    }

    // Toast
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Loader
    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('show');
        }
    }

    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.remove('show');
        }
    }
}

// Inicializa a aplicação
const authApp = new AuthApp();
