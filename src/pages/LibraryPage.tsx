import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listenToBooks } from "../services/bookService";
import { useAuth } from "../lib/hooks/useAuth";

type Book = {
  id: string;
  title: string;
  author: string;
  status: string;
  coverUrl?: string;
};

const LibraryPage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const unsubscribe = listenToBooks(user.uid, setBooks);
      return () => unsubscribe();
    }
  }, [user]);

  const filteredBooks = books.filter((book: Book) => {
    if (filter === "all") return true;
    return book.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="p-4 bg-slate-900 shadow-md">
        <h1 className="text-3xl font-bold tracking-wide">Your Library</h1>
      </header>
      <main className="container mx-auto p-4">
        <div className="flex gap-2 mb-4">
          {['all', 'reading', 'completed', 'wishlist'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full ${
                filter === status ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book: Book) => (
            <div
              key={book.id}
              className="card hover:scale-[1.01] hover:shadow-lg hover:border-indigo-500/60 cursor-pointer"
              onClick={() => navigate(`/books/${book.id}`)}
            >
              <div className="aspect-[3/4] bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="object-cover rounded-lg" />
                ) : (
                  <span className="text-4xl font-bold text-white">{book.title.charAt(0)}</span>
                )}
              </div>
              <h3 className="text-lg font-bold mt-2">{book.title}</h3>
              <p className="text-sm text-gray-400">{book.author}</p>
              {book.status && (
                <span className="text-xs bg-indigo-600 text-white rounded-full px-2 py-1 mt-2 inline-block">
                  {book.status}
                </span>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LibraryPage;