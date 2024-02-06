import type * as mdast from "mdast";

export const mergeNodes = <T extends mdast.Nodes>(
  nodes: T[],
  isEqual: (a: T, b: T) => boolean,
  merge: (nodes: T[], next: (nodes: T[]) => T[]) => T
): T[] => {
  let mergedNodes: mdast.Nodes[] = [];
  let index = 0;
  while (index < nodes.length) {
    let nextIndex = index + 1;
    while (
      nextIndex < nodes.length &&
      isEqual(nodes[index], nodes[nextIndex])
    ) {
      nextIndex++;
    }

    const equalNodes = nodes.slice(index, nextIndex);
    const mergedNode = merge(equalNodes, (nodes) =>
      mergeNodes(nodes, isEqual, merge)
    );
    mergedNodes.push(mergedNode);

    index = nextIndex;
  }

  return mergedNodes as T[];
};
