const state = { content: null, lang: localStorage.getItem("site-lang") || "zh" };

const ui = {
  zh: { portfolio: "个人作品集", footer: "保持好奇，认真创作，真诚表达。", menuOpen: "打开菜单", menuClose: "关闭菜单", page: "页面", profile: "个人主页", photo: "个人照片" },
  en: { portfolio: "PERSONAL PORTFOLIO", footer: "Curiosity, craft & thoughtful communication.", menuOpen: "Open menu", menuClose: "Close menu", page: "PAGE", profile: "Personal homepage", photo: "Portrait" },
};

const getText = (entry) => entry?.[state.lang] || entry?.zh || "";
const currentPageId = () => location.hash.replace(/^#/, "") || state.content?.pages?.[0]?.id;

function updateLanguageChrome() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-lang-label]").forEach((node) => node.classList.toggle("active", node.dataset.langLabel === state.lang));
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = ui[state.lang][node.dataset.i18n]; });
  const toggle = document.querySelector("#language-toggle");
  toggle.setAttribute("aria-label", state.lang === "zh" ? "Switch to English" : "切换到中文");
  document.querySelector(".brand").setAttribute("aria-label", state.lang === "zh" ? "返回首页" : "Back to home");
  const menu = document.querySelector("#menu-toggle");
  menu.setAttribute("aria-label", document.querySelector("#mobile-nav").classList.contains("open") ? ui[state.lang].menuClose : ui[state.lang].menuOpen);
}

function buildNavigation(activeId) {
  const links = state.content.pages.map((page) => `<a class="nav-link ${page.id === activeId ? "active" : ""}" href="#${page.id}">${getText(page.title)}</a>`).join("");
  document.querySelector("#desktop-nav").innerHTML = links;
  document.querySelector("#mobile-nav").innerHTML = links;
}

function isSubheading(text) {
  return /^(?:\d+[、.]|\d+\s*[.)]|[一二三四五六七八九十]+、)/.test(text);
}

function renderModule(module, index) {
  const image = module.items.find((item) => item.type === "image");
  const textItems = module.items.filter((item) => item.type === "text");
  const number = String(index + 1).padStart(2, "0");

  if (image) {
    const primaryText = textItems[0] ? getText(textItems[0].value) : "Wang Jiachen";
    return `<article class="module has-image">
      <div class="image-frame">
        <img src="${image.src}" alt="${getText(image.alt) || ui[state.lang].photo}" />
        <span class="image-caption">${state.lang === "zh" ? "上海 · 2026" : "SHANGHAI · 2026"}</span>
        <div class="image-overlay"><span class="module-index">${number}</span><h2>${primaryText}</h2></div>
      </div>
    </article>`;
  }

  const body = textItems.length
    ? textItems.map((item) => { const text = getText(item.value); return `<p class="${isSubheading(text) ? "is-heading" : ""}">${text}</p>`; }).join("")
    : `<p>${state.lang === "zh" ? "内容待补充" : "Content to be added"}</p>`;

  return `<article class="module"><span class="module-index">${number}</span><h2>${getText(module.title)}</h2><div class="module-body">${body}</div></article>`;
}

function render() {
  if (!state.content?.pages?.length) return;
  const requestedId = currentPageId();
  const pageIndex = Math.max(0, state.content.pages.findIndex((page) => page.id === requestedId));
  const page = state.content.pages[pageIndex];
  if (requestedId !== page.id) history.replaceState(null, "", `#${page.id}`);

  updateLanguageChrome();
  buildNavigation(page.id);
  const title = getText(page.title);
  const titleParts = title.split(/\s+/);
  const stylizedTitle = titleParts.length > 1 ? `${titleParts.slice(0, -1).join(" ")} <span class="outline">${titleParts.at(-1)}</span>` : title;
  document.title = `${title} · Wang Jiachen`;
  document.querySelector("#app").innerHTML = `
    <section class="page-intro">
      <div><p class="eyebrow">${ui[state.lang].profile}</p><h1 class="page-title">${stylizedTitle}</h1></div>
      <div class="page-number">${ui[state.lang].page} ${String(pageIndex + 1).padStart(2, "0")} / ${String(state.content.pages.length).padStart(2, "0")}</div>
      <div class="page-rule"></div>
    </section>
    <section class="module-grid" aria-label="${title}">${page.modules.map(renderModule).join("")}</section>`;
  document.querySelector("#app").focus({ preventScroll: true });
}

async function init() {
  try {
    const response = await fetch("data/site-content.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.content = await response.json();
    render();
  } catch (error) {
    document.querySelector("#app").innerHTML = `<div class="empty-state">${state.lang === "zh" ? "页面内容暂时无法加载。" : "The page content could not be loaded."}</div>`;
    console.error(error);
  }
}

document.querySelector("#language-toggle").addEventListener("click", () => {
  state.lang = state.lang === "zh" ? "en" : "zh";
  localStorage.setItem("site-lang", state.lang);
  render();
});
document.querySelector("#menu-toggle").addEventListener("click", (event) => {
  const nav = document.querySelector("#mobile-nav");
  const open = nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
  event.currentTarget.setAttribute("aria-label", open ? ui[state.lang].menuClose : ui[state.lang].menuOpen);
});
document.querySelector("#mobile-nav").addEventListener("click", () => {
  document.querySelector("#mobile-nav").classList.remove("open");
  document.querySelector("#menu-toggle").setAttribute("aria-expanded", "false");
});
window.addEventListener("hashchange", render);
document.querySelector("#year").textContent = new Date().getFullYear();
init();
