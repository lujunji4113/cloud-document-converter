import * as mdast from 'mdast'
import chunk from 'lodash-es/chunk'
import { imageDataToBlob, compare, isDefined } from '@dolphin/common'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfmStrikethroughToMarkdown } from 'mdast-util-gfm-strikethrough'
import { gfmTaskListItemToMarkdown } from 'mdast-util-gfm-task-list-item'
import { gfmTableToMarkdown } from 'mdast-util-gfm-table'
import { mathToMarkdown, InlineMath } from 'mdast-util-math'
import { PageMain, User } from './env'
import {
  isBlockquoteContent,
  isParent,
  isPhrasingContent,
  isRootContent,
  isTableCell,
  isListItemContent,
} from './utils/mdast'

declare module 'mdast' {
  interface ImageData {
    name?: string
    token?: string
    fetchSources?: () => Promise<ImageSources | null>
    fetchBlob?: () => Promise<Blob | null>
  }

  interface ListItemData {
    seq?: number | 'auto'
  }
}

/**
 * @see https://open.feishu.cn/document/client-docs/docs-add-on/06-data-structure/BlockType
 */
export enum BlockType {
  PAGE = 'page',
  BITABLE = 'bitable',
  CALLOUT = 'callout',
  CHAT_CARD = 'chat_card',
  CODE = 'code',
  DIAGRAM = 'diagram',
  DIVIDER = 'divider',
  FILE = 'file',
  GRID = 'grid',
  GRID_COLUMN = 'grid_column',
  HEADING1 = 'heading1',
  HEADING2 = 'heading2',
  HEADING3 = 'heading3',
  HEADING4 = 'heading4',
  HEADING5 = 'heading5',
  HEADING6 = 'heading6',
  HEADING7 = 'heading7',
  HEADING8 = 'heading8',
  HEADING9 = 'heading9',
  IFRAME = 'iframe',
  IMAGE = 'image',
  ISV = 'isv',
  MINDNOTE = 'mindnote',
  BULLET = 'bullet',
  ORDERED = 'ordered',
  TODO = 'todo',
  QUOTE = 'quote',
  QUOTE_CONTAINER = 'quote_container',
  SHEET = 'sheet',
  TABLE = 'table',
  CELL = 'table_cell',
  TEXT = 'text',
  VIEW = 'view',
  SYNCED_SOURCE = 'synced_source',
  WHITEBOARD = 'whiteboard',
}

interface Attributes {
  fixEnter?: string
  italic?: string
  bold?: string
  strikethrough?: string
  inlineCode?: string
  link?: string
  equation?: string
  [attrName: string]: unknown
}

interface Operation {
  attributes: Attributes
  insert: string
}

interface BlockZoneState {
  allText: string
  content: {
    ops: Operation[]
  }
}

interface BlockSnapshot {
  type: BlockType | 'pending'
}

interface Block<T extends Blocks = Blocks> {
  type: BlockType
  zoneState?: BlockZoneState
  snapshot: BlockSnapshot
  children: T[]
}

export interface PageBlock extends Block {
  type: BlockType.PAGE
}

interface DividerBlock extends Block {
  type: BlockType.DIVIDER
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
    | BlockType.HEADING9
  depth: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
}

interface CodeBlock extends Block<TextBlock> {
  type: BlockType.CODE
  language: string
}

interface QuoteContainerBlock extends Block {
  type: BlockType.QUOTE_CONTAINER
}

interface BulletBlock extends Block {
  type: BlockType.BULLET
}

interface OrderedBlock extends Block<TextBlock> {
  type: BlockType.ORDERED
  snapshot: {
    type: BlockType.ORDERED
    seq: string
  }
}

interface TodoBlock extends Block {
  type: BlockType.TODO
  snapshot: {
    type: BlockType.TODO
    done?: boolean
  }
}

interface TextBlock extends Block {
  type: BlockType.TEXT
}

interface Caption {
  text: {
    initialAttributedTexts: {
      text: { 0: string } | null
    }
  }
}

interface ImageBlockData {
  token: string
  width: number
  height: number
  mimeType: string
  name: string
  caption?: Caption
}

interface ImageSources {
  originSrc: string
  src: string
}

interface ImageBlock extends Block {
  type: BlockType.IMAGE
  snapshot: {
    type: BlockType.IMAGE
    image: ImageBlockData
  }
  imageManager: {
    fetch: <T extends ImageSources>(
      image: { token: string },
      options: unknown,
      callback: (sources: ImageSources) => T,
    ) => Promise<T>
  }
}

interface TableBlock extends Block<TableCellBlock> {
  type: BlockType.TABLE
  snapshot: {
    type: BlockType.TABLE
    rows_id: string[]
    columns_id: string[]
  }
}

interface TableCellBlock extends Block {
  type: BlockType.CELL
}

interface Callout extends Block {
  type: BlockType.CALLOUT
}

interface SyncedSource extends Block {
  type: BlockType.SYNCED_SOURCE
}

interface RatioApp {
  ratioAppProxy: {
    getOriginImageDataByNodeId: (
      i: 24,
      o: [''],
      r: false,
      n: 2,
    ) => Promise<{ data: ImageData } | null>
  }
}

interface WhiteboardBlock {
  isolateEnv: {
    hasRatioApp: () => boolean
    getRatioApp: () => RatioApp
  }
}

interface Whiteboard extends Block {
  type: BlockType.WHITEBOARD
  whiteboardBlock?: WhiteboardBlock
  snapshot: {
    type: BlockType.WHITEBOARD
    caption?: Caption
  }
}

interface NotSupportedBlock extends Block {
  type:
    | BlockType.QUOTE
    | BlockType.BITABLE
    | BlockType.CHAT_CARD
    | BlockType.DIAGRAM
    | BlockType.FILE
    | BlockType.GRID
    | BlockType.GRID_COLUMN
    | BlockType.IFRAME
    | BlockType.ISV
    | BlockType.MINDNOTE
    | BlockType.SHEET
    | BlockType.VIEW
  children: []
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
  | Callout
  | SyncedSource
  | Whiteboard
  | NotSupportedBlock

const chunkBy = <T>(
  items: T[],
  isEqual: (current: T, next: T) => boolean,
): T[][] => {
  const chunks: T[][] = []
  let index = 0

  while (index < items.length) {
    let nextIndex = index + 1
    while (
      nextIndex < items.length &&
      isEqual(items[index], items[nextIndex])
    ) {
      nextIndex++
    }

    chunks.push(items.slice(index, nextIndex))

    index = nextIndex
  }

  return chunks
}

export const mergeListItems = <T extends mdast.Nodes>(nodes: T[]) =>
  chunkBy(nodes, (current, next) => {
    const listItemType = (listItem: mdast.ListItem) => {
      if (typeof listItem.checked === 'boolean') {
        return BlockType.TODO
      }

      if (
        typeof listItem.data?.seq === 'number' ||
        listItem.data?.seq === 'auto'
      ) {
        return BlockType.ORDERED
      }

      return BlockType.BULLET
    }

    const isEqualOrderedListItem = (
      node: mdast.ListItem,
      other: mdast.ListItem,
    ) => {
      const seq = node.data?.seq
      const otherSeq = other.data?.seq

      if (!seq || !otherSeq) return false

      if (seq === 'auto') {
        return otherSeq === 'auto'
      }

      return otherSeq === 'auto' || seq + 1 === otherSeq
    }

    const isEqualListItem = (node: mdast.ListItem, other: mdast.ListItem) => {
      const type = listItemType(node)
      const otherType = listItemType(other)

      if (type === otherType) {
        return type === BlockType.ORDERED
          ? isEqualOrderedListItem(node, other)
          : true
      }

      return false
    }

    return (
      current.type === 'listItem' &&
      next.type === 'listItem' &&
      isEqualListItem(current, next)
    )
  }).map(nodes => {
    const node = nodes[0]

    if (node.type === 'listItem') {
      const list: mdast.List = {
        type: 'list',
        ...(typeof node.data?.seq === 'number'
          ? {
              ordered: true,
              start: node.data.seq,
            }
          : null),
        children: nodes as mdast.ListItem[],
      }
      return list
    }

    return node
  })

export const mergePhrasingContents = (nodes: mdast.PhrasingContent[]) =>
  chunkBy(nodes, (current, next) => {
    if (current.type === 'link' && next.type === 'link') {
      return current.url === next.url
    }

    if (
      current.type === 'emphasis' ||
      current.type === 'strong' ||
      current.type === 'delete' ||
      current.type === 'text' ||
      current.type === 'inlineCode'
    ) {
      return current.type === next.type
    }

    return false
  }).map(nodes => {
    const node = nodes.reduce((pre, cur) => {
      if ('children' in pre && 'children' in cur) {
        return {
          ...pre,
          ...cur,
          children: pre.children.concat(cur.children),
        }
      }

      if ('value' in pre && 'value' in cur) {
        return {
          ...pre,
          ...cur,
          value: pre.value.concat(cur.value),
        }
      }

      return pre
    })

    if ('children' in node) {
      node.children = mergePhrasingContents(node.children)
    }

    return node
  })

export const transformOperationsToPhrasingContents = (
  ops: Operation[],
): mdast.PhrasingContent[] => {
  const operations = ops.filter(operation => !operation.attributes.fixEnter)

  let indexToMarks = operations.map(({ attributes }) => {
    type SupportAttrName = 'italic' | 'bold' | 'strikethrough' | 'link'

    const isSupportAttr = (attr: string): attr is SupportAttrName =>
      attr === 'italic' ||
      attr === 'bold' ||
      attr === 'strikethrough' ||
      attr === 'link'

    const attrNameToNodeType = (
      attr: SupportAttrName,
    ): 'emphasis' | 'strong' | 'delete' | 'link' => {
      switch (attr) {
        case 'italic':
          return 'emphasis'
        case 'bold':
          return 'strong'
        case 'strikethrough':
          return 'delete'
        case 'link':
          return 'link'
        default:
          return undefined as never
      }
    }

    const marks = Object.keys(attributes)
      .filter(isSupportAttr)
      .map(attrNameToNodeType)

    return marks
  })

  indexToMarks = indexToMarks.map((marks, index) => {
    const markToPriority = new Map(marks.map(mark => [mark, 0]))

    marks.forEach(mark => {
      let priority = 0
      let start = index
      while (start >= 0 && indexToMarks[start].includes(mark)) {
        priority += operations[start].insert.length
        start--
      }
      let end = index + 1
      while (end < indexToMarks.length && indexToMarks[end].includes(mark)) {
        priority += operations[end].insert.length
        end++
      }
      markToPriority.set(mark, priority)
    })

    return marks.sort((a, b) =>
      compare(markToPriority.get(a) ?? 0, markToPriority.get(b) ?? 0),
    )
  })

  const createLiteral = (
    op: Operation,
  ): mdast.Text | mdast.InlineCode | InlineMath => {
    const { attributes, insert } = op
    const { inlineCode, equation } = attributes

    if (inlineCode) {
      return {
        type: 'inlineCode',
        value: insert,
      }
    }

    if (equation && equation.length > 1) {
      return {
        type: 'inlineMath',
        value: equation.slice(0, -1),
      }
    }

    return {
      type: 'text',
      value: insert,
    }
  }

  const nodes = indexToMarks.map((marks, index) => {
    const op = operations[index]

    let node: mdast.PhrasingContent = createLiteral(op)
    for (const mark of marks) {
      node =
        mark === 'link'
          ? {
              type: mark,
              url: decodeURIComponent(op.attributes.link ?? ''),
              children: [node],
            }
          : {
              type: mark,
              children: [node],
            }
    }

    return node
  })

  return mergePhrasingContents(nodes)
}

const fetchImageSources = (imageBlock: ImageBlock) => {
  const {
    imageManager,
    snapshot: {
      image: { token },
    },
  } = imageBlock

  return imageManager.fetch({ token }, {}, sources => sources)
}

const whiteboardToImageData = async (
  whiteboard: Whiteboard,
): Promise<ImageData | null> => {
  if (!whiteboard.whiteboardBlock) return null

  const { isolateEnv } = whiteboard.whiteboardBlock

  if (!isolateEnv.hasRatioApp()) return null

  const rationApp = isolateEnv.getRatioApp()
  const imageData = await rationApp.ratioAppProxy.getOriginImageDataByNodeId(
    24,
    [''],
    false,
    2,
  )

  if (!imageData) return null

  return imageData.data
}

const evaluateAlt = (caption?: Caption) =>
  (caption?.text.initialAttributedTexts.text?.[0] ?? '').slice(0, -1)

type Mutate<T extends Block> = T extends PageBlock
  ? mdast.Root
  : T extends DividerBlock
    ? mdast.ThematicBreak
    : T extends HeadingBlock
      ? mdast.Heading
      : T extends CodeBlock
        ? mdast.Code
        : T extends QuoteContainerBlock | Callout
          ? mdast.Blockquote
          : T extends BulletBlock | OrderedBlock | TodoBlock
            ? mdast.ListItem
            : T extends TextBlock
              ? mdast.Text
              : T extends TableBlock
                ? mdast.Table
                : T extends TableCellBlock
                  ? mdast.TableCell
                  : T extends Whiteboard
                    ? mdast.Image
                    : null

interface TransformerOptions {
  whiteboard: boolean
}

interface TransformResult<T> {
  root: T
  images: mdast.Image[]
}

export class Transformer {
  private parent: mdast.Parent | null = null
  private images: mdast.Image[] = []

  constructor(public options: TransformerOptions = { whiteboard: false }) {}

  private normalizeImage(image: mdast.Image): mdast.Image | mdast.Paragraph {
    return this.parent?.type === 'tableCell'
      ? image
      : { type: 'paragraph', children: [image] }
  }

  private transformParentBlock<T extends Blocks>(
    block: T,
    evaluateNode: (block: T) => Mutate<T>,
    transformChildren: (
      children: mdast.Nodes[],
    ) => Mutate<T> extends mdast.Parent ? Mutate<T>['children'] : never,
  ) {
    const previousParent = this.parent

    const currentParent = evaluateNode(block)
    if (!currentParent || !isParent(currentParent)) {
      return currentParent
    }
    this.parent = currentParent

    const flatChildren = (children: Blocks[]): Blocks[] =>
      children
        .map(child => {
          if (child.type === BlockType.SYNCED_SOURCE) {
            return flatChildren(child.children)
          }

          return child
        })
        .flat(1)

    currentParent.children = transformChildren(
      flatChildren(block.children).map(this._transform).filter(isDefined),
    )

    this.parent = previousParent

    return currentParent
  }

  private _transform = (block: Blocks): mdast.Nodes | null => {
    switch (block.type) {
      case BlockType.PAGE: {
        return this.transformParentBlock(
          block,
          () => ({
            type: 'root',
            children: [],
          }),
          nodes => mergeListItems(nodes).filter(isRootContent),
        )
      }
      case BlockType.DIVIDER: {
        const thematicBreak: mdast.ThematicBreak = {
          type: 'thematicBreak',
        }
        return thematicBreak
      }
      case BlockType.HEADING1:
      case BlockType.HEADING2:
      case BlockType.HEADING3:
      case BlockType.HEADING4:
      case BlockType.HEADING5:
      case BlockType.HEADING6: {
        const heading: mdast.Heading = {
          type: 'heading',
          depth: Number(block.type.at(-1)) as mdast.Heading['depth'],
          children: transformOperationsToPhrasingContents(
            block.zoneState?.content.ops ?? [],
          ),
        }
        return heading
      }
      case BlockType.CODE: {
        const code: mdast.Code = {
          type: 'code',
          lang: block.language.toLocaleLowerCase(),
          value: block.zoneState?.allText.slice(0, -1) ?? '',
        }
        return code
      }
      case BlockType.QUOTE_CONTAINER:
      case BlockType.CALLOUT: {
        return this.transformParentBlock(
          block,
          () => ({
            type: 'blockquote',
            children: [],
          }),
          nodes => mergeListItems(nodes).filter(isBlockquoteContent),
        )
      }
      case BlockType.BULLET:
      case BlockType.ORDERED:
      case BlockType.TODO: {
        const paragraph: mdast.Paragraph = {
          type: 'paragraph',
          children: transformOperationsToPhrasingContents(
            block.zoneState?.content.ops ?? [],
          ),
        }
        return this.transformParentBlock(
          block,
          () => ({
            type: 'listItem',
            children: [],
            ...(block.type === BlockType.TODO
              ? { checked: Boolean(block.snapshot.done) }
              : null),
            ...(block.type === BlockType.ORDERED
              ? {
                  data: {
                    seq: /[0-9]+/.test(block.snapshot.seq)
                      ? Number(block.snapshot.seq)
                      : 'auto',
                  },
                }
              : null),
          }),
          nodes => [
            paragraph,
            ...mergeListItems(nodes).filter(isListItemContent),
          ],
        )
      }
      case BlockType.TEXT:
      case BlockType.HEADING7:
      case BlockType.HEADING8:
      case BlockType.HEADING9: {
        const paragraph: mdast.Paragraph = {
          type: 'paragraph',
          children: transformOperationsToPhrasingContents(
            block.zoneState?.content.ops ?? [],
          ),
        }
        return paragraph
      }
      case BlockType.IMAGE: {
        const imageBlockToImage = (block: ImageBlock) => {
          const { caption, name, token } = block.snapshot.image
          const image: mdast.Image = {
            type: 'image',
            url: '',
            alt: evaluateAlt(caption),
            data: {
              name,
              token,
              fetchSources: () => fetchImageSources(block),
            },
          }
          return image
        }

        const image: mdast.Image = imageBlockToImage(block)

        this.images.push(image)

        return this.normalizeImage(image)
      }
      case BlockType.WHITEBOARD: {
        if (!this.options.whiteboard) return null

        const whiteboardToImage = (whiteboard: Whiteboard): mdast.Image => {
          const image: mdast.Image = {
            type: 'image',
            url: '',
            alt: evaluateAlt(whiteboard.snapshot.caption),
            data: {
              fetchBlob: async () => {
                const imageData = await whiteboardToImageData(whiteboard)
                if (!imageData) return null

                return await imageDataToBlob(imageData)
              },
            },
          }
          return image
        }

        const image: mdast.Image = whiteboardToImage(block)

        this.images.push(image)

        return this.normalizeImage(image)
      }
      case BlockType.TABLE: {
        return this.transformParentBlock(
          block,
          () => ({ type: 'table', children: [] }),
          nodes =>
            chunk(
              nodes.filter(isTableCell),
              block.snapshot.columns_id.length,
            ).map(tableCells => ({
              type: 'tableRow',
              children: tableCells,
            })),
        )
      }
      case BlockType.CELL: {
        return this.transformParentBlock(
          block,
          () => ({ type: 'tableCell', children: [] }),
          nodes =>
            nodes
              .map(node => (node.type === 'paragraph' ? node.children : node))
              .flat(1)
              .filter(isPhrasingContent),
        )
      }
      default:
        return null
    }
  }

  transform<T extends Blocks>(block: T): TransformResult<Mutate<T>> {
    const node = this._transform(block) as Mutate<T>

    const result: TransformResult<Mutate<T>> = {
      root: node,
      images: this.images,
    }

    this.parent = null
    this.images = []

    return result
  }
}

export class Docx {
  static stringify(root: mdast.Root) {
    return toMarkdown(root, {
      extensions: [
        gfmStrikethroughToMarkdown(),
        gfmTaskListItemToMarkdown(),
        gfmTableToMarkdown(),
        mathToMarkdown({
          singleDollarTextMath: false,
        }),
      ],
    })
  }

  get rootBlock() {
    if (!PageMain) {
      return null
    }

    return PageMain.blockManager.model.rootBlockModel
  }

  get language() {
    return User?.language === 'zh' ? 'zh' : 'en'
  }

  get pageTitle() {
    if (!this.rootBlock || !this.rootBlock.zoneState) return null

    return this.rootBlock.zoneState.allText.slice(0, -1)
  }

  isReady() {
    return (
      !!this.rootBlock &&
      this.rootBlock.children.every(block => block.snapshot.type !== 'pending')
    )
  }

  intoMarkdownAST(
    transformerOptions?: TransformerOptions,
  ): TransformResult<mdast.Root> {
    if (!this.rootBlock) {
      return { root: { type: 'root', children: [] }, images: [] }
    }

    const transformer = new Transformer(transformerOptions)

    return transformer.transform(this.rootBlock)
  }
}

export const docx = new Docx()
