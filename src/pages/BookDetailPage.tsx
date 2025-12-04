import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBook, updateBook, deleteBook } from "../services/bookService";
import NotesList from "../components/book/NotesList.tsx";
import NewNoteForm from "../components/book/NewNoteForm.tsx";
import ActionItemsList from "../components/book/ActionItemsList.tsx";
import NewActionItemForm from "../components/book/NewActionItemForm.tsx";
import ProgressEditor from "../components/book/ProgressEditor.tsx";
import BookHeader from "../components/book/BookHeader.tsx";
import { useAuth } from "../lib/hooks/useAuth";
import type { Book } from "../types/Book";

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) {
      setLoading(true);
      getBook(user.uid, id)
        .then((book) => {
          setBook(book);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
          navigate("/library");
        });
    }
  }, [user, id, navigate]);

  const handleDelete = async () => {
    if (user && id) {
      await deleteBook(user.uid, id);
      navigate("/library");
    }
  };

  const handleUpdate = (data: Partial<Book>) => {
    if (user && id) {
      updateBook(user.uid, id, data);
    }
  };

  if (!id) {
    navigate("/library");
    return null;
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {book ? (
        <>
          <BookHeader book={book} onDelete={handleDelete} />
          <ProgressEditor book={book} onUpdate={handleUpdate} />
          <NotesList bookId={id!} />
          <NewNoteForm bookId={id!} />
          <ActionItemsList bookId={id!} />
          <NewActionItemForm bookId={id!} />
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default BookDetailPage;