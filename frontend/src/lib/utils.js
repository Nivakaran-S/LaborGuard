import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Auth user objects from the API may use _id, id, or userId */
export function getUserId(user) {
  if (!user) return undefined;
  const raw = user._id ?? user.id ?? user.userId;
  return raw != null ? String(raw) : undefined;
}
