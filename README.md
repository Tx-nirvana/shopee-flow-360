# Shopee Flow 360 · Layout do leve

Aplicação React, TypeScript, React Three Fiber e Vite. Layout ilustrativo e sem escala, baseado no HTML fornecido pelo usuário. Nesta etapa a tela mostra somente o leve: esteira, seis ilhas, mesas pretas com roletes nas ilhas 1–5 e suportes de saca na ilha 6 (MG5).

## Mesas e destinos

Nome da shelf é uma identificação; destino é um campo independente, inicialmente A confirmar. Não são importadas associações de destino do HTML.

| Bloco | Identificações |
| --- | --- |
| 1 | MG4, MG2, BETIM-1 |
| 2 | SP25-1, SP25-2, SC1-2 |
| 3 | ES, C3, PR1 |
| 4 | SP5 -2, RS-2 |
| 5 | BA-2, GO-2, PE-2 |
| 6 · MG5 | 37 posições em seis fileiras, na ordem do HTML |

São 51 posições identificadas: 14 mesas de roletes (3/3/3/2/3 nas ilhas 1–5) e 37 suportes de saca no MG5 (ilha 6), em seis fileiras. A ilha 6 não contém mesas nem roletes. O suporte é esquemático, aberto em cima, com saca ilustrativa. As nove entradas anteriores por mesa são uma referência de destinos nos pontos 1–3 e não geram móveis adicionais. Destinos continuam separados dos nomes.

## Uso

- Abertura na visão geral. Ver todo o leve restaura o enquadramento. Aproximar bloco muda somente a câmera e funciona também no MG5.
- As etiquetas azuis identificam as mesas nas ilhas 1–5 e os suportes de saca na ilha 6. No MG5, os números pertencem ao grupo MG5 e F1–F6 indicam fileiras.
- Configurar destinos permite preencher cada shelf individualmente. Campo vazio mantém A confirmar. A edição é salva neste navegador em localStorage, versão 3.
- Dados antigos da versão 2 são migrados preservando a referência das mesas. Nenhum destino antigo é transferido automaticamente para uma shelf.
- Mapa 2D por padrão no celular e como fallback do 3D. Cartões completos acessíveis fora da cena; destinos não dependem de cores.
- A animação é ilustrativa. Sem dimensões reais, volumes ou produtividade presumidos. O volumoso não está neste plano. O Apps Script permanece apenas um link de teste, sem sincronização.

## Executar

Requer Node.js 22.12+ ou 24. Dependências já instaladas nesta cópia.

~~~powershell
npm ci
npm run dev
npm test
npm run build
~~~

## Arquivos principais

- src/leveLayout.ts: nomes, fileiras e posições esquemáticas das mesas.
- src/fishingPoints.ts: mesas, mesas, validação e migração local.
- src/FishingDashboard.tsx: painel, referência anterior e editor por shelf.
- src/FishingScene.tsx: visão geral, aproximação, esteira e mesas instanciadas.
- src/FlowRackTable.tsx: mesas pretas compactas com roletes.
- src/fishing.css: estilos, contraste e responsividade.
- src/simulation.test.ts: motor original, configuração das mesas e identificação/persistência das mesas.

O motor de expedição anterior permanece no código e seus testes não foram alterados. Não faz parte da tela atual. Histórico e instruções de validação em ENTREGA.md.

- src/SackSupport.tsx: suportes de saca instanciados, exclusivos da ilha 6.
