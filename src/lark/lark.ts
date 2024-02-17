import { toMarkdown } from "mdast-util-to-markdown";
import { gfmStrikethroughToMarkdown } from "mdast-util-gfm-strikethrough";
import { gfmTaskListItemToMarkdown } from "mdast-util-gfm-task-list-item";
import { gfmTableToMarkdown } from "mdast-util-gfm-table";
import chunk from "lodash-es/chunk";
import { fs } from "@zip.js/zip.js";
import { fileSave } from "browser-fs-access";
import i18next from "i18next";
import { mergeNodes } from "./merge-nodes";
import {
  transformOperationsToPhrasingContent,
  type Operation,
} from "./phrasing-content";
import { User, Toast, PageMain } from "./env";
import type * as mdast from "mdast";
import { isPhrasingContent } from "../utils";

i18next.init({
  lng: User?.language === "zh" ? "zh" : "en",
  resources: {
    en: {
      translation: {
        content_loading:
          "Part of the content is still loading and cannot be downloaded at the moment. Please wait for loading to complete and retry",
        failed_to_download: "Failed to download {{name}}",
        unknown_error: "Unknown error during download",
        not_support:
          "This is not a lark document page and cannot be downloaded as Markdown",
        downloading:
          "Download progress: {{progress}}% (please do not refresh or close the page)",
        download_complete: "Download complete",
      },
    },
    zh: {
      translation: {
        content_loading:
          "部分内容仍在加载中，暂时无法下载。请等待加载完成后重试",
        failed_to_download: "下载 {{name}} 失败",
        unknown_error: "下载过程中出现未知错误",
        not_support: "这不是一个飞书文档页面，无法下载为 Markdown",
        downloading: "下载进度：{{progress}}%（请不要刷新或关闭页面）",
        download_complete: "下载完成",
      },
    },
  },
});

declare module "mdast" {
  interface ImageData {
    name: string;
    src: Promise<string>;
  }

  interface ListItemData {
    seq?: number;
  }
}

/**
 * @see https://open.feishu.cn/document/client-docs/docs-add-on/06-data-structure/BlockType
 */
enum BlockType {
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

interface ZoneState {
  zoneState: {
    allText: string;
    content: {
      ops: Operation[];
    };
  };
}

interface Node {
  type: string;

  snapshot: {
    type: string;
  };
}

interface Parent extends Node {
  children: RootContent[];
}

interface RootContentMap {
  blockquote: Blockquote;
  code: Code;
  heading: Heading;
  image: ImageBlock;
  bullet: Bullet;
  ordered: Ordered;
  todo: Todo;
  divider: Divider;
  table: Table;
  tableCell: TableCell;
  text: Text;
}

interface BlockContentMap {
  blockquote: Blockquote;
  code: Code;
  heading: Heading;
  bullet: Bullet;
  ordered: Ordered;
  todo: Todo;
  divider: Divider;
  table: Table;
}

interface PhrasingContentMap {
  text: Text;
  image: ImageBlock;
}

type PhrasingContent = PhrasingContentMap[keyof PhrasingContentMap];

type RootContent = RootContentMap[keyof RootContentMap];

type BlockContent = BlockContentMap[keyof BlockContentMap];

export interface Root extends Parent, ZoneState {
  type: BlockType.PAGE;
}

type Nodes = Root | RootContent;

interface Text extends Node, ZoneState {
  type: BlockType.TEXT;
}

interface Blockquote extends Parent {
  type: BlockType.QUOTE_CONTAINER;
  /**
   * Children of block quote.
   */
  children: Array<BlockContent>;
}

interface Code extends Node, ZoneState {
  type: BlockType.CODE;
  language: string;
}

interface Heading extends Node, ZoneState {
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

interface ImageData {
  token: string;
  width: number;
  height: number;
  mimeType: string;
  name: string;
  caption: {
    text: {
      initialAttributedTexts: {
        text: { 0: string } | null;
      };
    };
  };
}

interface ImageBlock extends Node {
  type: BlockType.IMAGE;
  snapshot: {
    type: "image";
    image: ImageData;
  };
  imageManager: {
    fetch: (
      image: { token: string },
      options: {},
      callback: (response: { originSrc: string; src: string }) => void
    ) => void;
  };
}

interface Bullet extends Node, ZoneState {
  type: BlockType.BULLET;
}

interface Ordered extends Node, ZoneState {
  type: BlockType.ORDERED;
  snapshot: {
    type: "ordered";
    seq: string;
  };
}

interface Todo extends Node, ZoneState {
  type: BlockType.TODO;
  snapshot: {
    type: "todo";
    done?: boolean;
  };
}

interface Divider extends Node {
  type: BlockType.DIVIDER;
}

interface Table extends Parent {
  type: BlockType.TABLE;
  children: TableCell[];
  snapshot: {
    type: "table";
    rows_id: string[];
    columns_id: string[];
  };
}

interface TableCell extends Parent {
  type: BlockType.CELL;
  children: PhrasingContent[];
}

const fetchImageSrc = (imageBlock: ImageBlock) =>
  new Promise<string>((resolve, reject) => {
    const {
      imageManager,
      snapshot: {
        image: { token },
      },
    } = imageBlock;

    imageManager.fetch({ token }, {}, async ({ src }) => {
      resolve(src);
    });
  });

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

interface ParseContext<T extends mdast.Parent = mdast.Parent> {
  parent: T | null;
  images: mdast.Image[];
}

const parseBlocks = <T extends mdast.Nodes>(
  context: ParseContext,
  blocks: Nodes[]
): T[] => {
  const nodes = blocks
    .map((block) => parseBlock(context, block))
    .filter((node): node is mdast.Nodes => node !== null);

  if (context.parent?.type === "tableRow") {
    return nodes as T[];
  }

  return mergeListItems(nodes) as T[];
};

const parseBlock = <T extends mdast.Nodes>(
  context: ParseContext,
  block: Nodes
): T | null => {
  const { parent, images } = context;

  if (block.type === BlockType.PAGE) {
    const root: mdast.Root = {
      type: "root",
      children: [],
    };
    root.children = parseBlocks({ parent: root, images }, block.children);
    return root as T;
  }

  if (block.type === BlockType.QUOTE_CONTAINER) {
    const blockquote: mdast.Blockquote = {
      type: "blockquote",
      children: [],
    };
    blockquote.children = parseBlocks(
      { parent: blockquote, images },
      block.children
    );
    return blockquote as T;
  }

  if (block.type === BlockType.CODE) {
    const code: mdast.Code = {
      type: "code",
      lang: block.language,
      value: block.zoneState.allText.slice(0, -1),
    };
    return code as T;
  }

  if (
    block.type === BlockType.HEADING1 ||
    block.type === BlockType.HEADING2 ||
    block.type === BlockType.HEADING3 ||
    block.type === BlockType.HEADING4 ||
    block.type === BlockType.HEADING5 ||
    block.type === BlockType.HEADING6
  ) {
    const heading: mdast.Heading = {
      type: "heading",
      depth: Number(block.type.at(-1)) as mdast.Heading["depth"],
      children: transformOperationsToPhrasingContent(
        block.zoneState.content.ops
      ),
    };
    return heading as T;
  }

  if (block.type === BlockType.IMAGE) {
    const name = block.snapshot.image.name;
    const caption = (
      block.snapshot.image.caption?.text.initialAttributedTexts.text?.[0] ?? ""
    ).slice(0, -1);
    const image: mdast.Image = {
      type: "image",
      url: "",
      alt: caption,
      data: {
        name,
        src: fetchImageSrc(block),
      },
    };
    images.push(image);
    return (
      parent?.type !== "tableCell"
        ? { type: "paragraph", children: [image] }
        : image
    ) as T;
  }

  if (
    block.type === BlockType.BULLET ||
    block.type === BlockType.ORDERED ||
    block.type === BlockType.TODO
  ) {
    const listItem: mdast.ListItem = {
      type: "listItem",
      spread: false,
      children: [
        {
          type: "paragraph",
          children: transformOperationsToPhrasingContent(
            block.zoneState.content.ops
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
    return listItem as T;
  }

  if (block.type === BlockType.DIVIDER) {
    const thematicBreak: mdast.ThematicBreak = {
      type: "thematicBreak",
    };
    return thematicBreak as T;
  }

  if (block.type === BlockType.TABLE) {
    const table: mdast.Table = {
      type: "table",
      children: chunk(block.children, block.snapshot.columns_id.length).map(
        (cells) => {
          const tableRow: mdast.TableRow = {
            type: "tableRow",
            children: [],
          };
          tableRow.children = parseBlocks({ parent: tableRow, images }, cells);
          return tableRow;
        }
      ),
    };
    return table as T;
  }

  if (block.type === BlockType.CELL) {
    const tableCell: mdast.TableCell = {
      type: "tableCell",
      children: [],
    };

    tableCell.children = parseBlocks(
      { parent: tableCell, images },
      block.children
    ).filter(isPhrasingContent);

    return tableCell as T;
  }

  if (
    block.type === BlockType.TEXT ||
    block.type === BlockType.HEADING7 ||
    block.type === BlockType.HEADING8 ||
    block.type === BlockType.HEADING9
  ) {
    const paragraph: mdast.Paragraph = {
      type: "paragraph",
      children: transformOperationsToPhrasingContent(
        block.zoneState.content.ops
      ),
    };
    return paragraph as T;
  }

  return null;
};

const parseDocument = (rootBlock: Root) => {
  const images: mdast.Image[] = [];
  const root = parseBlock<mdast.Root>({ parent: null, images }, rootBlock) ?? {
    type: "root",
    children: [],
  };

  return { root, images };
};

const stringifyDocument = (root: mdast.Root) =>
  toMarkdown(root, {
    extensions: [
      gfmStrikethroughToMarkdown(),
      gfmTaskListItemToMarkdown(),
      gfmTableToMarkdown(),
    ],
  });

const downloadAsMarkdown = async () => {
  try {
    if (!PageMain) {
      Toast?.warning({ content: i18next.t("not_support") });

      return;
    }

    const rootBlock = PageMain.blockManager.model.rootBlockModel;
    if (rootBlock.children.some((block) => block.snapshot.type === "pending")) {
      Toast?.warning({
        content: i18next.t("content_loading"),
      });

      return;
    }

    Toast?.loading({
      content: i18next.t("downloading", { progress: "0" }),
      keepAlive: true,
      key: "downloading",
    });

    let { root, images } = parseDocument(rootBlock);
    const documentTitle = "doc";
    const hasImages = images.length > 0;
    const ext = hasImages ? ".zip" : ".md";

    const toBlob = async () => {
      let blob: Blob;

      let allItemsCount = images.length + 1;
      let downloadedItemsCount = 0;

      const updateLoading = () => {
        downloadedItemsCount++;
        Toast?.loading({
          content: i18next.t("downloading", {
            progress: Math.floor((downloadedItemsCount / allItemsCount) * 100),
          }),
          keepAlive: true,
          key: "downloading",
        });
      };

      const closeLoading = () => {
        Toast?.remove("downloading");
      };

      if (!hasImages) {
        const markdown = stringifyDocument(root);

        updateLoading();

        blob = new Blob([markdown]);
      } else {
        let zipFs = new fs.FS();

        await Promise.allSettled(
          images.map(async (image, index) => {
            if (image.data) {
              const { name, src } = image.data;
              try {
                const imageFileName = `${index}-${name}`;
                const response = await fetch(await src);
                zipFs.addBlob(imageFileName, await response.blob());
                image.url = imageFileName;
              } catch {
                Toast?.error({
                  content: i18next.t("failed_to_download", { name }),
                });
              }
            }

            updateLoading();
          })
        );

        const markdown = stringifyDocument(root);

        updateLoading();

        zipFs.addText(`${documentTitle}.md`, markdown);

        blob = await zipFs.exportBlob();
      }

      closeLoading();

      Toast?.success({ content: i18next.t("download_complete") });

      return blob;
    };

    await fileSave(toBlob(), {
      fileName: `${documentTitle}${ext}`,
      extensions: [ext],
    });
  } catch (error) {
    Toast?.remove("downloading");

    Toast?.error({ content: i18next.t("unknown_error") });

    console.error(error);
  }
};

downloadAsMarkdown();
