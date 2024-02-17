import type * as mdast from "mdast";

export const compare = (a: number, b: number) => {
  if (a === b) return 0;

  return a > b ? 1 : -1;
};

export const isPhrasingContent = (
  node: mdast.Nodes
): node is
  | mdast.Break
  | mdast.Delete
  | mdast.Emphasis
  | mdast.Image
  | mdast.InlineCode
  | mdast.Link
  | mdast.Strong
  | mdast.Text =>
  node.type === "break" ||
  node.type === "delete" ||
  node.type === "emphasis" ||
  node.type === "image" ||
  node.type === "inlineCode" ||
  node.type === "link" ||
  node.type === "strong" ||
  node.type === "text";
