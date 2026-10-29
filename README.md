# SHOPEE FLOW 360

Protótipo local de expedição para demonstração a gestores e líderes. Dados inteiramente fictícios. Não há backend, autenticação, telemetria ou conexão com sistemas internos. Não publicado.

## Executar no Windows

Requer Node.js 22.12+ ou 24 e npm. Abra um terminal nesta pasta e execute:

```powershell
npm ci
npm run dev
```

Abra a URL local exibida (normalmente http://127.0.0.1:5173). O servidor aceita apenas conexões locais. Para encerrar, use Ctrl+C no terminal.

## Verificar e gerar versão de apresentação

```powershell
npm test
npm run build
npm run preview
```

O build fica em `dist/`. Abra pelo servidor de preview; clicar diretamente no index.html não executa corretamente os módulos. `package-lock.json` fixa as versões instaladas.

As dependências já estão instaladas neste PC. Para o próximo uso, dê dois cliques em `INICIAR.cmd` e abra a URL exibida. A janela precisa permanecer aberta durante a apresentação.

Verificação realizada em 29/10/2026: quatro testes automatizados aprovados, compilação TypeScript e build Vite concluídos, servidor local com HTTP 200. A ferramenta de controle do navegador não conseguiu anexar a visualização; aparência, interação no navegador e renderização WebGL ainda precisam de conferência manual no PC. Antes de apresentar, percorra o roteiro abaixo e confira também a câmera, seleção de docas e modo apresentação.

## Roteiro de demonstração

1. Mostre os KPIs e as oito docas no cenário 3D. Arraste para girar, role para aproximar e selecione a doca 03.
2. Pause e retome o relógio; acelere para 5× para observar caminhões saindo e retornando.
3. Simule retenção. A doca 04 interrompe a carga durante 60 minutos simulados. Veja o registro na aba Eventos.
4. Compare os três cenários em uma janela fixa de 120 minutos. Aplique Fluxo otimizado; o turno reinicia nas mesmas condições.
5. Ative Modo apresentação. Esc sai; Espaço pausa quando o foco está no corpo da página.

## Modelo e limites

1 segundo real corresponde a 1 minuto simulado na velocidade 1×. Cada carga contém 800 volumes. Progresso por minuto: taxa do cenário × (0,86 + número da doca × 0,035). As taxas base são 0,65% (atual), 0,94% (otimizado) e 0,55% (pico). O retorno de uma carga segue um intervalo modular de 14, 9 ou 6 minutos, respectivamente. São regras didáticas, não um modelo validado de capacidade.

Volumes e cargas são acumulados ao concluir cada carga. A ocupação conta docas carregando ou atrasadas. Tempo de ciclo é uma estimativa pela taxa base; não inclui fila, deslocamento ou conferência. A comparação é determinística e independente da simulação atual, sem retenções. O estado dura somente durante a sessão e reinicia ao recarregar.

Renderização 3D exige navegador com WebGL e aceleração de hardware. Em caso de falha, os cartões de docas e os controles mantêm o acesso aos dados. Câmera e movimentos são ilustrativos; não representam medidas reais do CD. O modo apresentação usa o espaço da aplicação, não exige tela cheia do navegador. Use F11 manualmente se desejar tela cheia.

## Organização e próximos passos

- `src/Scene.tsx`: galpão, oito docas, caminhões animados, câmera e seleção.
- `src/simulation.ts`: estado, eventos e projeções puras, sem dependência da interface.
- `src/App.tsx`: KPIs, inspeção, cenários, eventos e apresentação.
- `src/style.css`: identidade grafite/laranja, responsividade e integração Tailwind v4.
- `src/simulation.test.ts`: invariantes, retenção, imutabilidade e comparação.

Próximas etapas sugeridas: validar regras com responsáveis operacionais; testar acessibilidade e desempenho em equipamentos de apresentação; acrescentar séries históricas e entradas parametrizadas; definir critérios de segurança e obter aprovação antes de conectar dados internos ou publicar.

Referências técnicas: [Vite](https://vite.dev/guide/), [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/installation), [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite).
