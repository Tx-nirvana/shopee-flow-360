# Shopee Flow 360 · Esteira & Balcão

Site público: https://shopee-flow-360-teste.peppycrow2.chatgpt.site

Visualização focada na esteira principal, em seis pontos de pesca e nas mesas de cada ponto. Caminhões, docas e indicadores de expedição saíram da tela principal nesta etapa.

## Divisão informada pelo usuário

| Ponto | Mesa 1 | Mesa 2 | Mesa 3 |
|---|---|---|---|
| 1 | SOC_BETIM | SOC_CONTAGEM_INDUSTRIAL | SOC_BETIM |
| 2 | SOC_SP_GUARULHOS | SOC_SP_GUARULHOS | SOC_SP_GUARULHOS |
| 3 | SOC_BETIM | SOC_BETIM | SOC_BETIM |
| 4 | A informar | A informar | A informar |
| 5 | A informar | A informar | A informar |
| 6 | A informar | A informar | A informar |

Há **nove mesas informadas**, em três dos seis pontos, e três destinos distintos. Os pontos 4, 5 e 6 não têm quantidade de mesas nem destinos presumidos: a tabela usa “A informar” como indicação de pendência, não como três mesas existentes nesses pontos. Destinos podem se repetir em mesas e pontos diferentes. A ordem das mesas é preservada.

## Visualização

- Cena 3D ampla, com mais separação entre pontos e mesas individuais. Somente os três primeiros pontos têm mobiliário de mesas configurado.
- Seletor de ponto, vista superior e em perspectiva, mapa 2D, animação visual da esteira e restauração da câmera.
- Os nomes completos dos destinos ficam em cartões fora da cena, evitando sobreposição de rótulos.
- No celular, o mapa 2D abre por padrão. O 3D pode ser ativado manualmente.
- Use Configurar destinos para editar. Cada linha corresponde a uma mesa, na ordem. Repetições são permitidas. Pontos vazios permanecem sem configuração.
- Mapeamento editado salvo no localStorage, chave versionada. Dados inválidos ou incompatíveis recuperam a divisão informada pelo usuário.

As posições, distâncias e caixas são ilustrativas; não há medida real do galpão, volumes operacionais ou taxas por mesa nesta etapa. Animar a esteira não calcula produtividade, filas ou roteamento de cargas. O site Apps Script permanece um acesso complementar de teste, sem integração de dados.

## Executar e validar

Requer Node.js 22.12+ ou 24.

~~~powershell
npm ci
npm run dev
npm test
npm run build
~~~

Nesta cópia as dependências já estão instaladas; INICIAR.cmd abre o servidor local. O build fica em dist/ e deve ser servido por HTTP.

## Arquivos

- src/FishingDashboard.tsx: tela focada em pesca, seleção, mesas, mapa 2D e editor.
- src/FishingScene.tsx: esteira, seis áreas, mesas individuais e animação ilustrativa.
- src/fishingPoints.ts: configuração informada, validação e persistência do mapeamento.
- src/fishing.css: espaçamento, contraste e responsividade.
- src/simulation.test.ts: testes do motor anterior e da divisão por mesas.

O motor de expedição e o painel anterior permanecem no código para continuidade futura, sem fazer parte da tela atual. Seus testes foram preservados. Consulte ENTREGA.md para histórico de alterações e validações.
