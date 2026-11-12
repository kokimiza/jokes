import { SC_CHAPTERS, chapterHref } from "../lib/sc-book";

type Rating = "retry" | "ready";
type Review = { chapter: string; target: string; title: string; rating: Rating };
const key = "sc-mental-review-v1";
const chapters = new Set<string>(SC_CHAPTERS.map((chapter) => chapter.slug));
const current = document.body.dataset.currentChapter;
const prose = document.getElementById("book-prose");
const reviews: Record<string, Review> = Object.create(null);
const error = document.getElementById("study-storage-error");
let readable = true;
function storageError() {
  if (error) { error.textContent = "復習の記録を保存できません。画面上のチェックは使えますが、再読込みすると消えます。"; error.hidden = false; }
}
try {
  const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "{}");
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    for (const [id, value] of Object.entries(saved).slice(0, 500)) {
      const item = value as Partial<Review> | null;
      if (!item || !chapters.has(item.chapter ?? "") || typeof item.target !== "string" || !item.target || item.target.length > 400 || typeof item.title !== "string") continue;
      if (id !== `${item.chapter}:${item.target}` || !["retry", "ready"].includes(item.rating ?? "")) continue;
      reviews[id] = { chapter: item.chapter!, target: item.target, title: item.title.slice(0, 400), rating: item.rating as Rating };
    }
  }
} catch { readable = false; storageError(); }
function persist() {
  if (!readable) return;
  try { localStorage.setItem(key, JSON.stringify(reviews)); } catch { storageError(); }
}
function updateDashboard() {
  const retry = Object.values(reviews).filter((item) => item.rating === "retry");
  const count = document.getElementById("study-review-count");
  if (count) count.textContent = `${retry.length}件`;
  const empty = document.getElementById("study-review-empty");
  if (empty) empty.hidden = retry.length > 0;
  document.getElementById("study-review-list")?.replaceChildren(...retry.map((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `${chapterHref(item.chapter)}#${encodeURIComponent(item.target)}`;
    const label = document.createElement("span"); label.textContent = item.title;
    const chapter = document.createElement("small"); chapter.textContent = `第${SC_CHAPTERS.find((entry) => entry.slug === item.chapter)!.number}章`;
    a.appendChild(label); a.appendChild(chapter); li.appendChild(a); return li;
  }));
  updateChapterProgress();
}
function updateChapterProgress() {
  let completed: string[] = [];
  try {
    const progress = JSON.parse(localStorage.getItem("sc-reader-progress") ?? "{}");
    if (Array.isArray(progress?.completed)) completed = [...new Set<string>(progress.completed.filter((slug: unknown) => typeof slug === "string" && chapters.has(slug)))];
  } catch { /* Reading progress is optional. */ }
  const counter = document.getElementById("study-completed-count");
  if (counter) counter.textContent = `${completed.length} / ${SC_CHAPTERS.length}`;
  for (const link of document.querySelectorAll<HTMLElement>("[data-map-chapter]")) {
    const label = link.querySelector("[data-map-state]");
    if (label) label.textContent = completed.includes(link.dataset.mapChapter!) ? "読了" : "開く";
  }
}
document.getElementById("chapter-complete")?.addEventListener("click", updateChapterProgress);

function ratingControls(target: string, title: string, chapter = current!) {
  const controls = document.createElement("fieldset");
  controls.className = "answer-rating";
  controls.innerHTML = '<legend>頭の中で、説明できた？</legend><button type="button" data-rating="retry" aria-pressed="false">もう一度</button><button type="button" data-rating="ready" aria-pressed="false">思い出せた</button><button type="button" class="text-button" data-rating="">チェックを戻す</button><p>タップで記録できます。自己チェックは任意です。</p>';
  const id = `${chapter}:${target}`;
  const render = () => {
    for (const button of controls.querySelectorAll<HTMLButtonElement>("[data-rating]")) {
      if (button.dataset.rating) button.setAttribute("aria-pressed", String(button.dataset.rating === reviews[id]?.rating));
      else button.disabled = !reviews[id];
    }
  };
  for (const button of controls.querySelectorAll<HTMLButtonElement>("[data-rating]")) button.addEventListener("click", () => {
    if (button.dataset.rating) reviews[id] = { chapter, target, title, rating: button.dataset.rating as Rating };
    else delete reviews[id];
    persist(); render(); updateDashboard();
  });
  render(); return controls;
}

const sections: HTMLElement[] = [];
const exercises = current === "sc_8" || current === "sc_9";
if (current && prose) {
  let section: HTMLElement | undefined;
  for (const node of Array.from(prose.children)) {
    if (node.tagName === "H2") {
      section = document.createElement("section"); section.className = "study-section";
      section.dataset.studySection = node.id; section.setAttribute("aria-labelledby", node.id);
      prose.insertBefore(section, node); sections.push(section);
    }
    section?.appendChild(node);
  }
  for (const section of sections) {
    const heading = section.querySelector("h2")!;
    const title = heading.textContent?.trim() ?? "";
    const solution = Array.from(section.querySelectorAll<HTMLDetailsElement>("details")).find((details) => /解答/.test(details.querySelector("summary")?.textContent ?? ""));
    if (exercises && !solution) continue;
    const panel = document.createElement(solution ? "div" : "details");
    panel.className = solution ? "mental-check" : "recall-panel";
    panel.innerHTML = solution
      ? '<h3>いったん、画面から目を離す。</h3><p>設問への答えを頭の中で組み立ててから、解答例を開く。</p>'
      : '<summary>本文を隠して、思い出す</summary><p>この節の要点を、誰かに教えるつもりで頭の中で説明する。</p><button class="recall-toggle" type="button">本文を確かめる</button>';
    if (solution) solution.parentNode!.insertBefore(panel, solution); else section.appendChild(panel);
    const controls = ratingControls(heading.id, title);
    if (solution) {
      solution.parentNode!.insertBefore(controls, solution.nextSibling); controls.hidden = !solution.open;
      solution.addEventListener("toggle", () => { controls.hidden = !solution.open; });
    } else {
      panel.appendChild(controls);
      panel.addEventListener("toggle", () => {
        section.classList.toggle("recalling", (panel as HTMLDetailsElement).open);
        if ((panel as HTMLDetailsElement).open) panel.scrollIntoView({ block: "center" });
      });
      panel.querySelector("button")?.addEventListener("click", () => {
        (panel as HTMLDetailsElement).open = false; section.classList.remove("recalling"); heading.scrollIntoView({ block: "start" });
      });
    }
  }
}

const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-recall-card]"));
let cardIndex = 0;
function showCard(index: number) {
  cardIndex = (index + cards.length) % cards.length;
  cards.forEach((card, i) => {
    card.hidden = i !== cardIndex;
    if (i !== cardIndex) { const answer = card.querySelector("details"); if (answer) answer.open = false; }
  });
  const position = document.querySelector("[data-recall-position]");
  if (position) position.textContent = `${cardIndex + 1} / ${cards.length}`;
}
if (cards.length) {
  for (const card of cards) {
    const answer = card.querySelector("details")!;
    const controls = ratingControls(card.id, card.dataset.recallTitle!, document.querySelector<HTMLElement>("[data-recall-chapter]")!.dataset.recallChapter!);
    card.appendChild(controls); controls.hidden = !answer.open;
    answer.addEventListener("toggle", () => { controls.hidden = !answer.open; });
  }
  document.getElementById("recall-previous")?.addEventListener("click", () => showCard(cardIndex - 1));
  document.getElementById("recall-next")?.addEventListener("click", () => showCard(cardIndex + 1));
  showCard(0);
}

const focusButton = document.getElementById("study-focus") as HTMLButtonElement | null;
const select = document.getElementById("study-section") as HTMLSelectElement | null;
const previous = document.getElementById("study-previous") as HTMLButtonElement | null;
const next = document.getElementById("study-next") as HTMLButtonElement | null;
let selected = 0;
let focused = true;
function resolveTarget(hash: string) {
  try { return document.getElementById(decodeURIComponent(hash.replace(/^#/, ""))); } catch { return null; }
}
function renderSections(scroll = false) {
  sections.forEach((section, index) => { section.hidden = focused && index !== selected; });
  prose?.classList.toggle("section-focus", focused);
  if (focusButton) { focusButton.setAttribute("aria-pressed", String(focused)); focusButton.textContent = focused ? "全体を表示" : "1節ずつ表示"; }
  if (select && sections[selected]) select.value = sections[selected].dataset.studySection!;
  if (previous) previous.disabled = selected === 0;
  if (next) next.disabled = selected === sections.length - 1;
  const count = document.getElementById("study-section-count");
  if (count) count.textContent = `${selected + 1} / ${sections.length}`;
  if (scroll) sections[selected]?.scrollIntoView({ block: "start" });
  window.dispatchEvent(new Event("resize"));
}
function followHash(hash: string, scroll = false) {
  const target = resolveTarget(hash);
  if (!target) return;
  const index = sections.findIndex((section) => section.contains(target));
  if (index >= 0) { selected = index; renderSections(); }
  const card = target.closest<HTMLElement>("[data-recall-card]");
  if (card) showCard(cards.indexOf(card));
  const glossary = target.closest(".chapter-glossary");
  if (glossary instanceof HTMLDetailsElement) glossary.open = true;
  if (scroll) target.scrollIntoView({ block: "start" });
}
function choose(index: number) {
  selected = Math.max(0, Math.min(sections.length - 1, index));
  if (sections[selected]) history.replaceState(null, "", `#${encodeURIComponent(sections[selected].dataset.studySection!)}`);
  renderSections(true);
}
if (sections.length) {
  const practice = new URLSearchParams(location.search).get("practice") === "1";
  if (practice && !location.hash) selected = Math.max(0, sections.findIndex((section) => section.querySelector(".mental-check")));
  renderSections(practice);
  followHash(location.hash, !!location.hash);
  focusButton?.addEventListener("click", () => { focused = !focused; renderSections(); });
  select?.addEventListener("change", () => choose(sections.findIndex((section) => section.dataset.studySection === select.value)));
  previous?.addEventListener("click", () => choose(selected - 1));
  next?.addEventListener("click", () => choose(selected + 1));
}
document.addEventListener("click", (event) => {
  const a = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
  if (a) followHash(a.hash);
});
window.addEventListener("hashchange", () => followHash(location.hash, true));
updateDashboard();
