const sizes = {
  sm: "h-24 w-16",
  lg: "h-36 w-24",
} as const;

export default function BookCover({
  title,
  coverId,
  size = "sm",
}: {
  title: string;
  coverId?: number;
  size?: keyof typeof sizes;
}) {
  return (
    <div
      className={`relative ${sizes[size]} shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-indigo-500/30 to-indigo-600/10`}
    >
      {coverId ? (
        // Decorative: the title is always rendered next to the cover.
        <img
          src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center" aria-hidden="true">
          <span className="text-lg font-semibold text-indigo-100/90">
            {title.charAt(0).toUpperCase() || "B"}
          </span>
        </div>
      )}
    </div>
  );
}
