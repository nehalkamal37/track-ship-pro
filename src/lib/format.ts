import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function formatDate(value: string | undefined) {
  if (!value) return "—";
  return format(parseISO(value), "dd MMM yyyy");
}

export function formatDateTime(value: string | undefined) {
  if (!value) return "—";
  return format(parseISO(value), "dd MMM yyyy, HH:mm");
}

export function formatRelative(value: string | undefined) {
  if (!value) return "—";
  return `${formatDistanceToNowStrict(parseISO(value))} ago`;
}

export function toDateInputValue(value: string | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}
