import { Flag, Message } from './common/message'

enum MenuItemId {
  DOWNLOAD_DOCX_AS_MARKDOWN = 'download_docx_as_markdown',
  COPY_DOCX_AS_MARKDOWN = 'copy_docx_as_markdown',
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MenuItemId.DOWNLOAD_DOCX_AS_MARKDOWN,
    title: chrome.i18n.getMessage('download_docx_as_markdown'),
    documentUrlPatterns: [
      'https://*.feishu.cn/*',
      'https://*.feishu.net/*',
      'https://*.larksuite.com/*',
      'https://*.feishu-pre.net/*',
      'https://*.larkoffice.com/*',
    ],
    contexts: ['page', 'editable'],
  })

  chrome.contextMenus.create({
    id: MenuItemId.COPY_DOCX_AS_MARKDOWN,
    title: chrome.i18n.getMessage('copy_docx_as_markdown'),
    documentUrlPatterns: [
      'https://*.feishu.cn/*',
      'https://*.feishu.net/*',
      'https://*.larksuite.com/*',
      'https://*.feishu-pre.net/*',
      'https://*.larkoffice.com/*',
    ],
    contexts: ['page', 'editable'],
  })
})

const executeScriptByFlag = async (flag: string | number, tabId: number) => {
  switch (flag) {
    case MenuItemId.DOWNLOAD_DOCX_AS_MARKDOWN:
      await chrome.scripting.executeScript({
        files: ['bundles/scripts/download-lark-docx-as-markdown.js'],
        target: { tabId },
        world: 'MAIN',
      })
      break
    case MenuItemId.COPY_DOCX_AS_MARKDOWN:
      await chrome.scripting.executeScript({
        files: ['bundles/scripts/copy-lark-docx-as-markdown.js'],
        target: { tabId },
        world: 'MAIN',
      })
      break
    default:
      break
  }
}

chrome.contextMenus.onClicked.addListener(({ menuItemId }, tab) => {
  if (tab?.id !== undefined) {
    executeScriptByFlag(menuItemId, tab.id)
  }
})

chrome.runtime.onMessage.addListener((_message, sender, sendResponse) => {
  const message = _message as Message

  if (
    message.flag === Flag.ExecuteCopyScript ||
    message.flag === Flag.ExecuteDownloadScript
  ) {
    const executeScript = async () => {
      const activeTabs = await chrome.tabs.query({
        currentWindow: true,
        active: true,
      })

      const activeTabId = activeTabs.at(0)?.id

      if (activeTabs.length === 1 && activeTabId !== undefined) {
        await executeScriptByFlag(message.flag, activeTabId)
      }
    }

    executeScript().then(sendResponse)

    return true
  }
})
