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

## Atualização de 30/10/2026 — Esteira, pontos de pesca e mesas

A tela principal agora foca somente em esteira e balcão. Seis pontos separados, com nove mesas informadas nos pontos 1, 2 e 3. Pontos 4–6 ficam sem quantidade de mesas ou destinos presumidos. P1: BETIM / CONTAGEM_INDUSTRIAL / BETIM; P2: três SP_GUARULHOS; P3: três BETIM (códigos SOC_ completos preservados no código e na interface).

Destinos repetidos são permitidos e cada mesa permanece um registro individual. O layout 3D mostra somente mobiliário configurado; números de mesas e nomes completos aparecem separadamente dos objetos para evitar sobreposição. Mapa 2D por padrão no celular, edição local por linha/mesa e recuperação segura do mapeamento. Nenhum volume, capacidade por mesa ou taxa operacional foi inventado. A animação de caixas é apenas visual.

Arquivos: App.tsx, FishingDashboard.tsx, FishingScene.tsx, fishingPoints.ts, fishing.css e simulation.test.ts. Testar seleção de pontos 1–6, repetição de SOC_BETIM, três mesas de Guarulhos, pontos sem configuração, salvar/recarregar e vista 2D em 390 px. Os 30 testes anteriores foram mantidos e quatro testes de configuração de mesas foram adicionados: total de 34 aprovados. TypeScript e Vite aprovados.

## Atualização visual — balcão de roletes preto

As mesas passaram a usar o modelo de flow rack mostrado na referência, em proporção compacta e acabamento preto. Cada mesa tem sete canais de pequenos rodízios, chassi aberto, travessas e pés reguláveis. A seleção mantém a mesa preta e destaca a área no piso. Os monitores fictícios foram removidos. A vista Detalhe da mesa isola a primeira mesa do ponto selecionado para inspeção; Voltar ao layout restaura a visão completa. Medidas e inclinação são ilustrativas, pois não foram informadas dimensões reais.

Arquivos: FlowRackTable.tsx, FishingScene.tsx, FishingDashboard.tsx e fishing.css. Componentes de rodízios e trilhos usam instâncias para reduzir chamadas de desenho. Nenhuma associação ponto/mesa/destino ou regra do motor foi alterada. Verificação: testes existentes, TypeScript/build, vista de perto, retorno ao layout e persistência visual do acabamento preto.

## Visão geral e quantidade de mesas

A tela abre na visão superior enquadrando todos os seis pontos e nove mesas informadas (3 + 3 + 3). O botão Ver tudo restaura o enquadramento completo. A aproximação de detalhe altera somente a câmera: nenhum ponto, mesa, rodízio ou trilho é filtrado da cena. Na visão geral, todas as nove mesas recebem identificação M1/M2/M3. A indicação de quantidade fica junto aos controles da cena.


## Shelves do leve — identificação separada do destino

A referência HTML passa a informar exclusivamente nomes e agrupamentos de shelves no plano do leve. Blocos 1–5 têm 3/3/3/2/3 identificações; MG5 tem 37, em seis fileiras (6/6/6/6/7/6). Não são 51 mesas. As nove mesas anteriores e seus destinos permanecem como referência independente. As associações individuais shelf → destino começam nulas, exibidas como A confirmar.

Mudanças: leveLayout.ts, fishingPoints.ts, FishingDashboard.tsx, FishingScene.tsx, fishing.css, simulation.test.ts e README.md. O editor agora atribui destino à shelf identificada e salva versão 3; versão 2 é migrada sem inferir associações. O 3D diferencia mesas com roletes de shelves esquemáticas, amplia a área MG5 e permite aproximar qualquer bloco sem remover o restante. Componentes repetidos das shelves usam instâncias. Volumoso não é incluído.

Como testar: conferir nomes e quantidades em cada bloco e as fileiras MG5; abrir Configurar destinos, preencher apenas MG4 e salvar; recarregar e conferir que só aquela shelf recebeu destino e a referência das mesas não mudou; limpar o campo e salvar para voltar a A confirmar. Alternar 2D/3D, aproximar MG5 e voltar à visão geral. No celular, conferir mapa 2D e editor sem rolagem lateral.

Testes existentes preservados. Três novos testes verificam a contagem/ordem das shelves, migração v2 sem associação implícita e persistência v3 independente do nome e das mesas: 37 aprovados. TypeScript e Vite aprovados. Medidas e modelos de shelves são esquemáticos, aguardando dimensões e referência física.


## Correção da referência física — tudo é mesa

O usuário esclareceu que shelf é a identificação da mesa, não uma estante adicional. As estantes foram removidas, e cada uma das 51 identificações do leve agora gera exatamente uma mesa preta de roletes. As nove entradas anteriores de destinos são apenas referência e não criam móveis extras. Nomes, agrupamentos, destinos já salvos e protocolo de armazenamento foram preservados.

Arquivos: leveLayout.ts, FishingScene.tsx, FlowRackTable.tsx, FishingDashboard.tsx, simulation.test.ts e README.md. O chassi, os pés, os parafusos, os trilhos e os rodízios são instanciados no layout completo. A distância entre mesas do MG5 foi ampliada para comportar o mesmo modelo, sem sobreposição. O painel e o mapa usam a palavra mesa.

Como testar: observar os blocos 1–3, cada um com somente três mesas e nenhuma estante atrás; conferir blocos 4/5 com duas/três mesas; aproximar MG5 e conferir 37 mesas em seis fileiras; voltar a Ver todo o leve. As etiquetas com MG4, MG2 e demais nomes pertencem diretamente às mesas. Destinos pendentes continuam A confirmar. O volumoso permanece fora desta tela.

Validação: 38 testes aprovados, incluindo novo teste de uma mesa por identificação, sem duplicação pela referência anterior e sem sobreposição. Testes existentes preservados. TypeScript e build Vite aprovados. Verificação visual de visão geral, aproximação e ausência das estantes.


## Ilha 6 — exclusivamente suportes de saca

A ilha 6 (MG5) usa suportes de saca em todas as suas 37 posições, conforme correção do usuário. As ilhas 1–5 mantêm suas 14 mesas de roletes. Contadores, mapa, cartões, editor e cena distinguem os dois tipos. A posição, os nomes, as seis fileiras e os destinos salvos não foram alterados. O suporte 3D é esquemático: estrutura aberta com saca ilustrativa, sem tampo, prateleiras ou roletes.

Arquivos: SackSupport.tsx (novo modelo instanciado), leveLayout.ts (separação dos tipos), FishingScene.tsx, FishingDashboard.tsx, simulation.test.ts e README.md. O teste que antes esperava 51 mesas foi atualizado porque a regra física mudou intencionalmente: agora espera 14 mesas e 37 suportes e garante que nenhuma mesa é gerada na ilha 6. Mantida a contagem de 51 posições, sem duplicação ou sobreposição.

Como testar: selecionar Ilha 6/MG5 e Aproximar ilha; conferir estrutura aberta com sacas em seis fileiras e ausência de mesas/roletes. Voltar à visão geral e conferir que ilhas 1–5 continuam com mesas pretas. Conferir painel: 14 mesas + 37 suportes. Nomes e destinos por posição permanecem independentes. Resultado: 38 testes aprovados; TypeScript e build Vite aprovados.
