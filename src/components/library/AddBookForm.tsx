import { useState } from "react";
import { createBook } from "../../services/bookService";

type AddBookFormProps = {
  userId: string | undefined;
};

const AddBookForm = ({ userId }: AddBookFormProps) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    await createBook(userId, { title, author, status: "reading" });
    setTitle("");
    setAuthor("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Book Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 border border-gray-700 rounded"
          required
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="p-2 border border-gray-700 rounded"
          required
        />
        <button
          type="submit"
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Book
        </button>
      </div>
    </form>
  );
};

export default AddBookForm;