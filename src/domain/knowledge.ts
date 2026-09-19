import type { Book } from "../types/Book";
import type { Note } from "../types/Note";
import type { ActionItem } from "../types/ActionItem";

export type KnowledgeKind = "all" | "insights" | "notes" | "actions";
export type ActionFilter = "all" | "open" | "done";

export interface KnowledgeFilters {
  query: string;
  kind: KnowledgeKind;
  /** Only notes carrying this tag (action items have no tags). */
  tag: string | null;
  actionStatus: ActionFilter;
}

export type KnowledgeResult =
  | { type: "note"; note: Note; book: Book; date: Date }
  | { type: "action"; action: ActionItem; book: Book; date: Date };

export interface KnowledgeData {
  books: Book[];
  notes: Note[];
  actionItems: ActionItem[];
}

const terms = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);
const matchesAll = (haystack: string, words: string[]) =>
  words.every((w) => haystack.includes(w));

/**
 * Filters notes and action items across all books. Every search word must
 * appear somewhere in the item or its book's title/author. Newest first.
 */
export function searchKnowledge(
  data: KnowledgeData,
  filters: KnowledgeFilters
): { books: Book[]; results: KnowledgeResult[] } {
  const words = terms(filters.query);
  const bookById = new Map(data.books.map((b) => [b.id, b]));
  const bookText = (b: Book) => `${b.title} ${b.author}`.toLowerCase();
  const results: KnowledgeResult[] = [];

  if (filters.kind !== "actions") {
    for (const note of data.notes) {
      const book = bookById.get(note.bookId);
      if (!book) continue;
      if (filters.kind === "insights" && !note.isKeyInsight) continue;
      if (filters.tag && !note.tags?.includes(filters.tag)) continue;
      const text = `${note.title} ${note.content} ${(note.tags ?? []).join(" ")} ${bookText(book)}`;
      if (!matchesAll(text.toLowerCase(), words)) continue;
      results.push({ type: "note", note, book, date: note.updatedAt });
    }
  }

  const includeActions = (filters.kind === "all" || filters.kind === "actions") && !filters.tag;
  if (includeActions) {
    for (const action of data.actionItems) {
      const book = bookById.get(action.bookId);
      if (!book) continue;
      if (filters.actionStatus !== "all" && action.status !== filters.actionStatus) continue;
      if (!matchesAll(`${action.description} ${bookText(book)}`.toLowerCase(), words)) continue;
      results.push({ type: "action", action, book, date: action.createdAt });
    }
  }

  results.sort((a, b) => b.date.getTime() - a.date.getTime());

  const books = words.length
    ? data.books.filter((b) => matchesAll(bookText(b), words))
    : [];

  return { books, results };
}

/** All note tags with how often they are used, most used first. */
export function collectTags(notes: Note[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const tag of note.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export interface BookConnection {
  from: Book;
  to: Book;
  note: Note;
}

/** Links between books created by notes that reference other books. */
export function bookConnections(notes: Note[], books: Book[]): BookConnection[] {
  const bookById = new Map(books.map((b) => [b.id, b]));
  const connections: BookConnection[] = [];
  for (const note of notes) {
    const from = bookById.get(note.bookId);
    if (!from) continue;
    for (const targetId of note.linkedBookIds ?? []) {
      const to = bookById.get(targetId);
      // Deleted or self-referencing targets are skipped.
      if (to && to.id !== from.id) connections.push({ from, to, note });
    }
  }
  return connections;
}

/** Notes in other books that link to the given book. */
export function backlinksFor(bookId: string, notes: Note[], books: Book[]): BookConnection[] {
  return bookConnections(notes, books).filter((c) => c.to.id === bookId);
}
