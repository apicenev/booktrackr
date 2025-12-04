export type ActionStatus = "open" | "done";

export interface ActionItem {
  id: string;
  bookId: string;
  noteId?: string;
  description: string;
  status: ActionStatus;
  githubUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface NewActionItemInput {
  bookId: string;
  noteId?: string;
  description: string;
  githubUrl?: string;
}