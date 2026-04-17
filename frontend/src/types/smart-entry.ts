export type InputMode = "link" | "keyword" | "file";

export interface ContextTag {
  id: string;
  label: string;
  type: "topic" | "audience" | "tone" | "platform";
}
