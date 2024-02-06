import type * as mdast from "mdast";
import { compare } from "../utils";
import { mergeNodes } from "./merge-nodes";

interface Attributes {
  fixEnter?: string;
  italic?: string;
  bold?: string;
  strikethrough?: string;
  inlineCode?: string;
  link?: string;
  [attrName: string]: unknown;
}

export interface Operation {
  attributes: Attributes;
  insert: string;
}

const mergePhrasingContents = (nodes: mdast.PhrasingContent[]) =>
  mergeNodes(
    nodes,
    (node, nextNode) => {
      if (node.type === "link" && nextNode.type === "link") {
        return node.url === nextNode.url;
      }

      if (
        node.type === "emphasis" ||
        node.type === "strong" ||
        node.type === "delete" ||
        node.type === "text" ||
        node.type === "inlineCode"
      ) {
        return node.type === nextNode.type;
      }

      return false;
    },
    (nodes, next) => {
      const node = nodes.reduce((pre, cur) => {
        if ("children" in pre && "children" in cur) {
          return {
            ...pre,
            ...cur,
            children: pre.children.concat(cur.children),
          };
        }

        if ("value" in pre && "value" in cur) {
          return {
            ...pre,
            ...cur,
            value: pre.value.concat(cur.value),
          };
        }

        return pre;
      });

      if ("children" in node) {
        node.children = next(node.children);
      }

      return node;
    }
  );

export const transformOperationsToPhrasingContent = (
  ops: Operation[]
): mdast.PhrasingContent[] => {
  const operations = ops.filter((operation) => !operation.attributes.fixEnter);

  let indexToMarks = operations.map(({ attributes }) => {
    type SupportAttrName = "italic" | "bold" | "strikethrough" | "link";

    const isSupportAttr = (attr: string): attr is SupportAttrName =>
      attr === "italic" ||
      attr === "bold" ||
      attr === "strikethrough" ||
      attr === "link";

    const attrNameToNodeType = (
      attr: SupportAttrName
    ): "emphasis" | "strong" | "delete" | "link" => {
      switch (attr) {
        case "italic":
          return "emphasis";
        case "bold":
          return "strong";
        case "strikethrough":
          return "delete";
        case "link":
          return "link";
        default:
          return undefined as never;
      }
    };

    const marks = Object.keys(attributes)
      .filter(isSupportAttr)
      .map(attrNameToNodeType);

    return marks;
  });

  indexToMarks = indexToMarks.map((marks, index) => {
    const markToPriority = new Map(marks.map((mark) => [mark, 0]));

    marks.forEach((mark) => {
      let priority = 0;
      let start = index;
      while (start >= 0 && indexToMarks[start].includes(mark)) {
        priority += operations[start].insert.length;
        start--;
      }
      let end = index + 1;
      while (end < indexToMarks.length && indexToMarks[end].includes(mark)) {
        priority += operations[end].insert.length;
        end++;
      }
      markToPriority.set(mark, priority);
    });

    return marks.sort((a, b) =>
      compare(markToPriority.get(a) ?? 0, markToPriority.get(b) ?? 0)
    );
  });

  let nodes = indexToMarks.map((marks, index) => {
    const { attributes, insert } = operations[index];

    const isInlineCode = Object.keys(attributes).find(
      (attr) => attr === "inlineCode"
    );
    let node: mdast.PhrasingContent = {
      type: isInlineCode ? "inlineCode" : "text",
      value: insert,
    };

    for (const mark of marks) {
      node =
        mark === "link"
          ? {
              type: mark,
              url: decodeURIComponent(attributes.link ?? ""),
              children: [node],
            }
          : {
              type: mark,
              children: [node],
            };
    }

    return node;
  });

  return mergePhrasingContents(nodes);
};
