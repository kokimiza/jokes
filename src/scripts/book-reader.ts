type Preferences = { size: string; font: string; theme: string };
type Progress = { completed: string[]; last?: { slug: string; section: string } };

const root = document.documentElement;
root.classList.add("js-ready");
const validChapters = new Set(Array.from(document.querySelectorAll<HTMLElement>("[data-chapter-link]"), (link) => link.dataset.chapterLink!));
const current = document.body.dataset.currentChapter;
const prose = document.getElementById("book-prose");
const headings = Array.from(prose?.querySelectorAll<HTMLElement>("h2[id], h3[id]") ?? []);
const sectionLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-section-link]"));
const announcement = document.getElementById("reader-announcement");
const announce = (message: string) => { if (announcement) announcement.textContent = message; };

function readStorage(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
}
function writeStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage is optional. */ }
}

const rawSettings = readStorage("sc-reader-settings") as Partial<Preferences> | null;
const preferences: Preferences = {
  size: ["small", "standard", "large"].includes(rawSettings?.size ?? "") ? rawSettings!.size! : "standard",
  font: ["sans", "serif"].includes(rawSettings?.font ?? "") ? rawSettings!.font! : "sans",
  theme: ["paper", "light", "dark"].includes(rawSettings?.theme ?? "") ? rawSettings!.theme! : "paper",
};
const sizeValues: Record<string, string> = { small: "1rem", standard: "1.125rem", large: "1.25rem" };
function applyPreferences() {
  root.dataset.readerTheme = preferences.theme;
  root.dataset.readerFont = preferences.font;
  root.style.setProperty("--reader-font-size", sizeValues[preferences.size]);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", getComputedStyle(root).getPropertyValue("--book-bg").trim());
}
applyPreferences();
for (const key of ["size", "font", "theme"] as const) {
  const control = document.getElementById(`reader-${key}`) as HTMLSelectElement | null;
  if (!control) continue;
  control.value = preferences[key];
  control.addEventListener("change", () => {
    preferences[key] = control.value;
    applyPreferences();
    writeStorage("sc-reader-settings", preferences);
  });
}
const settings = document.querySelector<HTMLDetailsElement>(".reader-settings");
document.addEventListener("click", (event) => {
  if (settings?.open && event.target instanceof Node && !settings.contains(event.target)) settings.open = false;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settings?.open) {
    settings.open = false;
    settings.querySelector("summary")?.focus();
  }
});

const rawProgress = readStorage("sc-reader-progress") as Partial<Progress> | null;
const progress: Progress = {
  completed: Array.isArray(rawProgress?.completed) ? [...new Set(rawProgress.completed.filter((slug) => validChapters.has(slug)))] : [],
};
if (rawProgress?.last && validChapters.has(rawProgress.last.slug) && typeof rawProgress.last.section === "string") progress.last = rawProgress.last;
const completion = document.getElementById("chapter-complete");
function updateCompletion() {
  for (const link of document.querySelectorAll<HTMLElement>("[data-chapter-link]")) {
    const mark = link.querySelector<HTMLElement>(".chapter-done");
    if (mark) mark.hidden = !progress.completed.includes(link.dataset.chapterLink!);
  }
  if (completion && current) {
    const completed = progress.completed.includes(current);
    completion.setAttribute("aria-pressed", String(completed));
    completion.textContent = completed ? "読了済み" : "読了にする";
  }
}
updateCompletion();
completion?.addEventListener("click", () => {
  if (!current || !validChapters.has(current)) return;
  progress.completed = progress.completed.includes(current) ? progress.completed.filter((slug) => slug !== current) : [...progress.completed, current];
  writeStorage("sc-reader-progress", progress);
  updateCompletion();
  announce(progress.completed.includes(current) ? "この章を読了として記録しました。" : "この章の読了記録を解除しました。");
});

function updateResumeLink() {
  if (!progress.last) return;
  for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-resume-link]")) {
    link.href = `/blog/${progress.last.slug}/#${encodeURIComponent(progress.last.section)}`;
    link.hidden = false;
  }
}
updateResumeLink();
if (progress.last && current && progress.last.slug === current && !location.hash) {
  const previousSection = headings.find((heading) => heading.id === progress.last?.section);
  const notice = document.getElementById("resume-notice");
  const resume = document.getElementById("resume-section");
  if (previousSection && notice && resume) {
    resume.setAttribute("href", `#${previousSection.id}`);
    resume.textContent = `前回の続き：${previousSection.textContent}`;
    notice.hidden = false;
  }
}
document.getElementById("dismiss-resume")?.addEventListener("click", () => {
  const notice = document.getElementById("resume-notice");
  if (notice) notice.hidden = true;
});

let savedSection = progress.last && current && progress.last.slug === current ? progress.last.section : "";
let pendingFrame = false;
function updateReadingPosition(persist = false) {
  if (!prose || !current) return;
  const start = prose.getBoundingClientRect().top + window.scrollY;
  const end = start + prose.offsetHeight - window.innerHeight * .6;
  const ratio = Math.max(0, Math.min(1, (window.scrollY - start + 110) / Math.max(1, end - start)));
  const bar = document.getElementById("reading-progress-bar");
  if (bar) bar.style.transform = `scaleX(${ratio})`;
  let active: HTMLElement | undefined;
  for (const heading of headings) {
    if (heading.closest("[hidden]")) continue;
    if (heading.getBoundingClientRect().top <= 160) active = heading;
    else break;
  }
  for (const link of sectionLinks) {
    if (active && link.dataset.sectionLink === active.id) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
  if (persist && active && active.id !== savedSection && window.scrollY > 200) {
    progress.last = { slug: current, section: active.id };
    savedSection = active.id;
    writeStorage("sc-reader-progress", progress);
    updateResumeLink();
  }
}
window.addEventListener("scroll", () => {
  if (pendingFrame) return;
  pendingFrame = true;
  requestAnimationFrame(() => { updateReadingPosition(true); pendingFrame = false; });
}, { passive: true });
window.addEventListener("resize", () => updateReadingPosition());
updateReadingPosition();
for (const link of sectionLinks) {
  link.addEventListener("click", () => {
    const mobileDetails = link.closest<HTMLDetailsElement>(".mobile-navigation details");
    if (mobileDetails) mobileDetails.open = false;
    const target = document.getElementById(link.dataset.sectionLink!);
    if (target) {
      target.tabIndex = -1;
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
    }
  });
}

// Keep wide data tables inside the reading column; keyboard users can scroll them too.
const tableRegions: HTMLElement[] = [];
prose?.querySelectorAll("table").forEach((table, index) => {
  const region = document.createElement("div");
  region.className = "table-scroll";
  region.setAttribute("role", "region");
  region.setAttribute("aria-label", `表 ${index + 1}（横にスクロールできます）`);
  table.parentNode!.insertBefore(region, table);
  region.appendChild(table);
  tableRegions.push(region);
  const hint = document.createElement("p");
  hint.className = "table-hint";
  hint.textContent = "表は横にスクロールできます";
  region.parentNode!.insertBefore(hint, region.nextSibling);
});
function updateTableOverflow() {
  for (const region of tableRegions) {
    const overflowing = region.scrollWidth > region.clientWidth + 1;
    region.classList.toggle("is-overflowing", overflowing);
    region.tabIndex = overflowing ? 0 : -1;
  }
  updateReadingPosition();
}
if (typeof ResizeObserver !== "undefined" && prose) new ResizeObserver(updateTableOverflow).observe(prose);
else window.addEventListener("resize", updateTableOverflow);
updateTableOverflow();

prose?.querySelectorAll("pre > code").forEach((code) => {
  const text = code.textContent ?? "";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-code";
  button.textContent = "コピー";
  button.setAttribute("aria-label", "このコードをコピー");
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "コピー済み";
      announce("コードをコピーしました。");
      window.setTimeout(() => { button.textContent = "コピー"; }, 1800);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      announce("コードを選択しました。コピーのショートカットを使ってください。");
    }
  });
  code.parentElement?.insertBefore(button, code.parentElement.firstChild);
});

// Native details stay interactive; include closed answers when printing and restore afterwards.
let closedBeforePrint: HTMLDetailsElement[] = [];
window.addEventListener("beforeprint", () => {
  closedBeforePrint = Array.from(prose?.querySelectorAll<HTMLDetailsElement>("details:not([open])") ?? []);
  for (const details of closedBeforePrint) details.open = true;
});
window.addEventListener("afterprint", () => {
  for (const details of closedBeforePrint) details.open = false;
  closedBeforePrint = [];
});
document.getElementById("book-print")?.addEventListener("click", () => window.print());
