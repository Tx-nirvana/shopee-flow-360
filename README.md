# SHOPEE FLOW 360 · Shipping Diário

Centro de comando demonstrativo para acompanhar o plano de saídas e o caminho da carga: **balcão → conferência → transferência → doca → caminhão**. Identidade grafite/laranja, cenário 3D em corte, programação de saídas, alertas, previsto versus realizado e modo apresentação.

Todos os dados são fictícios. Nenhum sistema ou documento interno foi conectado. O código está no GitHub; não há site hospedado ou backend. O estado reinicia ao recarregar.

## Abrir no PC

Neste PC, as dependências já estão instaladas. Dê dois cliques em `INICIAR.cmd`, mantenha a janela aberta e acesse a URL exibida, normalmente http://127.0.0.1:5173. Encerre com Ctrl+C.

Em outro computador, instale Node.js 22.12+ ou 24, baixe o repositório, abra um terminal na pasta e execute:

```powershell
npm ci
npm run dev
```

O servidor atende apenas o próprio computador. Para validar e gerar uma versão compilada:

```powershell
npm test
npm run build
npm run preview
```

O build fica em `dist/` e deve ser aberto por um servidor, não clicando diretamente no HTML. O arquivo `package-lock.json` fixa as versões das dependências.

## Roteiro de apresentação

1. Comece às 14h e mostre o plano de oito saídas, totalizando 6.400 volumes. A data 29/10/2026 identifica o dia demonstrativo, não dados reais de hoje.
2. Selecione Campinas na linha das próximas saídas. A rota até a doca 02, a carga na lateral e a linha da tabela correspondem ao mesmo destino. Também é possível selecionar pelo 3D, pelos alertas ou pela tabela.
3. Acompanhe as cinco etapas. Os volumes nos caminhões excluem cargas já expedidas; a soma das etapas sempre totaliza 6.400 volumes.
4. Use **Priorizar no balcão** para atender o destino selecionado antes da ordem normal. A prioridade não aumenta a capacidade nem cria novos volumes.
5. Use **Reter balcão por 20 min**. A conferência para, mas as docas continuam consumindo os volumes já separados. Use **Reter doca 04 por 60 min** para simular uma retenção no carregamento.
6. Acelere até 10×. Um caminhão pronto aguarda seu horário; um caminhão incompleto permanece até concluir a carga e registra o atraso.
7. Compare os três cenários em uma janela de 180 min, usando o mesmo plano e estoque inicial. Aplicar um cenário reinicia o turno e remove intervenções anteriores.
8. Ative **Modo apresentação**. Esc sai; Espaço pausa quando o foco está no corpo da página. F11 pode ser usado manualmente para tela cheia do navegador.

## Regras do modelo

- Oito caminhões, cada um com uma carga de 800 volumes e um destino fixo. Não há reposição de caminhões após a saída neste turno.
- Horários previstos, por doca: 15h40, 16h, 14h40, 15h20, 16h30, 16h05, 15h30 e 17h.
- O estoque inicial de cada destino é distribuído entre balcão, doca e caminhão. Os totais por etapa são mutuamente exclusivos.
- 1 segundo real equivale a 1 minuto simulado em 1×. O relógio para ao concluir as oito saídas.
- O balcão atende os destinos por horário previsto, exceto uma prioridade manual ativa. Confere até 36 volumes/min no cenário atual, 56 no otimizado e 18 no sobrecarregado.
- Um lote conferido leva 4 minutos simulados para chegar à doca. As caixas em movimento são representações de lotes; uma caixa 3D não equivale a um volume individual.
- Cada doca carrega até `floor(taxa × 8 × (0,86 + doca × 0,035))` volumes/min, limitada ao estoque separado. Taxas: 0,65, 0,94 e 0,55 nos três cenários.
- A saída exige carga completa, horário previsto atingido e ausência de retenção ativa. Saídas atrasadas são registradas uma única vez. O realizado é o horário efetivo de partida.
- A estimativa conservadora soma espera de conferência/transporte e carregamento, respeitando o horário previsto e retenções. Como etapas reais da simulação se sobrepõem, ela pode sinalizar risco que se resolve antes do corte. Não é uma previsão validada.
- Pontualidade mostra a porcentagem das saídas já realizadas que cumpriram o horário. Antes da primeira saída, é exibido “—”.
- O histórico mantém os últimos 40 eventos. Prioridades, conferências concluídas, cortes perdidos e saídas geram registros.

## Verificação

Em 29/10/2026: **12 testes automatizados aprovados**, TypeScript e build Vite concluídos, servidor local respondendo HTTP 200. A verificação cobre conservação de volumes em todos os cenários durante 600 min, transporte, retenções, prioridade, bloqueio sem estoque, horários, partidas únicas, imutabilidade e comparação determinística.

Resultados demonstrativos até 17h, sem intervenções manuais:

| Cenário | Volumes expedidos | Caminhões expedidos | Saídas no prazo |
| --- | ---: | ---: | ---: |
| Operação atual | 4.800 | 6 | 4 |
| Fluxo otimizado | 6.400 | 8 | 7 |
| Balcão sobrecarregado | 4.800 | 6 | 2 |

A ferramenta de navegador está bloqueando a observação da página local; a aparência, interações no navegador e renderização WebGL desta versão precisam de conferência manual antes da apresentação. Use um navegador com aceleração de hardware. Sem 3D, os painéis e a tabela continuam oferecendo os dados e controles.

## Arquivos principais

- `src/ShippingDashboard.tsx`: programação, indicadores, comparação, inspeção e controles.
- `src/shipping.ts`: regras puras de fluxo, estoque, cortes, prioridade e projeções.
- `src/Scene.tsx`: balcão, esteiras, rotas, lotes, docas e caminhões.
- `src/shipping.css`: identidade visual e layouts responsivos do Shipping Diário.
- `src/simulation.test.ts`: testes do modelo integrado.
- `src/App.tsx` e `src/simulation.ts`: pontos de entrada para o painel e o modelo.

Próximas etapas: validar horários e regras com os responsáveis; conferir legibilidade e desempenho no equipamento de apresentação; definir dados, permissões e critérios de segurança antes de qualquer integração real ou publicação do site.
