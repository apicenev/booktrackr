import { useState } from "react";

/** Widths; the height always follows the 2:3 book aspect ratio. */
const sizes = {
  xs: "w-10",
  sm: "w-16",
  md: "w-20",
  lg: "w-28 sm:w-32",
  fill: "w-full",
} as const;

// Full class names so Tailwind picks them up.
const TINTS = [
  "bg-cover-1",
  "bg-cover-2",
  "bg-cover-3",
  "bg-cover-4",
  "bg-cover-5",
  "bg-cover-6",
];

// Typography of generated covers, scaled to the cover width.
const generated = {
  xs: { box: "p-1", title: "line-clamp-4 text-[7px]", author: "" },
  sm: { box: "p-1.5", title: "line-clamp-4 text-[9px]", author: "" },
  md: { box: "p-2", title: "line-clamp-5 text-[10px]", author: "text-[9px]" },
  lg: { box: "p-3", title: "line-clamp-6 text-sm", author: "text-[11px]" },
  fill: { box: "p-3", title: "line-clamp-6 text-sm", author: "text-[11px]" },
} as const;

const tintFor = (title: string) => {
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
};

export default function BookCover({
  title,
  author,
  coverId,
  size = "sm",
}: {
  title: string;
  /** Shown on generated covers (books without a cover image). */
  author?: string;
  coverId?: number;
  size?: keyof typeof sizes;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(coverId) && !failed;
  const type = generated[size];

  return (
    <div
      className={`relative ${sizes[size]} aspect-[2/3] shrink-0 overflow-hidden rounded-[3px] shadow-cover ${
        showImage ? "bg-sunken" : tintFor(title)
      }`}
    >
      {showImage ? (
        // Decorative: the title is always rendered next to the cover.
        <img
          src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        // Generated typographic cover.
        <div
          aria-hidden="true"
          className={`flex h-full flex-col justify-between ${type.box}`}
        >
          <span
            lang="en"
            className={`font-serif font-semibold leading-tight break-words hyphens-auto text-ink/85 ${type.title}`}
          >
            {title}
          </span>
          {author && type.author && (
            <span className={`line-clamp-2 leading-tight text-ink/60 ${type.author}`}>{author}</span>
          )}
        </div>
      )}
      {/* Spine highlight so covers read as physical books. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/15 to-white/10"
      />
    </div>
  );
}
