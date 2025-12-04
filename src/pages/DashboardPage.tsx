import { useState, useEffect } from "react";
import { getBooks } from "../services/bookService";
import { getNotes } from "../services/noteService";
import { getActionItems } from "../services/actionItemService";
import { useAuth } from "../lib/hooks/useAuth";
import type { Book } from "../types/Book";
import type { Note } from "../types/Note";
import type { ActionItem } from "../types/ActionItem";

const DashboardPage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  useEffect(() => {
    if (user) {
      getBooks(user.uid).then(setBooks);
      const bookId = "global"; // Replace with actual logic to determine bookId
      getNotes(user.uid, bookId).then(setNotes);
      getActionItems(user.uid, bookId).then(setActionItems);
    }
  }, [user]);

  const stats = {
    totalBooks: books.length,
    currentlyReading: books.filter((book: Book) => book.status === "reading").length,
    totalNotes: notes.length,
    openActionItems: actionItems.filter((item: ActionItem) => item.status === "open").length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="p-4 bg-slate-900 shadow-md">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </header>
      <main className="container mx-auto p-4">
        <section className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800 rounded-lg">
            <h2 className="text-lg font-semibold">Total Books</h2>
            <p className="text-2xl font-bold">{stats.totalBooks}</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <h2 className="text-lg font-semibold">Currently Reading</h2>
            <p className="text-2xl font-bold">{stats.currentlyReading}</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <h2 className="text-lg font-semibold">Total Notes</h2>
            <p className="text-2xl font-bold">{stats.totalNotes}</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <h2 className="text-lg font-semibold">Open Action Items</h2>
            <p className="text-2xl font-bold">{stats.openActionItems}</p>
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-bold">Recent Activity</h2>
          <ul className="mt-4 space-y-2">
            {books.slice(0, 5).map((book: Book) => (
              <li key={book.id} className="p-2 bg-slate-800 rounded-lg">
                <p className="text-sm">{book.title}</p>
              </li>
            ))}
            {notes.slice(0, 5).map((note: Note) => (
              <li key={note.id} className="p-2 bg-slate-800 rounded-lg">
                <p className="text-sm">{note.title}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;