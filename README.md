# Clínica Rinosono: site estático

Site estático em português, com sete páginas HTML (mais `404.html`), estilos compartilhados em `site.css` e interações em `site.js`. Sem instalação, framework, build ou dependências externas. Os arquivos de mídia ficam em `assets/`.

## Abrir no Windows
1. Extraia a pasta completa do ZIP.
2. Abra `index.html` no Chrome ou Edge. Mantenha `assets` ao lado dele.
3. Para servir localmente, se tiver Python instalado: `python -m http.server 8000`. Abra http://localhost:8000.
4. O mapa, WhatsApp e Instagram precisam de internet. Os vídeos estão incluídos e podem ser abertos diretamente em `assets/`.

## Conteúdo e recursos
- Verde da marca, tipografia própria hospedada no site (Hanken Grotesk nos títulos, Source Sans 3 no texto, licença OFL em `assets/fonts`).
- Páginas: index.html, clinica.html, atendimento.html, equipe.html, convenios.html, contato.html, privacidade.html e 404.html.
- Menu lateral modal com teclado/Escape, filtros da equipe, seleção de convênio e WhatsApp contextual.
- Instagram no topo, no menu, no hero, em seção própria na home e no rodapé.
- Fotografia completa da recepção com ampliação.
- Retrato, fachada e equipe reais, sem geração de médicos ou instalações.
- Áreas de atendimento, história desde 2002 e equipe com registros transcritos.
- Nove convênios apresentados especificamente para o Dr. Fernando.
- Quatro vídeos da apresentação na ordem 1 a 4, mais a visita à Uniplac.
- Vídeos carregados ao clicar, reprodução com controles, fechamento por Escape e botão de próxima parte.
- Perguntas frequentes por assunto (atendimento, convênios e contato, sem repetir perguntas), conteúdos educativos concisos, WhatsApp e Instagram.
- Google Maps carregado após interação e links para rotas.
- Menu mobile, foco visível, HTML semântico, respeito a movimento reduzido e CTA mobile após o hero.
- Fotografias WebP, MP4 H.264/AAC com fast start, dimensões reservadas e lazy loading abaixo do hero.

## O que foi validado
Validação estática dos arquivos locais, âncoras, IDs, sintaxe JavaScript, metadados das mídias e decodificação dos cinco vídeos. Conferência manual do código responsivo nas faixas que contemplam 390, 768, 1280 e 1920 px.

Na revisão SEO/GEO o site foi testado em Chromium (Playwright): console sem erros nas 8 páginas, sem rolagem horizontal em 320, 390, 640, 768, 1024 e 1440 px, teclado (menu, vídeos, galeria, filtros e convênios), sem JavaScript, movimento reduzido e contraste AA. Leitor de tela real e celulares físicos não foram testados.

## Antes da publicação
- Confirmar a atualidade de todos os profissionais, números de registro e convênios, em particular a grafia CRFa 7/3-8780 tal como fornecida.
- Confirmar os dados de responsável técnico e de registro da pessoa jurídica que devam constar no site.
- Confirmar disponibilidade atual do exame de polissonografia e dos atendimentos.
- Revisar os textos com a clínica. Alegações de pioneirismo não foram publicadas por dependerem de comprovação específica.
- A política de privacidade (`privacidade.html`) descreve esta implementação e precisa ser alinhada à operação real da clínica.
- Substituir, se disponíveis, os prints por fotos originais e o logo 150 × 150 por uma versão vetorial ou maior.
- Testar 390, 768, 1280 e 1920 px, teclado, leitor de tela, conexão lenta, H.264 em celular, links e mapa.
- Definir o domínio definitivo e rodar `scripts/definir-dominio.mjs` (abaixo). Hoje a origem é https://rinosono.vercel.app.

## Mapa 3D
Implementada uma tentativa de mapa vetorial 3D com MapLibre 4.7.1 e OpenFreeMap, inspirada no ZIP enviado. O mapa carrega somente ao clicar. A geocodificação deve retornar o número 880 na Rua Lauro Muller em Lages; se não houver correspondência exata, a página abre o mapa convencional do Google, sem inventar posição. Alturas só aparecem onde a base fornecer dados. Não usa o desenho fictício de prédios presente na referência. A disponibilidade real do 3D não foi validada neste ambiente.

Fontes técnicas:
- https://openfreemap.org/quick_start/
- https://maplibre.org/maplibre-gl-js/docs/
- https://developers.google.com/maps/documentation/javascript/3d/get-started
- https://developers.google.com/maps/documentation/javascript/get-api-key

## SEO, dados estruturados e verificação

Cada página tem title, description, canonical, Open Graph e Twitter próprios, além de JSON-LD (`WebSite`, `WebPage`, `BreadcrumbList`, `MedicalClinic`, profissionais, `VideoObject` e `FAQPage` só em `atendimento.html`). Só entram dados que estão no site: não há CNPJ, coordenadas, avaliações nem preços.

O cabeçalho, o menu lateral e o rodapé ficam entre os comentários `<!-- cabecalho:inicio -->`/`<!-- rodape:inicio -->` e precisam ser **idênticos** nas oito páginas (só muda o `aria-current`). Ao editar um deles, replique a mudança em todas.

Scripts opcionais em `scripts/` (o site não depende deles):

| Comando | O que faz |
|---|---|
| `node scripts/check-site.mjs` | Confere head, títulos, links, âncoras, ids, JSON-LD, FAQ, sitemap, robots, origem única, blocos compartilhados e contraste (este último com Playwright, se instalado). Sai com erro se algo falhar. |
| `node scripts/definir-dominio.mjs https://novodominio.com.br` | Troca a origem absoluta em todos os HTML, `sitemap.xml`, `robots.txt` e `site.webmanifest` e informa quantas ocorrências trocou. |
| `python3 scripts/gerar-og.py` | Gera `assets/og-image.jpg` (1200x630) e os ícones a partir do logo e da fachada (requer Pillow). |

## Publicar na Vercel
1. Importe o repositório na Vercel com o preset **Other**, sem comando de build, saída na raiz.
2. A indexação é liberada pelo commit `go-live: liberar indexacao` (meta robots, `robots.txt` e `vercel.json`). Antes dele, o site fica como versão de revisão, com `noindex`.
3. Ao trocar de domínio: aponte o domínio na Vercel, rode `node scripts/definir-dominio.mjs https://dominio`, depois `node scripts/check-site.mjs`, e faça commit.
4. Depois de publicar: envie o `sitemap.xml` no Google Search Console e teste uma página em https://search.google.com/test/rich-results.
