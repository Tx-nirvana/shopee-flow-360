# Entrega · Shopee Flow 360

Implementação a partir do commit f9194fb, publicada no GitHub e em hospedagem Sites privada. Sem alteração de dados reais, backend ou site Apps Script. As melhorias permanecem em commits separados.

## Alterações e como testar

| Melhoria | O que mudou e por quê | Arquivos em src/ | Como testar |
|---|---|---|---|
| Turno 08h–20h | Limite explícito, comparação de 720 min, horários absolutos preservados | shipping.ts, ShippingDashboard.tsx, simulation.test.ts | Inicie às 08h; use End no controle de tempo e confirme 20h; cargas pendentes não desaparecem |
| Cenários independentes | Cenários variam só o balcão; mesma velocidade de docas | shipping.ts, ShippingDashboard.tsx, simulation.test.ts | Compare 36/56/18; velocidades das oito docas continuam iguais |
| Editor | Parâmetros validados e estoques iniciais proporcionais | parameters.ts, SettingsPanel.tsx, shipping.ts, painel, CSS, testes | Edite capacidade da doca 1 para 900: total vira 6.500; tente zero e veja validação |
| Faixa de conclusão | Projeção provável por continuação paralela; extremos ±20% ilustrativos | shipping.ts, painel, CSS, testes | Concentre os horários perto das 08h; compare provável com partida efetiva sem novas intervenções |
| Gargalos e causas | Pressão por fila/capacidade, resumo e espera após cortes com distinção de retenções | diagnostics.ts, TurnSummary.tsx, shipping.ts, painel, CSS, testes | Retenha balcão ou doca; configure cortes curtos; avance e leia etapa destacada e causas no resumo |
| Navegação temporal | Replay exato e ramificação quando há nova decisão no passado | timeline.ts, painel, testes | Retenha às 08h; avance 10 min, volte e avance: estoque e eventos se repetem sem duplicação |
| Persistência | Sessão versionada no localStorage, recuperação e avisos | persistence.ts, painel, CSS, testes | Aplique retenção, avance e recarregue: relógio e retenção voltam pausados |
| CSV | Resultados e hipóteses exportáveis, cálculo de comparação reutilizado | comparison.ts, shipping.ts, painel, testes | Comparar cenários → Exportar CSV; confira três linhas de cenários e parâmetros |
| Acessibilidade/celular | Diálogo com foco, barras semânticas, contraste, fontes e toque | HelpDialog.tsx, painel, shipping.css | Tab/Shift+Tab na ajuda; Esc devolve foco; em 390 px, só a tabela deve rolar horizontalmente |
| Desempenho 3D | Instâncias, recursos compartilhados, código separado, memoização e frames sob demanda | Scene.tsx, painel | Observe seleção de rua/doca e partida; pausado sem girar não deve renderizar continuamente; teste movimento reduzido |
| Alternativa 2D | Operação disponível mesmo sem cena | painel, CSS | Use painel 2D e confirme tabela, inspeção, intervenções e relógio funcionando |
| Site de teste | Link em outra aba para Shipping Laranja, sem troca de dados | TestSite.tsx, painel, CSS | Abra o cartão; confirme URL do Apps Script e autenticação própria |

## Mudanças deliberadas nos testes antigos

1. Relógio: início passou das 14h para as 08h; virada de dia agora ocorre no minuto 960.
2. Casos unitários de saída/corte: prazos de 40 e 80 minutos são definidos explicitamente para manter o mesmo comportamento exercitado, independentemente dos horários padrão preservados.
3. Comparação: desigualdades estritas de volume/pontualidade viraram não estritas, pois o turno maior pode empatar os cenários. Novos testes verificam diretamente que só o balcão muda e que velocidade de doca/configuração são independentes.
4. Os demais testes existentes continuam verificando conservação, transferência, prioridade, retenções, imutabilidade e partida única.

## Validação prática realizada

- Editor aplicado pelo navegador: Curitiba alterada para 08h40 e reinício confirmado.
- Retenção do balcão, avanço até 08h10 e recarregamento: horário, estoque, evento e retenção restaurados com operação pausada.
- Ajuda: foco inicial no botão Fechar, Esc fecha, foco retorna a Ajuda.
- Controle de tempo por teclado: End exibe resumo das 20h.
- Exportação: CSV baixado pelo botão e conteúdo conferido; três cenários, hipóteses e UTF-8.
- Responsividade em 390 × 844: corrigido transbordamento da tabela causado por texto acessível fora do contêiner; sem rolagem horizontal do documento após a correção.
- 3D observado no navegador; seleção/câmera disponíveis. Alternativa 2D exercitada. Falha de driver/WebGL não foi forçada neste equipamento.
- Site externo: tela de login Shipping Laranja observada; sem autenticação ou alterações no Apps Script.

## Limites conhecidos

Projeções são condicionais e ilustrativas; faixas não são estatísticas. O diagnóstico indica evidências do modelo, sem alegar causa exclusiva. Persistência é local ao navegador/origem. Não há benchmark de FPS nem certificação completa WCAG. O arquivo de build da cena continua sendo relativamente grande, mas é carregado separadamente do painel.

## Executar verificações

~~~powershell
npm test
npm run build
node --experimental-test-coverage --import tsx --test src/simulation.test.ts
~~~

O último comando mede cobertura dos módulos importados pelos testes do motor; ele não mede cobertura funcional das telas e do WebGL.

## Resultado final — 29/10/2026

- npm test: 30 testes, 30 aprovados, zero falhas.
- npm run build: TypeScript e Vite aprovados; 2.154 módulos processados.
- Build: painel 269,69 kB (85,22 kB gzip); cena 919,59 kB (249,77 kB gzip); CSS 38,99 kB.
- Cobertura dos módulos exercitados: 97,08% linhas, 91,11% ramificações e 89,74% funções. shipping.ts: 100% linhas, 95,38% ramificações e 100% funções. Não inclui cobertura de telas ou WebGL.
- git diff --check: sem erros de whitespace.
- Build executado fora do sandbox após EPERM de realpath na primeira tentativa; nenhuma proteção ou configuração do projeto foi removida.
