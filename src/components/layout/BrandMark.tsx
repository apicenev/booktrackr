import { BookOpenIcon } from "@heroicons/react/24/outline";

/** The BookTrackr logo mark (decorative; pair it with the wordmark or a label). */
export default function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-11 rounded-xl" : "size-8 rounded-lg";
  const icon = size === "lg" ? "size-6" : "size-[18px]";
  return (
    <span aria-hidden="true" className={`grid ${box} place-items-center bg-brand text-white shadow-card`}>
      <BookOpenIcon className={icon} strokeWidth={1.75} />
    </span>
  );
}
