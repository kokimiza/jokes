// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkBookGlossary from "./src/lib/remark-book-glossary.mjs";

export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		remarkPlugins: [remarkMath, remarkBookGlossary],
		rehypePlugins: [rehypeKatex],
		syntaxHighlight: {
			type: "shiki",
			excludeLangs: ["mermaid", "math"],
		},
	},
	site: "https://jocarium.productions",
	integrations: [mdx(), sitemap()],
});
