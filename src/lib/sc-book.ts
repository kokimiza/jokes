export const SC_BOOK = {
  title: "情報処理安全確保 実践テキスト",
  edition: "2026年度版",
  revised: "2026-11-02",
  home: "/sc/",
};

export const SC_CHAPTERS = [
  { number: 1, slug: "sc_1", title: "学習ガイド", subtitle: "試験と学び方の全体像", group: "はじめに" },
  { number: 2, slug: "sc_2", title: "WebアプリとAPI認可", subtitle: "入力・コード・権限を読み解く", group: "技術と実践" },
  { number: 3, slug: "sc_3", title: "認証・ID・鍵管理", subtitle: "誰が何を検証するのか", group: "技術と実践" },
  { number: 4, slug: "sc_4", title: "ネットワークと通信", subtitle: "経路・設定・観測範囲を捉える", group: "技術と実践" },
  { number: 5, slug: "sc_5", title: "インシデント対応", subtitle: "記録から事実と対処を導く", group: "技術と実践" },
  { number: 6, slug: "sc_6", title: "管理・開発・事業継続", subtitle: "防御から復旧までを設計する", group: "技術と実践" },
  { number: 7, slug: "sc_7", title: "横断知識と基礎", subtitle: "暗号・クラウド・法務をつなぐ", group: "知識をつなぐ" },
  { number: 8, slug: "sc_8", title: "演習と記述答案", subtitle: "7つの演習と全70大問の索引", group: "知識をつなぐ" },
] as const;

export const chapterHref = (slug: string) => `/blog/${slug}/`;
