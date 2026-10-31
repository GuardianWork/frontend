/** Versioned text encoding; untagged descriptions remain literal legacy text. */
export const descriptionMarkdownPrefix = "<!-- guardwork:markdown:v1 -->\n";
export function isFormattedDescription(value: string) {
  return value.startsWith(descriptionMarkdownPrefix);
}
export function descriptionDocument(value: string) {
  return {
    type: "doc",
    content: value.split("\n").map((line) => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text", text: line }] } : {}),
    })),
  };
}
