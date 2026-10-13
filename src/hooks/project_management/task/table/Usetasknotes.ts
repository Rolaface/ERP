import { useEffect, useMemo, useState } from "react";
import { getTaskNotes } from "../../../../api/project/todo/todo.api";

export interface TaskNoteItem {
  user: string;
  text: string;
}

interface Args {
  taskNames: string[];
  reloadKey: number;
  userEmail?: string;
}

const getDisplayName = (email: string): string =>
  email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const useTaskNotes = ({ taskNames, reloadKey, userEmail }: Args) => {
  const [notes, setNotes] = useState<Record<string, TaskNoteItem[]>>({});

  const key = useMemo(
    () => Array.from(new Set(taskNames)).sort().join("|"),
    [taskNames],
  );

  useEffect(() => {
    const names = key ? key.split("|") : [];
    if (names.length === 0) {
      setNotes({});
      return;
    }

    let cancelled = false;

    getTaskNotes(names, userEmail)
      .then((list) => {
        if (cancelled) return;
        const grouped: Record<string, TaskNoteItem[]> = {};
        list.forEach((note) => {
          if (!grouped[note.task]) grouped[note.task] = [];
          grouped[note.task].push({
            user: getDisplayName(note.user),
            text: note.text,
          });
        });
        setNotes(grouped);
      })
      .catch(() => {
        if (!cancelled) setNotes({});
      });

    return () => {
      cancelled = true;
    };
  }, [key, reloadKey, userEmail]);

  return notes;
};