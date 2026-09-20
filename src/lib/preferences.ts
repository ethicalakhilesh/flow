export const ACCENT_COOKIE = "flow_accent";
export type Accent = "green" | "blue";

export function isAccent(value: string | undefined): value is Accent {
  return value === "green" || value === "blue";
}
