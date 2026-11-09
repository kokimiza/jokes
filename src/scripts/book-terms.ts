// The server renders ordinary links to a chapter glossary. Browsers without
// Popover support (or JavaScript) keep that complete, usable fallback.
const popup = document.getElementById("term-popover");
if (popup && typeof popup.showPopover === "function") {
  const title = popup.querySelector<HTMLElement>("#term-popover-title")!;
  const name = popup.querySelector<HTMLElement>("#term-popover-name")!;
  const definition = popup.querySelector<HTMLElement>("#term-popover-definition")!;
  const chapterLink = popup.querySelector<HTMLAnchorElement>("#term-popover-chapter")!;
  const close = popup.querySelector<HTMLButtonElement>(".term-close")!;
  let active: HTMLButtonElement | undefined;
  let frame = 0;

  function positionNote() {
    if (!active || !popup?.matches(":popover-open")) return;
    const viewport = window.visualViewport;
    const leftEdge = viewport?.offsetLeft ?? 0;
    const topEdge = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? window.innerWidth;
    const height = viewport?.height ?? window.innerHeight;
    const rect = active.getBoundingClientRect();
    const bottomEdge = topEdge + height;
    if (rect.bottom < topEdge + 60 || rect.top > bottomEdge || rect.right < leftEdge || rect.left > leftEdge + width) {
      popup.hidePopover();
      return;
    }
    const gap = 12;
    const box = popup.getBoundingClientRect();
    const below = bottomEdge - rect.bottom - gap;
    const above = rect.top - Math.max(topEdge, 60) - gap;
    const onTop = below < box.height && above > below;
    const x = Math.max(leftEdge + gap, Math.min(rect.left, leftEdge + width - box.width - gap));
    const y = Math.max(topEdge + gap, Math.min(onTop ? rect.top - box.height - gap : rect.bottom + gap, bottomEdge - box.height - gap));
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.setProperty("--term-arrow-x", `${Math.max(20, Math.min(rect.left + rect.width / 2 - x, box.width - 20))}px`);
    popup.dataset.side = onTop ? "above" : "below";
  }

  function schedulePosition() {
    if (frame || !active) return;
    frame = requestAnimationFrame(() => { frame = 0; positionNote(); });
  }

  function dismiss(restoreFocus = false) {
    const trigger = active;
    if (popup?.matches(":popover-open")) popup.hidePopover();
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  }

  for (const link of document.querySelectorAll<HTMLAnchorElement>("#book-prose a[data-book-term]")) {
    const entry = document.getElementById(`glossary-${link.dataset.bookTerm}`);
    if (!entry) continue;
    const label = link.textContent ?? "";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "term-ref";
    // Keep inline markup such as upright letters in the newspaper view.
    button.append(...link.childNodes);
    button.dataset.bookTerm = link.dataset.bookTerm;
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", "term-popover");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", `${label}の意味`);
    link.replaceWith(button);
  }

  // Delegated, so copies made when the newspaper view repaginates keep working.
  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button.term-ref") : null;
    const entry = button && document.getElementById(`glossary-${button.dataset.bookTerm}`);
    if (!button || !entry) return;
    if (active === button && popup.matches(":popover-open")) {
      dismiss();
      return;
    }
    active?.setAttribute("aria-expanded", "false");
    title.textContent = button.textContent;
    name.textContent = entry.querySelector("[data-term-name]")?.textContent ?? "";
    definition.textContent = entry.querySelector("[data-term-definition]")?.textContent ?? "";
    const target = entry.querySelector<HTMLAnchorElement>("[data-term-chapter]")!;
    chapterLink.href = target.href;
    chapterLink.textContent = target.textContent;
    active = button;
    button.setAttribute("aria-expanded", "true");
    if (!popup.matches(":popover-open")) popup.showPopover();
    positionNote();
    if (event.detail === 0) close.focus({ preventScroll: true });
  });

  popup.addEventListener("beforetoggle", (event) => {
    if ((event as ToggleEvent).newState === "closed") {
      active?.setAttribute("aria-expanded", "false");
      active = undefined;
    }
  });
  close.addEventListener("click", () => dismiss(true));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.matches(":popover-open")) {
      event.preventDefault();
      dismiss(true);
    }
  });
  popup.addEventListener("keydown", (event) => {
    // Return to the word's place in the document instead of skipping to the footer.
    if (event.key === "Tab" && ((event.shiftKey && document.activeElement === close) || (!event.shiftKey && document.activeElement === chapterLink))) {
      if (event.shiftKey) event.preventDefault();
      dismiss(true);
    }
  });
  document.addEventListener("focusin", (event) => {
    if (active && event.target !== active && event.target instanceof Node && !popup.contains(event.target)) dismiss();
  });
  document.addEventListener("scroll", schedulePosition, { passive: true, capture: true });
  window.addEventListener("resize", schedulePosition);
  window.visualViewport?.addEventListener("resize", schedulePosition);
  window.visualViewport?.addEventListener("scroll", schedulePosition);
  window.addEventListener("beforeprint", () => dismiss());
}

// Explicit glossary links work even when the list was collapsed on arrival.
function revealGlossaryTarget() {
  if (!location.hash.startsWith("#glossary-")) return;
  const entry = document.getElementById(location.hash.slice(1));
  const glossary = entry?.closest<HTMLDetailsElement>(".chapter-glossary");
  if (glossary) {
    glossary.open = true;
    entry?.scrollIntoView({ block: "center" });
  }
}
window.addEventListener("hashchange", revealGlossaryTarget);
revealGlossaryTarget();
