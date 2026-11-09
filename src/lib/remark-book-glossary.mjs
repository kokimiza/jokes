import { BOOK_GLOSSARY } from "./book-glossary.mjs";

const escapePattern = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeHTML = (text) => text.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const excluded = new Set(["heading", "link", "linkReference", "code", "inlineCode", "html", "image", "definition"]);

// Annotate prose only. Headings, URLs and copyable code stay byte-for-byte intact.
// One note per term per h2 keeps dense reference tables from becoming a wall of controls.
export default function remarkBookGlossary() {
  return (tree, file) => {
    const frontmatter = file.data.astro?.frontmatter;
    const match = /^sc_([1-8])$/.exec(frontmatter?.filename ?? "");
    if (!match) return;
    const chapter = Number(match[1]);
    const aliases = new Map();
    for (const term of BOOK_GLOSSARY) {
      if (term.onlyChapters && !term.onlyChapters.includes(chapter)) continue;
      for (const alias of term.aliases) aliases.set(alias, term);
    }
    const pattern = new RegExp([...aliases.keys()].sort((a, b) => b.length - a.length).map(escapePattern).join("|"), "gu");
    const used = new Set();
    let inSection = new Set();

    function visit(parent) {
      if (!parent.children || excluded.has(parent.type)) return;
      const children = [];
      for (const node of parent.children) {
        if (node.type === "heading" && node.depth === 2) inSection = new Set();
        if (node.type !== "text") {
          visit(node);
          children.push(node);
          continue;
        }
        let offset = 0;
        for (const found of node.value.matchAll(pattern)) {
          const alias = found[0];
          const term = aliases.get(alias);
          const before = node.value[found.index - 1] ?? "";
          const after = node.value[found.index + alias.length] ?? "";
          // Never turn fragments of API identifiers or longer English words into notes.
          if ((/^[A-Za-z0-9]/.test(alias) && /[A-Za-z0-9_]/.test(before)) ||
              (/[A-Za-z0-9]$/.test(alias) && /[A-Za-z0-9_]/.test(after)) || inSection.has(term.id)) continue;
          if (found.index > offset) children.push({ type: "text", value: node.value.slice(offset, found.index) });
          children.push({ type: "html", value: `<a class="term-ref" data-book-term="${term.id}" href="#glossary-${term.id}">${escapeHTML(alias)}</a>` });
          offset = found.index + alias.length;
          inSection.add(term.id);
          used.add(term.id);
        }
        if (offset < node.value.length) children.push({ type: "text", value: node.value.slice(offset) });
      }
      parent.children = children;
    }
    visit(tree);
    frontmatter.bookGlossary = [...used];
  };
}
