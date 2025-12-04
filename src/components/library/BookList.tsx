type Book = {
  id: string;
  title: string;
  author: string;
  status: string;
};

type BookListProps = {
  books: Book[];
};

const BookList = ({ books }: BookListProps) => {
  return (
    <ul className="mt-4 space-y-2">
      {books.map((book) => (
        <li key={book.id} className="p-4 border border-gray-700 rounded">
          <h3 className="text-lg font-bold">{book.title}</h3>
          <p className="text-sm text-gray-400">{book.author}</p>
          <p className="text-sm text-gray-500">Status: {book.status}</p>
        </li>
      ))}
    </ul>
  );
};

export default BookList;