# Sistema de Dosagem - Front-End

Interface web moderna e responsiva para o sistema de controle de dosagem de barris.

## 📁 Estrutura de Arquivos

```
FrontEnd/
├── index.html   # Estrutura HTML da aplicação
├── style.css    # Estilos CSS (design clean e moderno)
├── app.js       # Lógica JavaScript e integração com API
└── README.md    # Este arquivo
```

## 🚀 Como Usar

### 1. Abrir a Aplicação

Simplesmente abra o arquivo `index.html` em um navegador web moderno:
- Chrome (recomendado)
- Firefox
- Edge
- Safari

### 2. Funcionalidades

#### 🍺 **Aba Barris**

**Cadastrar Novo Barril:**
- Preencha o nome do produto (ex: "Chopp Pilsen")
- Informe o volume total em litros
- Clique em "Cadastrar Barril"

**Visualizar Barris:**
- Lista automática de todos os barris disponíveis
- Mostra volume total, atual e percentual de disponibilidade
- Barra de progresso visual
- Botão para atualizar a lista

#### 📋 **Aba Demandas**

**Criar Nova Demanda:**
- Selecione um barril disponível
- Informe a quantidade de litros necessária
- Digite o ID do usuário
- Clique em "Criar Demanda"

**Gerenciar Demandas:**
- Lista de todas as demandas pendentes
- Informações de volume, barril, usuário e data
- Botão para finalizar cada demanda
- Atualização automática após ações

## 🎨 Características do Design

✨ **Interface Clean e Moderna**
- Design minimalista com cores profissionais
- Espaçamento adequado para boa legibilidade
- Animações suaves em hover e transições

📱 **Responsivo**
- Adaptável a diferentes tamanhos de tela
- Mobile-friendly
- Layout em grid flexível

🎯 **UX Amigável**
- Notificações toast para feedback visual
- Validação de formulários
- Confirmações antes de ações importantes
- Estados de loading durante requisições

## ⚙️ Configuração

### Alterar URL da API

No arquivo `app.js`, linha 2:

```javascript
const API_URL = 'http://193.203.175.91/';
```

Altere para o seu domínio onde a API está hospedada.

## 🔌 Integração com a API

A aplicação consome os seguintes endpoints:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/cadBarril.php` | POST | Cadastra novo barril |
| `/conBarril.php` | GET | Lista barris disponíveis |
| `/cadDemanda.php` | POST | Cria nova demanda |
| `/conDemanda.php` | GET | Lista demandas pendentes |
| `/finalizaDemanda.php` | POST | Finaliza demanda |

## 🛠️ Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna (Flexbox, Grid, Variables)
- **JavaScript ES6+** - Lógica e integração (Fetch API, Classes, Async/Await)

## 📦 Sem Dependências

✅ Não requer Node.js, npm ou qualquer framework  
✅ Não precisa de build ou compilação  
✅ Funciona diretamente no navegador  
✅ Arquivos estáticos puros  

## 🎓 Estrutura do Código JavaScript

```javascript
class DosagemApp {
  // Inicialização e configurações
  init()
  setupTabs()
  setupForms()
  
  // Gestão de Barris
  cadastrarBarril()
  listarBarris()
  
  // Gestão de Demandas
  criarDemanda()
  listarDemandas()
  finalizarDemanda()
  carregarBarrisNoSelect()
  
  // Utilidades
  showToast()
}
```

## 💡 Dicas de Uso

1. **Cadastre barris** antes de criar demandas
2. Use o botão **🔄 Atualizar** para ver mudanças em tempo real
3. As **notificações toast** aparecem no canto inferior direito
4. Demandas finalizadas desaparecem automaticamente da lista
5. Barris sem volume disponível não aparecem na listagem

## 🐛 Troubleshooting

**API não responde?**
- Verifique a URL da API no `app.js`
- Confirme que os headers CORS estão configurados na API
- Abra o Console do navegador (F12) para ver erros

**Dados não aparecem?**
- Verifique sua conexão com internet
- Confirme que o servidor da API está online
- Verifique se há dados cadastrados no banco

## 📄 Licença

Livre para uso educacional e comercial.
