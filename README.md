# Shopee Flow 360 · Shipping Diário

Simulador ilustrativo de expedição em React, TypeScript, React Three Fiber e Vite. Todos os dados são fictícios; nenhum sistema interno da Shopee está conectado.

## Executar

Requer Node.js 22.12+ ou 24 e npm. Na pasta do projeto:

~~~powershell
npm ci
npm run dev
~~~

Abra a URL local exibida no terminal. Nesta cópia as dependências já estão instaladas: também é possível abrir INICIAR.cmd. O servidor atende somente o próprio computador. Para encerrar, use Ctrl+C.

~~~powershell
npm test
npm run build
npm run preview
~~~

O build está em dist/; abra por um servidor HTTP. Não abra dist/index.html diretamente pelo explorador.

## Operação e parâmetros

- Turno das **08h às 20h**, com limite de 720 minutos simulados. O plano também pode terminar antes quando os oito caminhões saem. O controle de tempo permite consultar o fim do turno.
- Oito caminhões de 800 volumes por padrão: 6.400 volumes, distribuídos inicialmente entre esteira, balcão, ruas e caminhões. Não há reposição de caminhões neste turno.
- Fluxo: esteira → balcão → transferência → rua → caminhão → expedidos. A transferência padrão leva 4 min; a esteira fornece até 8 volumes por destino por minuto.
- Horários absolutos fictícios preservados: São Paulo 15h40; Campinas 16h00; Curitiba 14h40; Rio 15h20; Belo Horizonte 16h30; Sorocaba 16h05; Ribeirão Preto 15h30; Santos 17h00.
- Cenários alteram **somente o balcão**: Operação atual 36 vol/min; Fluxo otimizado 56; Balcão sobrecarregado 18. As velocidades das docas são iguais entre cenários, com valores padrão de 4, 4, 5, 5, 5, 5, 5 e 5 vol/min.
- Na aba **Parâmetros**, edite balcão, tempo de transferência, capacidade e velocidade de cada doca e horário de cada saída. Aplicar reinicia o turno e limpa intervenções anteriores.
- A opção de capacidade personalizada substitui a capacidade dos três cenários. Desmarque-a para voltar a comparar 36/56/18. Com os horários atuais e início às 08h, os três cenários podem entregar resultados idênticos: isso não comprova equivalência operacional em outros planos.
- Volumes são inteiros. Balcão: 1–10.000 vol/min; doca: 1–2.000 vol/min; capacidade por caminhão: 1–100.000; transferência: 1–60 min; horários: 08h–20h. Capacidades menores/maiores redistribuem o estoque inicial proporcionalmente, com resto alocado antes da conferência.
- A conservação passa a usar o total configurado; 6.400 continua sendo a referência da configuração padrão.

## Previsão e diagnóstico

A projeção provável continua o estado atual usando o mesmo motor e as mesmas etapas em paralelo. Ela considera prioridades e retenções já ativas, sem novas intervenções futuras. A faixa otimista usa +20% de capacidade de conferência e carregamento; a pessimista usa −20%, com arredondamento inteiro e mínimo de 1 vol/min. Não é intervalo estatístico, previsão validada ou promessa de prazo.

Projeções podem ultrapassar as 20h; a operação principal para no limite do turno. O horizonte de projeção é de até sete dias após o maior horário previsto ou o instante atual. “Fora do horizonte” informa que não se encontrou conclusão nesse limite, sem afirmar que a carga nunca terminará. Os horários são de relógio e podem virar o dia em configurações extremas.

O gargalo ao vivo indica pressão estimada pelo estoque dividido pela capacidade, com prioridade para retenções ativas. Não usa somente a maior quantidade de caixas. As ruas incluem volumes em transferência no indicador geral, mas o detalhe da carga separa transferência e estoque no piso.

O resumo lista cargas atrasadas e pendentes, etapa dominante nos minutos de atraso e evidências por carga: espera pela esteira, fila/retenção do balcão, transferência, carregamento e retenção da doca. Cada minuto após o corte é associado a uma etapa limitante observada. É uma explicação do modelo, sem inferência de causalidade exclusiva.

## Tempo, intervenções e persistência

- Iniciar/pausar; velocidades 1×, 2×, 5× e 10×. Em 1×, um segundo real equivale a um minuto simulado.
- Voltar/avançar 10 min ou usar o controle deslizante. Home/End levam ao início/fim do turno pelo teclado.
- Priorizar no balcão muda a ordem sem aumentar capacidade. Reter balcão pausa conferência por 20 min; a esteira continua chegando e docas consomem estoque disponível. Reter doca 04 suspende carregamento e saída por 60 min.
- Ao voltar e aplicar uma intervenção, as intervenções futuras são substituídas. Sem novas intervenções, avançar reproduz o histórico existente.
- O localStorage guarda configuração, relógio, cenário, velocidade e diário completo de intervenções em formato versionado. O estado é reconstruído por replay determinístico, sem depender do histórico visual limitado a 40 eventos.
- Recarregar restaura a sessão **pausada**. Armazenamento bloqueado ou inválido gera aviso e recuperação segura. O progresso é local à origem/navegador, sem backup remoto ou sincronização entre dispositivos.
- Reiniciar mantém parâmetros e cenário. Restaurar parâmetros padrão recupera a configuração original.

## Comparação e exportação

Na aba Comparar cenários, os três resultados usam a mesma configuração, janela de 720 min e estado inicial, sem intervenções manuais da sessão. O CSV inclui hipóteses, parâmetros, volumes expedidos/pendentes, caminhões, pontualidade e minutos de atraso. Use **Exportar comparação CSV**. O arquivo usa UTF-8 com BOM, separador ponto e vírgula, aspas e finais de linha compatíveis com planilhas.

## Site complementar de teste

O cartão **Shipping Laranja · Plano Diário** abre em outra aba o Google Apps Script indicado pelo usuário. Foi verificada a tela de login. A autenticação pertence ao próprio site; este projeto não armazena credenciais nem importa, envia ou sincroniza dados com ele. A fonte e o deploy do Apps Script não foram modificados. Não há incorporação por iframe nem integração operacional nesta entrega.

## Acessibilidade e 3D

Há acesso por teclado, rótulos, estados selecionados, progresso semântico, cabeçalho de tabela, link para pular conteúdo e diálogo nativo com foco contido e devolvido ao botão de origem. O celular mantém a tabela com rolagem própria. O botão **Usar painel 2D** permite operar sem cena; erros de carregamento/WebGL também têm fallback.

O 3D respeita movimento reduzido, renderiza sob demanda quando pausado e compartilha geometria/materiais. Roletes, lâminas das portas e detalhes dos caminhões usam instâncias: 235 elementos repetidos ficam em 10 malhas instanciadas. O JavaScript do 3D é carregado separadamente. Não foi realizado benchmark comparativo de FPS no equipamento de apresentação.

## Verificação e guia de alterações

Consulte **ENTREGA.md** para o que mudou, motivo, arquivos e roteiro de teste por melhoria. Os testes originais foram preservados; expectativas de horário e comparação foram atualizadas intencionalmente porque o turno e os cenários mudaram. Casos de prazo curto continuam explícitos para exercitar atrasos.

Os testes adicionais cobrem configuração, projeção paralela, faixa, diagnóstico, replay/ramificação, persistência, CSV, intervenções combinadas durante 720 min e conservação com capacidades alternativas.

Arquivos centrais: shipping.ts (motor); parameters.ts (validação); timeline.ts (replay); persistence.ts; diagnostics.ts; comparison.ts; ShippingDashboard.tsx; SettingsPanel.tsx; TurnSummary.tsx; HelpDialog.tsx; TestSite.tsx; Scene.tsx; shipping.css; simulation.test.ts, dentro de src/.

## Versão publicada

Site de teste (acesso privado à conta proprietária): https://shopee-flow-360-teste.peppycrow2.chatgpt.site

Código e histórico publicados no GitHub: https://github.com/Tx-nirvana/shopee-flow-360

O site do Google Apps Script permanece apenas como acesso complementar de teste, sem troca de dados.
