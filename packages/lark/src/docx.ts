import * as mdast from "mdast";
import chunk from "lodash-es/chunk";
import {
  compare,
  isDefined,
  isBlockquoteContent,
  isParent,
  isPhrasingContent,
  isRootContent,
  isTableCell,
} from "@dolphin/common";
import { PageMain, User } from "./env";

declare module "mdast" {
  interface ImageData {
    name: string;
    token: string;
    fetchSources: () => Promise<ImageSources | null>;
  }

  interface ListItemData {
    seq?: number;
  }
}

/**
 * @see https://open.feishu.cn/document/client-docs/docs-add-on/06-data-structure/BlockType
 */
export enum BlockType {
  PAGE = "page",
  BITABLE = "bitable",
  CALLOUT = "callout",
  CHAT_CARD = "chat_card",
  CODE = "code",
  DIAGRAM = "diagram",
  DIVIDER = "divider",
  FILE = "file",
  GRID = "grid",
  GRID_COLUMN = "grid_column",
  HEADING1 = "heading1",
  HEADING2 = "heading2",
  HEADING3 = "heading3",
  HEADING4 = "heading4",
  HEADING5 = "heading5",
  HEADING6 = "heading6",
  HEADING7 = "heading7",
  HEADING8 = "heading8",
  HEADING9 = "heading9",
  IFRAME = "iframe",
  IMAGE = "image",
  ISV = "isv",
  MINDNOTE = "mindnote",
  BULLET = "bullet",
  ORDERED = "ordered",
  TODO = "todo",
  QUOTE = "quote",
  QUOTE_CONTAINER = "quote_container",
  SHEET = "sheet",
  TABLE = "table",
  CELL = "table_cell",
  TEXT = "text",
  VIEW = "view",
}

interface Attributes {
  fixEnter?: string;
  italic?: string;
  bold?: string;
  strikethrough?: string;
  inlineCode?: string;
  link?: string;
  [attrName: string]: unknown;
}

interface Operation {
  attributes: Attributes;
  insert: string;
}

interface BlockZoneState {
  allText: string;
  content: {
    ops: Operation[];
  };
}

interface BlockSnapshot {
  type: BlockType | "pending";
}

interface Block<T extends Blocks = Blocks> {
  type: BlockType;
  zoneState?: BlockZoneState;
  snapshot: BlockSnapshot;
  children: T[];
}

export interface PageBlock extends Block {
  type: BlockType.PAGE;
}

interface DividerBlock extends Block {
  type: BlockType.DIVIDER;
}

interface HeadingBlock extends Block<TextBlock> {
  type:
    | BlockType.HEADING1
    | BlockType.HEADING2
    | BlockType.HEADING3
    | BlockType.HEADING4
    | BlockType.HEADING5
    | BlockType.HEADING6
    | BlockType.HEADING7
    | BlockType.HEADING8
    | BlockType.HEADING9;
  depth: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

interface CodeBlock extends Block<TextBlock> {
  type: BlockType.CODE;
  language: string;
}

interface QuoteContainerBlock extends Block {
  type: BlockType.QUOTE_CONTAINER;
}

interface BulletBlock extends Block {
  type: BlockType.BULLET;
}

interface OrderedBlock extends Block<TextBlock> {
  type: BlockType.ORDERED;
  snapshot: {
    type: BlockType.ORDERED;
    seq: string;
  };
}

interface TodoBlock extends Block {
  type: BlockType.TODO;
  snapshot: {
    type: BlockType.TODO;
    done?: boolean;
  };
}

interface TextBlock extends Block {
  type: BlockType.TEXT;
}

interface ImageCaption {
  text: {
    initialAttributedTexts: {
      text: { 0: string } | null;
    };
  };
}

interface ImageBlockData {
  token: string;
  width: number;
  height: number;
  mimeType: string;
  name: string;
  caption?: ImageCaption;
}

interface ImageSources {
  originSrc: string;
  src: string;
}

interface ImageBlock extends Block {
  type: BlockType.IMAGE;
  snapshot: {
    type: BlockType.IMAGE;
    image: ImageBlockData;
  };
  imageManager: {
    fetch: (
      image: { token: string },
      options: {},
      callback: (sources: ImageSources) => void
    ) => Promise<void>;
  };
}

interface TableBlock extends Block<TableCellBlock> {
  type: BlockType.TABLE;
  snapshot: {
    type: BlockType.TABLE;
    rows_id: string[];
    columns_id: string[];
  };
}

interface TableCellBlock extends Block {
  type: BlockType.CELL;
}

interface NotSupportedBlock extends Block {
  type:
    | BlockType.QUOTE
    | BlockType.BITABLE
    | BlockType.CALLOUT
    | BlockType.CHAT_CARD
    | BlockType.DIAGRAM
    | BlockType.FILE
    | BlockType.GRID
    | BlockType.GRID_COLUMN
    | BlockType.IFRAME
    | BlockType.ISV
    | BlockType.MINDNOTE
    | BlockType.SHEET
    | BlockType.VIEW;
  children: [];
}

type Blocks =
  | PageBlock
  | DividerBlock
  | HeadingBlock
  | CodeBlock
  | QuoteContainerBlock
  | BulletBlock
  | OrderedBlock
  | TodoBlock
  | TextBlock
  | ImageBlock
  | TableBlock
  | TableCellBlock
  | NotSupportedBlock;

const mergeNodes = <T extends mdast.Nodes>(
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
    if (equalNodes.length > 1) {
      const mergedNode = merge(equalNodes, (nodes) =>
        mergeNodes(nodes, isEqual, merge)
      );
      mergedNodes.push(mergedNode);
    } else {
      mergedNodes.push(...equalNodes);
    }

    index = nextIndex;
  }

  return mergedNodes as T[];
};

const mergeListItems = <T extends mdast.Nodes>(nodes: T[]) =>
  mergeNodes(
    nodes,
    (node, nextNode) => {
      const listItemType = (listItem: mdast.ListItem) => {
        if (typeof listItem.checked === "boolean") {
          return BlockType.TODO;
        }

        if (typeof listItem.data?.seq === "number") {
          return BlockType.ORDERED;
        }

        return BlockType.BULLET;
      };

      return (
        node.type === "listItem" &&
        nextNode.type === "listItem" &&
        listItemType(node) === listItemType(nextNode)
      );
    },
    (nodes) => {
      const fistNode = nodes[0] as mdast.ListItem;
      const list: mdast.List = {
        type: "list",
        ...(typeof fistNode.data?.seq === "number"
          ? {
              ordered: true,
              start: fistNode.data.seq,
            }
          : null),
        children: nodes as mdast.ListItem[],
      };
      return list as T;
    }
  );

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

export const transformOperationsToPhrasingContents = (
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

const fetchImageSources = (imageBlock: ImageBlock) =>
  new Promise<ImageSources | null>(async (resolve) => {
    try {
      const {
        imageManager,
        snapshot: {
          image: { token },
        },
      } = imageBlock;

      await imageManager.fetch({ token }, {}, async (sources) => {
        resolve(sources);
      });

      resolve(null);
    } catch {
      resolve(null);
    }
  });

type Mutate<T extends Block> = T extends PageBlock
  ? mdast.Root
  : T extends DividerBlock
  ? mdast.ThematicBreak
  : T extends HeadingBlock
  ? mdast.Heading
  : T extends CodeBlock
  ? mdast.Code
  : T extends QuoteContainerBlock
  ? mdast.Blockquote
  : T extends BulletBlock | OrderedBlock | TodoBlock
  ? mdast.ListItem
  : T extends TextBlock
  ? mdast.Text
  : T extends TableBlock
  ? mdast.Table
  : T extends TableCellBlock
  ? mdast.TableCell
  : null;

interface TransformResult<T> {
  root: T;
  images: mdast.Image[];
}

class Transformer {
  private parent: mdast.Parent | null = null;
  private images: mdast.Image[] = [];

  private transformParentBlock<T extends Blocks>(
    block: T,
    evaluateNode: (block: T) => Mutate<T>,
    transformChildren: (
      children: mdast.Nodes[]
    ) => Mutate<T> extends mdast.Parent ? Mutate<T>["children"] : never
  ) {
    const previousParent = this.parent;

    const currentParent = evaluateNode(block);
    if (!currentParent || !isParent(currentParent)) {
      return currentParent;
    }
    this.parent = currentParent;

    currentParent.children = transformChildren(
      block.children.map(this._transform).filter(isDefined)
    );

    this.parent = previousParent;

    return currentParent;
  }

  private _transform = (block: Blocks): mdast.Nodes | null => {
    switch (block.type) {
      case BlockType.PAGE: {
        return this.transformParentBlock(
          block,
          () => ({
            type: "root",
            children: [],
          }),
          (nodes) => mergeListItems(nodes.filter(isRootContent))
        );
      }
      case BlockType.DIVIDER: {
        const thematicBreak: mdast.ThematicBreak = {
          type: "thematicBreak",
        };
        return thematicBreak;
      }
      case BlockType.HEADING1:
      case BlockType.HEADING2:
      case BlockType.HEADING3:
      case BlockType.HEADING4:
      case BlockType.HEADING5:
      case BlockType.HEADING6: {
        const heading: mdast.Heading = {
          type: "heading",
          depth: Number(block.type.at(-1)) as mdast.Heading["depth"],
          children: transformOperationsToPhrasingContents(
            block.zoneState?.content.ops ?? []
          ),
        };
        return heading;
      }
      case BlockType.CODE: {
        const code: mdast.Code = {
          type: "code",
          lang: block.language,
          value: block.zoneState?.allText.slice(0, -1) ?? "",
        };
        return code;
      }
      case BlockType.QUOTE_CONTAINER: {
        return this.transformParentBlock(
          block,
          () => ({
            type: "blockquote",
            children: [],
          }),
          (nodes) => mergeListItems(nodes.filter(isBlockquoteContent))
        );
      }
      case BlockType.BULLET:
      case BlockType.ORDERED:
      case BlockType.TODO: {
        const listItem: mdast.ListItem = {
          type: "listItem",
          spread: false,
          children: [
            {
              type: "paragraph",
              children: transformOperationsToPhrasingContents(
                block.zoneState?.content.ops ?? []
              ),
            },
          ],
          ...(block.type === BlockType.TODO
            ? { checked: Boolean(block.snapshot.done) }
            : null),
          ...(block.type === BlockType.ORDERED
            ? {
                data: {
                  seq: Number(block.snapshot.seq),
                },
              }
            : null),
        };
        return listItem;
      }
      case BlockType.TEXT:
      case BlockType.HEADING7:
      case BlockType.HEADING8:
      case BlockType.HEADING9: {
        const paragraph: mdast.Paragraph = {
          type: "paragraph",
          children: transformOperationsToPhrasingContents(
            block.zoneState?.content.ops ?? []
          ),
        };
        return paragraph;
      }
      case BlockType.IMAGE: {
        const { caption, name, token } = block.snapshot.image;
        const alt = (
          caption?.text.initialAttributedTexts.text?.[0] ?? ""
        ).slice(0, -1);
        const image: mdast.Image = {
          type: "image",
          url: "",
          alt,
          data: {
            name,
            token,
            fetchSources: () => fetchImageSources(block),
          },
        };

        this.images.push(image);

        return this.parent?.type === "tableCell"
          ? image
          : { type: "paragraph", children: [image] };
      }
      case BlockType.TABLE: {
        return this.transformParentBlock(
          block,
          () => ({ type: "table", children: [] }),
          (nodes) =>
            chunk(
              nodes.filter(isTableCell),
              block.snapshot.columns_id.length
            ).map((tableCells) => ({
              type: "tableRow",
              children: tableCells,
            }))
        );
      }
      case BlockType.CELL: {
        return this.transformParentBlock(
          block,
          () => ({ type: "tableCell", children: [] }),
          (nodes) =>
            nodes
              .map((node) => (node.type === "paragraph" ? node.children : node))
              .flat(1)
              .filter(isPhrasingContent)
        );
      }
      default:
        return null;
    }
  };

  transform<T extends Blocks>(block: T): TransformResult<Mutate<T>> {
    const node = this._transform(block) as Mutate<T>;

    const result: TransformResult<Mutate<T>> = {
      root: node,
      images: this.images,
    };

    this.parent = null;
    this.images = [];

    return result;
  }
}

const transformer = new Transformer();

export class Docx {
  get rootBlock() {
    if (!PageMain) {
      return null;
    }

    return PageMain.blockManager.model.rootBlockModel;
  }

  get language() {
    return User?.language === "zh" ? "zh" : "en";
  }

  isReady() {
    return (
      !!this.rootBlock &&
      this.rootBlock.children.every(
        (block) => block.snapshot.type !== "pending"
      )
    );
  }

  intoMarkdownAST(): TransformResult<mdast.Root> {
    if (!this.rootBlock) {
      return { root: { type: "root", children: [] }, images: [] };
    }

    return transformer.transform(this.rootBlock);
  }
}

export const docx = new Docx();
