# BookTrackr

A personal reading tracker: keep a library, track reading progress, and turn books into
usable knowledge through structured notes, key insights and action items.

## Features

- **Explore**: find books on Open Library and add them to the library or the wishlist
  (cover and page count are filled in automatically). Books are only added via Explore.
- **Library / Wishlist**: the library holds books you have committed to (to read, reading,
  finished); the wishlist holds books you are interested in but don't own yet.
- **Reading progress**: one-tap "+pages" logging on the dashboard and book page. Every log is
  stored as a reading session, which powers streaks, pace and pages-per-month.
- **Notes**: sections per book, editable, with tags, a "key insight" flag and links to related
  books (shown as backlinks on the linked book).
- **Knowledge library** (`/knowledge`): search and filter every note, key insight and action
  item across all books; the navbar search opens it. Shows connections between books.
- **Stats** (`/stats`): yearly goal, books and pages per month, streaks, pace and
  estimated finish dates.

**Stack:** React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · React Router 7 · Firebase
(Auth + Firestore, client SDK only, no custom backend) · Vitest + Testing Library.
Book discovery uses the public [Open Library API](https://openlibrary.org/developers/api).

## Getting started

Requirements: Node.js 20+ and a Firebase project with **Email/Password** sign-in and
**Cloud Firestore** enabled.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create `.env.local` in the project root (git-ignored) with your Firebase web app config:

   ```sh
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

   These values are public identifiers, not secrets; access control is enforced by the
   Firestore security rules (see below).

3. Deploy the security rules (once, and after every change to `firestore.rules`):

   ```sh
   npx firebase-tools deploy --only firestore:rules --project <your-project-id>
   ```

4. Start the dev server and open http://localhost:5173:

   ```sh
   npm run dev
   ```

> **Windows / PowerShell:** if `npm` fails with *"running scripts is disabled on this
> system"*, either run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
> once, or use `npm.cmd run dev`.

## Scripts

| Command                 | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Dev server with hot reload                      |
| `npm run build`         | Type-check (`tsc -b`) and production build      |
| `npm run preview`       | Serve the production build locally              |
| `npm test`              | Vitest in watch mode                            |
| `npm run test:coverage` | Single test run with coverage report            |
| `npm run lint`          | ESLint                                          |

## Architecture

```
src/
  main.tsx, App.tsx     Bootstrapping; App waits for Firebase to restore the session
  router/               Routes + guards (ProtectedRoute, PublicOnlyRoute)
  lib/
    firebase.ts         Firebase app, Auth and Firestore instances
    auth/               AuthProvider (auth state), useAuth hook, auth error messages
    library/            LibraryProvider: live books + notes/actions/sessions for the signed-in user
    converters/         Firestore <-> domain type converters (Timestamp <-> Date)
    firestoreUtils.ts   Shared Firestore helpers
  domain/               Pure domain logic (progress rules, stats, knowledge search), unit-tested
  services/             All Firestore / HTTP access; components never call Firestore directly
  components/           UI (layout, auth form, book detail widgets, stats charts)
  pages/                Route-level screens
  types/                Domain types
  tests/                Vitest suites (auth flow, domain logic, services, components)
```

**Data flow:** writes go page/component → service function → Firestore (via converter). Reads
come from `LibraryProvider` (mounted in the logged-in layout), which keeps realtime
`onSnapshot` listeners on the user's books and, per book, on its notes, action items and reading
sessions. Every page reads from `useLibrary()`, so cross-book features (dashboard, stats,
knowledge search, backlinks) need no extra queries and changes appear everywhere immediately.
Each document is read once per session; this comfortably scales to a few hundred books. Beyond
that, moving notes/actions/sessions to user-level collections (with a `bookId` field) would
reduce it to one listener per type.

### Data model (Firestore)

```
users/{uid}                                   profile: email, displayName?, photoURL?, createdAt,
                                              yearlyGoals { "2026": 24, ... }
users/{uid}/books/{bookId}                    title, author, status (wishlist|to-read|reading|finished),
                                              totalPages?, pagesRead?, tags,
                                              coverId?, openLibraryKey?, startedAt?, finishedAt?,
                                              createdAt, updatedAt
users/{uid}/books/{bookId}/notes/{id}         title, content, tags, isKeyInsight, linkedBookIds[],
                                              createdAt, updatedAt
users/{uid}/books/{bookId}/actionItems/{id}   description, status (open|done), githubUrl?, noteId?,
                                              createdAt, completedAt?
users/{uid}/books/{bookId}/readingSessions/{id}  startedAt, pagesRead (pages gained), endedAt?, notes?
```

Optional fields are stored as `null` and read back as `undefined`. Deleting a book deletes its
notes, action items and reading sessions in a batched write. Progress changes that gain pages
write the book update and a reading session in one batch (`saveProgress`).

### Authentication

`AuthProvider` derives `user` synchronously from Firebase's `onAuthStateChanged`. Creating the
Firestore profile document (`ensureUserProfile`) happens in the background and never gates
routing. Login/signup pages don't navigate themselves: `PublicOnlyRoute` redirects as soon as
`user` is set (back to the originally requested page, if any), and `ProtectedRoute` redirects to
`/login` when it is not.

### Security

There is no backend, so **`firestore.rules` is the only authorization layer**. It restricts
every document under `users/{uid}` to that user and validates book fields. Keep the deployed
rules in sync with this file (e.g. paste it into Firebase Console → Firestore → Rules).

### Open Library performance

Open Library regularly needs 2–10 s to answer (measured time-to-first-byte), and each cover is a
redirect into an archive.org zip. Explore therefore caches trending results in `localStorage`
(shown instantly, refreshed in the background after 6 h), caches searches for the session,
requests only the fields it uses, and shows skeleton cards while waiting.
