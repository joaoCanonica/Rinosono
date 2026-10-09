# Clínica Rinosono — versão 2, multipágina

Site estático em português, com seis páginas HTML, estilos compartilhados em `site.css` e interações em `site.js`. Sem instalação, framework, build ou dependências externas. Os arquivos de mídia ficam em `assets/`.

## Abrir no Windows
1. Extraia a pasta completa do ZIP.
2. Abra `index.html` no Chrome ou Edge. Mantenha `assets` ao lado dele.
3. Para servir localmente, se tiver Python instalado: `python -m http.server 8000`. Abra http://localhost:8000.
4. O mapa, WhatsApp e Instagram precisam de internet. Os vídeos estão incluídos e podem ser abertos diretamente em `assets/`.

## Conteúdo e recursos
- Verde mais vivo, tipografia sem serifa, hero com entrada suave e cabeçalho redesenhado.
- Páginas: index.html, clinica.html, atendimento.html, equipe.html, convenios.html e contato.html.
- Menu lateral modal com teclado/Escape, filtros da equipe, seleção de convênio e WhatsApp contextual.
- Instagram destacado no cabeçalho, menu, hero, seção própria e rodapé.
- Fotografia completa da recepção com ampliação.
- Retrato, fachada e equipe reais, sem geração de médicos ou instalações.
- Áreas de atendimento, história desde 2002 e equipe com registros transcritos.
- Nove convênios apresentados especificamente para o Dr. Fernando.
- Quatro vídeos da apresentação na ordem 1–4, mais a visita à Uniplac.
- Vídeos carregados ao clicar, reprodução com controles, fechamento por Escape e botão de próxima parte.
- Perguntas frequentes, conteúdos educativos concisos, WhatsApp e Instagram.
- Google Maps carregado após interação e links para rotas.
- Menu mobile, foco visível, HTML semântico, respeito a movimento reduzido e CTA mobile após o hero.
- Fotografias WebP, MP4 H.264/AAC com fast start, dimensões reservadas e lazy loading abaixo do hero.

## O que foi validado
Validação estática dos arquivos locais, âncoras, IDs, sintaxe JavaScript, metadados das mídias e decodificação dos cinco vídeos. Conferência manual do código responsivo nas faixas que contemplam 390, 768, 1280 e 1920 px.

Não foi possível executar a validação visual em navegador nesta sessão. Portanto, **não são testes reais de viewport**, teclado, leitor de tela, reprodução no navegador, console, mapa externo ou Core Web Vitals. É uma versão para revisão, não uma declaração de aprovação final.

## Antes da publicação
- Confirmar a atualidade de todos os profissionais, números de registro e convênios, em particular a grafia CRFa 7/3-8780 tal como fornecida.
- Confirmar os dados de responsável técnico e de registro da pessoa jurídica que devam constar no site.
- Confirmar disponibilidade atual do exame de polissonografia e dos atendimentos.
- Revisar os textos com a clínica. Alegações de pioneirismo não foram publicadas por dependerem de comprovação específica.
- O texto de privacidade descreve esta implementação, mas precisa ser alinhado à operação real da clínica e à hospedagem escolhida.
- Substituir, se disponíveis, os prints por fotos originais e o logo 150 × 150 por uma versão vetorial ou maior.
- Testar 390, 768, 1280 e 1920 px, teclado, leitor de tela, conexão lenta, H.264 em celular, links e mapa.
- Definir o domínio para acrescentar canonical, og:url, imagem de compartilhamento com URL absoluta e sitemap. Nenhum domínio foi inventado.

## Mapa 3D
Implementada uma tentativa de mapa vetorial 3D com MapLibre 4.7.1 e OpenFreeMap, inspirada no ZIP enviado. O mapa carrega somente ao clicar. A geocodificação deve retornar o número 880 na Rua Lauro Muller em Lages; se não houver correspondência exata, a página abre o mapa convencional do Google, sem inventar posição. Alturas só aparecem onde a base fornecer dados. Não usa o desenho fictício de prédios presente na referência. A disponibilidade real do 3D não foi validada neste ambiente.

Fontes técnicas:
- https://openfreemap.org/quick_start/
- https://maplibre.org/maplibre-gl-js/docs/
- https://developers.google.com/maps/documentation/javascript/3d/get-started
- https://developers.google.com/maps/documentation/javascript/get-api-key

## Publicar na Vercel quando aprovado
1. Coloque as seis páginas HTML, `site.css`, `site.js`, `assets/`, `robots.txt` e `vercel.json` na raiz de um repositório.
2. Importe o repositório na Vercel e escolha o preset **Other**.
3. Não defina comando de build. Use a raiz como diretório de saída, conforme a configuração do projeto.
4. Antes de publicar, troque `Disallow: /` por `Allow: /` no robots.txt e retire o cabeçalho X-Robots-Tag do vercel.json. A versão de revisão está marcada para não indexação.
5. Após definir o domínio, complete os metadados e o sitemap e teste o site publicado.

Não foram feitos commit, push ou publicação, conforme o guia fornecido.
