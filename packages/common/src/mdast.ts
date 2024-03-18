import { toMarkdown } from 'mdast-util-to-markdown'
import { gfmStrikethroughToMarkdown } from 'mdast-util-gfm-strikethrough'
import { gfmTaskListItemToMarkdown } from 'mdast-util-gfm-task-list-item'
import { gfmTableToMarkdown } from 'mdast-util-gfm-table'
import type * as mdast from 'mdast'

export const stringify = (root: mdast.Root) =>
  toMarkdown(root, {
    extensions: [
      gfmStrikethroughToMarkdown(),
      gfmTaskListItemToMarkdown(),
      gfmTableToMarkdown(),
    ],
  })

export const isParent = (node: mdast.Node): node is mdast.Parent =>
  'children' in node && Array.isArray(node.children)

export const isRootContent = (node: mdast.Nodes): node is mdast.RootContent =>
  !isRoot(node)

export const isBlockContent = (node: mdast.Nodes): node is mdast.BlockContent =>
  node.type === 'blockquote' ||
  node.type === 'code' ||
  node.type === 'heading' ||
  node.type === 'html' ||
  node.type === 'list' ||
  node.type === 'paragraph' ||
  node.type === 'table' ||
  node.type === 'thematicBreak'

export const isDefinitionContent = (
  node: mdast.Nodes,
): node is mdast.DefinitionContent =>
  node.type === 'definition' || node.type === 'footnoteDefinition'

export const isBlockquoteContent = (
  node: mdast.Nodes,
): node is mdast.BlockContent | mdast.DefinitionContent =>
  isBlockContent(node) || isDefinitionContent(node)

export const isPhrasingContent = (
  node: mdast.Nodes,
): node is mdast.PhrasingContent =>
  node.type === 'break' ||
  node.type === 'delete' ||
  node.type === 'emphasis' ||
  node.type === 'footnoteReference' ||
  node.type === 'html' ||
  node.type === 'image' ||
  node.type === 'imageReference' ||
  node.type === 'inlineCode' ||
  node.type === 'link' ||
  node.type === 'linkReference' ||
  node.type === 'strong' ||
  node.type === 'text'

export const isRoot = (node: mdast.Nodes): node is mdast.Root =>
  node.type === 'root'

export const isTableCell = (node: mdast.Nodes): node is mdast.TableCell =>
  node.type === 'tableCell'
