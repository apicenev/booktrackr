type BookStatusFilterProps = {
  filter: string;
  setFilter: (filter: string) => void;
};

const BookStatusFilter = ({ filter, setFilter }: BookStatusFilterProps) => {
  const statuses = ["all", "reading", "completed", "wishlist"];

  return (
    <div className="flex gap-2 mb-4">
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => setFilter(status)}
          className={`px-4 py-2 rounded ${
            filter === status ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default BookStatusFilter;