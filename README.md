# Circuitos Lógicos · CM

Simulador de circuitos lógicos digitais, construído com React + Vite. Suporta portas lógicas básicas, entradas, saídas e clock, com propagação de sinais em tempo real.

## ⚡ Status atual

**v0.1 — motor preview.** Foco em funcionalidade lógica do motor (engine) acoplado a uma interface inspirada no Logic.ly.

### Componentes disponíveis

- **Entradas:** Interruptor (toggle 0/1), Relógio (clock periódico)
- **Saídas:** Lâmpada (probe visual)
- **Portas lógicas:** AND, OR, NOT, NAND, NOR, XOR, XNOR
- **Presets:** Half Adder, SR Latch (NOR-based)

### Funcionalidades

- Drag-and-drop da sidebar para o canvas
- Conexão de fios clicando em pinos (saída → entrada)
- Propagação topológica em tempo real (suporta ciclos com feedback)
- Toggle visual de inputs com estado 0/1 sincronizado
- Atalhos: `Delete` / `Backspace` para excluir, `ESC` para cancelar conexão

## 🚀 Desenvolvimento local

Pré-requisitos: Node.js 18+ e npm.

```bash
# Instalar dependências
npm install

# Rodar em modo dev (http://localhost:5173)
npm run dev

# Build de produção
npm run build

# Preview do build local
npm run preview
```

## 📦 Deploy no GitHub Pages

O projeto já está configurado para deploy automático via **GitHub Actions**.

### Setup inicial (uma única vez)

1. Crie e/ou faça push para o repositório `circuitos-logicos-cm` no GitHub.
2. Vá em **Settings → Pages** do repositório.
3. Em **Source**, selecione **GitHub Actions**.
4. Faça push para a branch `main`. O workflow irá build & deploy automaticamente.

### URL final

A aplicação ficará disponível em:

```
https://EQuaresma07.github.io/circuitos-logicos-cm/
```

### Deploy manual (alternativo)

Caso prefira deploy manual via `gh-pages`:

```bash
npm run deploy
```

Isso irá build e fazer push da pasta `dist/` para a branch `gh-pages`.

## 🏗️ Arquitetura

```
src/
├── engine/                  # Motor de simulação (puro JS, sem dependências de UI)
│   ├── components.js        # Pin, Wire, Component, Gate, InputSwitch, OutputProbe, Clock
│   ├── propagation.js       # Ordenação topológica + propagação de sinais
│   └── presets.js           # Half Adder, SR Latch
├── components/              # Componentes React (UI)
│   ├── MenuBar.jsx          # Barra superior + toolbar
│   ├── Sidebar.jsx          # Paleta de componentes (drag source)
│   ├── Canvas.jsx           # SVG canvas (drop target, render, interação)
│   ├── StatusBar.jsx        # Barra de status no rodapé
│   └── GateSymbols.jsx      # Símbolos SVG das portas (estilo IEEE/ANSI)
├── App.jsx                  # Costura geral, gerencia estado
├── main.jsx                 # Entry point React
└── styles.css               # Estilos globais
```

### Fluxo de propagação

A cada frame (`requestAnimationFrame`):

1. Avalia todos os componentes-fonte (`InputSwitch`, `Clock`)
2. Calcula ordenação topológica do grafo de componentes
3. Para cada nó na ordem, copia valores dos fios para pinos de entrada e chama `evaluate()`

Ciclos (feedback) são tratados graciosamente — o motor estabiliza em iterações sucessivas conforme o React re-renderiza.

## 🎯 Próximos passos planejados

- [ ] Serialização de circuitos (export/import JSON, salvar em `localStorage`)
- [ ] Tabela verdade automática
- [ ] Subcircuitos reutilizáveis
- [ ] Mais componentes (Buffer, displays de 7 segmentos, flip-flops)
- [ ] Pan & zoom no canvas
- [ ] Undo/redo

## 📄 Licença

Projeto educacional. Uso livre.
