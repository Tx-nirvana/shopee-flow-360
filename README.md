# Shopee Flow 360 · Layout do leve

Aplicação React, TypeScript, React Three Fiber e Vite. Layout ilustrativo e sem escala, baseado no HTML fornecido pelo usuário. Nesta etapa a tela mostra somente o leve: esteira, seis blocos, mesas pretas com roletes e shelves identificadas.

## Shelves e destinos

Nome da shelf é uma identificação; destino é um campo independente, inicialmente A confirmar. Não são importadas associações de destino do HTML.

| Bloco | Identificações |
| --- | --- |
| 1 | MG4, MG2, BETIM-1 |
| 2 | SP25-1, SP25-2, SC1-2 |
| 3 | ES, C3, PR1 |
| 4 | SP5 -2, RS-2 |
| 5 | BA-2, GO-2, PE-2 |
| 6 · MG5 | 37 posições em seis fileiras, na ordem do HTML |

São 51 identificações de shelves. Elas não representam 51 mesas. As nove mesas anteriormente informadas permanecem nos pontos 1 a 3. A divisão anterior por mesa é exibida como referência separada, sem associar destinos às shelves. Nos blocos 4 a 6 a quantidade de mesas aguarda confirmação.

## Uso

- Abertura na visão geral. Ver todo o leve restaura o enquadramento. Aproximar bloco muda somente a câmera e funciona também no MG5.
- As etiquetas azuis identificam shelves; M1/M2/M3 identificam mesas. No MG5, os números pertencem ao grupo MG5 e F1–F6 indicam fileiras.
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

- src/leveLayout.ts: nomes, fileiras e posições esquemáticas das shelves.
- src/fishingPoints.ts: mesas, shelves, validação e migração local.
- src/FishingDashboard.tsx: painel, referência anterior e editor por shelf.
- src/FishingScene.tsx: visão geral, aproximação, esteira e shelves instanciadas.
- src/FlowRackTable.tsx: mesas pretas compactas com roletes.
- src/fishing.css: estilos, contraste e responsividade.
- src/simulation.test.ts: motor original, configuração das mesas e identificação/persistência das shelves.

O motor de expedição anterior permanece no código e seus testes não foram alterados. Não faz parte da tela atual. Histórico e instruções de validação em ENTREGA.md.
