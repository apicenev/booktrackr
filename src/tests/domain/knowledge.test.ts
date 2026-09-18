import { describe, expect, it } from "vitest";
import {
  backlinksFor,
  bookConnections,
  collectTags,
  searchKnowledge,
  type KnowledgeFilters,
} from "../../domain/knowledge";
import type { Book } from "../../types/Book";
import type { Note } from "../../types/Note";
import type { ActionItem } from "../../types/ActionItem";

const day = (d: number) => new Date(2026, 0, d);

const book = (id: string, title: string, author = "Author"): Book => ({
  id,
  title,
  author,
  status: "reading",
  createdAt: day(1),
  updatedAt: day(1),
});

const note = (id: string, bookId: string, extra: Partial<Note> = {}): Note => ({
  id,
  bookId,
  title: `Note ${id}`,
  content: "",
  tags: [],
  createdAt: day(1),
  updatedAt: day(1),
  ...extra,
});

const action = (id: string, bookId: string, extra: Partial<ActionItem> = {}): ActionItem => ({
  id,
  bookId,
  description: `Action ${id}`,
  status: "open",
  createdAt: day(1),
  ...extra,
});

const books = [book("b1", "Clean Code", "Robert Martin"), book("b2", "Atomic Habits", "James Clear")];
const notes = [
  note("n1", "b1", { title: "Small functions", content: "Functions should do one thing", tags: ["design"], updatedAt: day(5) }),
  note("n2", "b2", { title: "Habit stacking", content: "Link habits", tags: ["habits", "design"], isKeyInsight: true, updatedAt: day(3), linkedBookIds: ["b1"] }),
  note("n3", "gone", { title: "Orphan" }),
];
const actions = [
  action("a1", "b1", { description: "Refactor the parser into small functions", createdAt: day(4) }),
  action("a2", "b2", { description: "Read every morning", status: "done", createdAt: day(6) }),
];

const filters = (extra: Partial<KnowledgeFilters> = {}): KnowledgeFilters => ({
  query: "",
  kind: "all",
  tag: null,
  actionStatus: "all",
  ...extra,
});

const ids = (r: ReturnType<typeof searchKnowledge>["results"]) =>
  r.map((x) => (x.type === "note" ? x.note.id : x.action.id));

describe("searchKnowledge", () => {
  const data = { books, notes, actionItems: actions };

  it("returns notes and actions newest first, skipping items of deleted books", () => {
    expect(ids(searchKnowledge(data, filters()).results)).toEqual(["a2", "n1", "a1", "n2"]);
  });

  it("requires every word to match, across content and book title", () => {
    expect(ids(searchKnowledge(data, filters({ query: "small functions" })).results)).toEqual(["n1", "a1"]);
    expect(ids(searchKnowledge(data, filters({ query: "atomic link" })).results)).toEqual(["n2"]);
  });

  it("matches books by title or author", () => {
    expect(searchKnowledge(data, filters({ query: "clear" })).books.map((b) => b.id)).toEqual(["b2"]);
    expect(searchKnowledge(data, filters()).books).toEqual([]);
  });

  it("filters key insights, tags and action status", () => {
    expect(ids(searchKnowledge(data, filters({ kind: "insights" })).results)).toEqual(["n2"]);
    expect(ids(searchKnowledge(data, filters({ tag: "design" })).results)).toEqual(["n1", "n2"]);
    expect(ids(searchKnowledge(data, filters({ kind: "actions", actionStatus: "open" })).results)).toEqual(["a1"]);
  });
});

describe("collectTags", () => {
  it("counts tags, most used first", () => {
    expect(collectTags(notes)).toEqual([
      { tag: "design", count: 2 },
      { tag: "habits", count: 1 },
    ]);
  });
});

describe("book connections", () => {
  it("links books through notes and ignores deleted or self links", () => {
    const withBadLinks = [...notes, note("n4", "b1", { linkedBookIds: ["b1", "deleted"] })];
    const connections = bookConnections(withBadLinks, books);
    expect(connections.map((c) => [c.from.id, c.to.id, c.note.id])).toEqual([["b2", "b1", "n2"]]);
  });

  it("finds backlinks for a book", () => {
    expect(backlinksFor("b1", notes, books).map((c) => c.from.id)).toEqual(["b2"]);
    expect(backlinksFor("b2", notes, books)).toEqual([]);
  });
});
