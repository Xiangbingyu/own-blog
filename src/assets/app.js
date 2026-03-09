function formatDate(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return dateInput;
  }
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="underline decoration-2" href="$2">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks = [];
  let i = 0;
  let inCode = false;
  let codeLines = [];
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      if (inCode) {
        blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
        codeLines = [];
      } else {
        inCode = true;
      }
      i += 1;
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      i += 1;
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(`<h3>${renderInline(line.slice(4))}</h3>`);
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(`<h2>${renderInline(line.slice(3))}</h2>`);
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(`<h1>${renderInline(line.slice(2))}</h1>`);
      i += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(`<blockquote>${renderInline(line.slice(2))}</blockquote>`);
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(`<li>${renderInline(lines[i].slice(2))}</li>`);
        i += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    blocks.push(`<p>${renderInline(line)}</p>`);
    i += 1;
  }
  return blocks.join("");
}

function sectionHeader(title, href) {
  return `
    <div class="flex items-center justify-between mb-10 border-b-4 border-charcoal pb-4">
      <h2 class="text-3xl font-black uppercase tracking-tighter">${title}</h2>
      <a class="text-sm font-bold uppercase underline decoration-2" href="${href}">View All Articles</a>
    </div>
  `;
}

function articleCard(article) {
  return `
    <a href="./article.html?id=${encodeURIComponent(article.id)}" class="group border-4 border-charcoal bg-white p-6 hover:bg-primary transition-colors cursor-pointer relative block">
      <div class="text-[10px] font-bold uppercase tracking-wide mb-3 text-charcoal/70">${formatDate(article.date)}</div>
      <h3 class="text-xl font-black uppercase mb-2">${article.title}</h3>
      <p class="text-sm font-medium mb-5 leading-snug">${article.summary}</p>
      <div class="flex flex-wrap gap-2">
        ${(article.tags || []).map((tag) => `<span class="text-[10px] font-bold border border-charcoal px-2 py-0.5 uppercase">${tag}</span>`).join("")}
      </div>
    </a>
  `;
}

function mediaRankItem(article) {
  return `
    <a href="./article.html?id=${encodeURIComponent(article.id)}" class="flex flex-col md:flex-row gap-4 p-6 bg-cream border-2 border-charcoal hover:translate-x-2 transition-transform cursor-pointer">
      <div class="md:w-36 flex-shrink-0">
        <div class="text-xs font-black uppercase text-charcoal/50">Rank #${article.rank || "-"}</div>
        <div class="mt-1 inline-block bg-primary text-[10px] px-1 font-bold uppercase">${article.mediaType || "MEDIA"}</div>
      </div>
      <div class="flex-grow">
        <h4 class="text-lg font-black uppercase leading-tight mb-1">${article.title}</h4>
        <p class="text-sm font-medium text-charcoal/70">${article.summary}</p>
      </div>
      <div class="flex items-center text-2xl font-black">→</div>
    </a>
  `;
}

function buildSubpageHref(viewKey) {
  return `./subpage.html?view=${encodeURIComponent(viewKey)}`;
}

function getArticlesByCategory(articles, category) {
  return articles.filter((item) => Array.isArray(item.category) && item.category.includes(category));
}

function sortByRule(list, sortRule) {
  if (sortRule === "rankAsc") {
    return [...list].sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
  }
  if (sortRule === "featuredOrderAsc") {
    return [...list].sort((a, b) => (a.featuredOrder || 9999) - (b.featuredOrder || 9999));
  }
  if (sortRule === "dateDesc") {
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return [...list];
}

function renderListByDisplay(list, display) {
  if (display === "rank") {
    return `<div class="flex flex-col gap-4">${list.map(mediaRankItem).join("")}</div>`;
  }
  if (display === "grid-2") {
    return `<div class="grid grid-cols-1 md:grid-cols-2 gap-8">${list.map(articleCard).join("")}</div>`;
  }
  return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">${list.map(articleCard).join("")}</div>`;
}

function resolveViewConfig(subpageConfig, viewKey) {
  const viewConfig = subpageConfig.views[viewKey];
  if (!viewConfig) {
    throw new Error(`View config not found: ${viewKey}`);
  }
  return viewConfig;
}

function resolveTitle(siteConfig, subpageConfig, pageType, viewKey) {
  if (pageType === "home") {
    return siteConfig.home.pageTitle;
  }
  if (pageType === "subpage" && viewKey) {
    const viewConfig = subpageConfig.views[viewKey];
    if (viewConfig) {
      return viewConfig.pageTitle;
    }
    return siteConfig.home.pageTitle;
  }
  if (pageType === "article") {
    return siteConfig.articlePageTitle;
  }
  return siteConfig.home.pageTitle;
}

const PAGE_TRANSITION_MS = 220;
let leavingInProgress = false;

function navigateWithTransition(targetHref) {
  if (leavingInProgress) {
    return;
  }
  leavingInProgress = true;
  document.body.classList.remove("page-ready");
  document.body.classList.add("page-leaving");
  window.setTimeout(() => {
    window.location.href = targetHref;
  }, PAGE_TRANSITION_MS);
}

function shouldUseTransitionForLink(anchor, event) {
  if (!anchor) {
    return false;
  }
  if (event.defaultPrevented || event.button !== 0) {
    return false;
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.hasAttribute("download")) {
    return false;
  }
  if (anchor.target && anchor.target.toLowerCase() !== "_self") {
    return false;
  }
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) {
    return false;
  }
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) {
    return false;
  }
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }
  return true;
}

function setupPageTransition() {
  window.requestAnimationFrame(() => {
    document.body.classList.add("page-ready");
  });
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href]");
    if (!shouldUseTransitionForLink(anchor, event)) {
      return;
    }
    event.preventDefault();
    navigateWithTransition(anchor.href);
  });
  window.addEventListener("pageshow", () => {
    leavingInProgress = false;
    document.body.classList.remove("page-leaving");
    window.requestAnimationFrame(() => {
      document.body.classList.add("page-ready");
    });
  });
}

function renderShell(siteConfig, activeViewKey) {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  const navItems = siteConfig.navigation.filter((item) => item.showInNav);
  const connectItem = siteConfig.navigation.find((item) => item.key === "connect");
  const connectLabel = connectItem ? connectItem.label : "Connect";
  const navHtml = navItems
    .map((item) => {
      const activeClass = item.viewKey === activeViewKey ? "underline decoration-4" : "";
      return `<a class="text-charcoal text-sm font-bold uppercase tracking-wider hover:underline decoration-4 ${activeClass}" href="${buildSubpageHref(item.viewKey)}">${item.label}</a>`;
    })
    .join("");
  const homeActiveClass = activeViewKey ? "" : "underline decoration-4";
  header.innerHTML = `
    <header class="flex items-center justify-between border-b-4 border-charcoal bg-primary px-6 md:px-20 py-4 sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <div class="bg-charcoal p-1 rounded-sm">
          <span class="material-symbols-outlined text-primary text-2xl">terminal</span>
        </div>
        <a class="text-charcoal text-2xl font-black tracking-tight uppercase hover:underline decoration-4 ${homeActiveClass}" href="./index.html">${siteConfig.brand}</a>
      </div>
      <div class="flex items-center gap-6">
        <nav class="hidden lg:flex items-center gap-6">${navHtml}</nav>
        <a class="bg-charcoal text-primary px-4 py-2 font-bold text-xs uppercase rounded-sm hover:bg-opacity-90 flex items-center gap-2" href="./connect.html">
          <span class="material-symbols-outlined text-sm">sensors</span>
          ${connectLabel}
        </a>
      </div>
    </header>
  `;
  footer.innerHTML = `
    <footer class="mt-20 bg-charcoal text-background-light py-12 px-6">
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="bg-primary p-1 rounded-sm">
              <span class="material-symbols-outlined text-charcoal text-xl font-black">terminal</span>
            </div>
            <h3 class="text-xl font-black uppercase tracking-tight">${siteConfig.brand}</h3>
          </div>
          <p class="text-sm text-background-light/60 max-w-xs">${siteConfig.footer.description}</p>
        </div>
        <div class="flex flex-col gap-4">
          <h4 class="font-black uppercase tracking-widest text-primary text-xs">${siteConfig.footer.navigationTitle}</h4>
          <ul class="flex flex-col gap-2 text-sm font-bold uppercase">
            ${navItems.map((item) => `<li><a class="hover:text-primary" href="${buildSubpageHref(item.viewKey)}">${item.label}</a></li>`).join("")}
          </ul>
        </div>
        <div class="flex flex-col gap-4">
          <h4 class="font-black uppercase tracking-widest text-primary text-xs">${siteConfig.footer.connectTitle}</h4>
          <p class="text-sm text-background-light/70">${siteConfig.footer.connectDescription}</p>
        </div>
      </div>
    </footer>
  `;
}

function buildContactCard(item, titleTag, bodyClass) {
  const isClickable = item && item.clickable !== false && item.href;
  const cardClass = `border-4 border-charcoal bg-white p-6 ${isClickable ? "hover:bg-primary transition-colors cursor-pointer" : ""} block`;
  const titleHtml = `<${titleTag} class="text-xl font-black uppercase mb-2">${item.label}</${titleTag}>`;
  const bodyHtml = `<p class="${bodyClass}">${item.value}</p>`;
  if (isClickable) {
    return `
      <a class="${cardClass}" href="${item.href}" target="_blank" rel="noopener noreferrer">
        ${titleHtml}
        ${bodyHtml}
      </a>
    `;
  }
  return `
    <div class="${cardClass}">
      ${titleHtml}
      ${bodyHtml}
    </div>
  `;
}

function renderHome(siteConfig, articles, connectProfile) {
  const root = document.getElementById("page-root");
  const hero = siteConfig.home.hero;
  const heroActionsHtml = hero.actions
    .map((action) => {
      const actionClass = action.variant === "primary"
        ? "bg-charcoal text-white hover:translate-x-1 hover:-translate-y-1 transition-transform pixel-shadow"
        : "border-4 border-charcoal bg-white text-charcoal hover:bg-cream transition-colors";
      return `<a href="${buildSubpageHref(action.viewKey)}" class="${actionClass} px-8 py-4 font-black uppercase tracking-wider rounded-sm">${action.label}</a>`;
    })
    .join("");
  const featuredHtml = siteConfig.featuredSections
    .map((section) => {
      const sorted = sortByRule(getArticlesByCategory(articles, section.sourceCategory), section.sort);
      const list = Number.isInteger(section.limit) ? sorted.slice(0, section.limit) : sorted;
      return `
        <section class="mb-20">
          ${sectionHeader(section.title, buildSubpageHref(section.viewKey))}
          ${renderListByDisplay(list, section.display)}
        </section>
      `;
    })
    .join("");
  const connectCardsHtml = (connectProfile?.contacts || [])
    .map((item) => buildContactCard(item, "h3", "text-sm font-medium"))
    .join("");
  const connectSectionHtml = connectCardsHtml
    ? `
        <section class="mb-20">
          <div class="flex items-center justify-between mb-10 border-b-4 border-charcoal pb-4">
            <h2 class="text-3xl font-black uppercase tracking-tighter">Connect</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            ${connectCardsHtml}
          </div>
        </section>
      `
    : "";
  root.innerHTML = `
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
      <div class="flex flex-col gap-6 order-2 lg:order-1">
        <div class="inline-block bg-primary/20 text-charcoal px-3 py-1 text-xs font-bold uppercase tracking-widest w-fit rounded-sm border border-primary">
          ${hero.status}
        </div>
        <h1 class="text-5xl md:text-7xl font-black leading-none text-charcoal tracking-tighter uppercase">
          ${hero.title}
        </h1>
        <p class="text-lg md:text-xl text-charcoal/80 max-w-lg leading-relaxed font-medium">
          ${hero.subtitle}
        </p>
        <div class="flex flex-wrap gap-4 pt-4">
          ${heroActionsHtml}
        </div>
      </div>
      <div class="order-1 lg:order-2 flex justify-center">
        <div class="relative w-full aspect-square max-w-md bg-cream border-4 border-charcoal p-4 pixel-shadow">
          <div class="w-full h-full bg-charcoal flex items-center justify-center text-primary text-center text-4xl font-black px-6">${hero.panelText}</div>
          <div class="absolute top-4 left-4 bg-primary text-charcoal px-2 py-1 text-[10px] font-bold uppercase tracking-tighter">${hero.badge}</div>
        </div>
      </div>
    </section>
    ${featuredHtml}
    ${connectSectionHtml}
  `;
}

function renderSubpage(subpageConfig, articles, viewKey) {
  const root = document.getElementById("page-root");
  const viewConfig = resolveViewConfig(subpageConfig, viewKey);
  document.title = viewConfig.pageTitle;
  const list = getArticlesByCategory(articles, viewConfig.category);
  const sorted = sortByRule(list, viewConfig.sort);
  root.innerHTML = `
    <section class="mb-12">
      <div class="border-b-4 border-charcoal pb-4 mb-8">
        <h1 class="text-4xl font-black uppercase tracking-tighter">${viewConfig.heading}</h1>
        <p class="text-sm font-medium text-charcoal/80 mt-3">${viewConfig.description}</p>
      </div>
      <a class="inline-flex items-center gap-2 border-4 border-charcoal bg-white text-charcoal px-4 py-2 font-black uppercase tracking-wider rounded-sm hover:bg-cream transition-colors mb-8" href="./index.html">
        <span class="material-symbols-outlined text-base">arrow_back</span>
        Back to Home
      </a>
      ${renderListByDisplay(sorted, viewConfig.display)}
    </section>
  `;
}

function renderConnect(profile) {
  const root = document.getElementById("page-root");
  const cardsHtml = (profile.contacts || [])
    .map((item) => buildContactCard(item, "h2", "font-medium"))
    .join("");
  const interestsHtml = (profile.interests || [])
    .map((item) => `<span class="text-[10px] font-bold border border-charcoal px-2 py-0.5 uppercase">${item}</span>`)
    .join("");
  const buildGalleryTrack = (items) => {
    const safeItems = Array.isArray(items) ? items : [];
    const duplicated = [...safeItems, ...safeItems];
    return duplicated
      .map((item) => `
        <div class="marquee-item border-2 border-charcoal bg-cream overflow-hidden pixel-shadow">
          <img src="${item.src}" alt="${item.alt || ""}">
        </div>
      `)
      .join("");
  };
  const lifeGalleryHtml = buildGalleryTrack(profile.lifeGallery);
  const portfolioGalleryHtml = buildGalleryTrack(profile.portfolioGallery);
  root.innerHTML = `
    <section class="max-w-4xl">
      <div class="border-b-4 border-charcoal pb-4 mb-8">
        <h1 class="text-4xl font-black uppercase tracking-tighter">${profile.heading || "Connect"}</h1>
        <p class="text-sm font-medium text-charcoal/80 mt-3">${profile.motto || ""}</p>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 mb-12">
        <div class="border-4 border-charcoal bg-cream p-3 pixel-shadow">
          <img class="w-full aspect-square object-cover" src="${profile.avatarUrl}" alt="${profile.name || ""}">
        </div>
        <div class="flex flex-col gap-4">
          <div>
            <div class="text-xl font-black uppercase">${profile.name || ""}</div>
            <div class="text-sm font-bold uppercase tracking-widest text-charcoal/70 mt-1">${profile.role || ""}</div>
          </div>
          <p class="text-sm font-medium leading-relaxed text-charcoal/80">${profile.bio || ""}</p>
          <div class="flex flex-wrap gap-2">${interestsHtml}</div>
        </div>
      </div>
      <div class="flex flex-col gap-10 mb-12">
        <div>
          <div class="text-sm font-black uppercase tracking-widest mb-3">Life Photos</div>
          <div class="marquee">
            <div class="marquee-track">
              ${lifeGalleryHtml}
            </div>
          </div>
        </div>
        <div>
          <div class="text-sm font-black uppercase tracking-widest mb-3">Portfolio</div>
          <div class="marquee">
            <div class="marquee-track slow">
              ${portfolioGalleryHtml}
            </div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${cardsHtml}
      </div>
    </section>
  `;
}

async function renderArticlePage(siteConfig, articles) {
  const root = document.getElementById("page-root");
  const query = new URLSearchParams(window.location.search);
  const id = query.get("id");
  const article = articles.find((item) => item.id === id);
  if (!article) {
    root.innerHTML = `<section><h1 class="text-4xl font-black uppercase mb-4">Article Not Found</h1><a class="underline font-bold" href="./index.html">Back to Home</a></section>`;
    return;
  }
  const markdownResponse = await fetch(article.contentPath);
  if (!markdownResponse.ok) {
    throw new Error("Failed to load article content");
  }
  const markdown = await markdownResponse.text();
  const primaryCategory = Array.isArray(article.category) && article.category.length > 0 ? article.category[0] : "Article";
  document.title = `${siteConfig.brand} | ${article.title}`;
  root.innerHTML = `
    <article class="max-w-4xl">
      <div class="inline-block bg-primary px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm border border-charcoal mb-4">${primaryCategory}</div>
      <h1 class="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">${article.title}</h1>
      <p class="text-sm font-bold uppercase tracking-wide text-charcoal/70 mb-8">${formatDate(article.date)}</p>
      <div class="markdown text-charcoal">${markdownToHtml(markdown)}</div>
    </article>
  `;
}

async function loadJson(path, errorMessage) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(errorMessage);
  }
  return response.json();
}

async function init() {
  setupPageTransition();
  const pageType = document.body.dataset.page || "home";
  const params = new URLSearchParams(window.location.search);
  const viewKey = params.get("view");
  const siteConfig = await loadJson("./data/site-config.json", "Failed to load site config");
  const subpageConfig = await loadJson("./data/subpage-config.json", "Failed to load subpage config");
  const activeViewKey = pageType === "subpage" ? viewKey : "";
  document.title = resolveTitle(siteConfig, subpageConfig, pageType, viewKey);
  renderShell(siteConfig, activeViewKey);
  if (pageType === "connect") {
    const connectProfile = await loadJson("./data/connect-profile.json", "Failed to load connect profile");
    document.title = connectProfile.pageTitle || siteConfig.home.pageTitle;
    renderConnect(connectProfile);
    return;
  }
  const articles = await loadJson("./data/articles.json", "Failed to load article data");
  if (pageType === "home") {
    const connectProfile = await loadJson("./data/connect-profile.json", "Failed to load connect profile");
    renderHome(siteConfig, articles, connectProfile);
    return;
  }
  if (pageType === "subpage") {
    const fallbackView = siteConfig.navigation.find((item) => item.showInNav);
    const targetView = viewKey || (fallbackView ? fallbackView.viewKey : "");
    renderSubpage(subpageConfig, articles, targetView);
    return;
  }
  if (pageType === "article") {
    await renderArticlePage(siteConfig, articles);
  }
}

init().catch((error) => {
  const root = document.getElementById("page-root");
  if (root) {
    root.innerHTML = `<section><h1 class="text-4xl font-black uppercase mb-4">Page Load Failed</h1><p class="font-medium">${error.message}</p></section>`;
  }
});
