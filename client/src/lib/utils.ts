import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) {
    return "Ahora";
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `Hace ${minutes} min`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `Hace ${hours}h`;
  } else {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  }
}
