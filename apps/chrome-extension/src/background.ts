/// <reference types="chrome-types" />

enum MenuItemId {
  DOWNLOAD_DOCX_AS_MARKDOWN = "download_docx_as_markdown",
  COPY_DOCX_AS_MARKDOWN = "copy_docx_as_markdown",
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MenuItemId.DOWNLOAD_DOCX_AS_MARKDOWN,
    title: chrome.i18n.getMessage("download_as_markdown"),
    documentUrlPatterns: [
      "https://*.feishu.cn/*",
      "https://*.feishu.net/*",
      "https://*.larksuite.com/*",
      "https://*.feishu-pre.net/*",
      "https://*.larkoffice.com/*",
    ],
  });

  chrome.contextMenus.create({
    id: MenuItemId.COPY_DOCX_AS_MARKDOWN,
    title: chrome.i18n.getMessage("copy_as_markdown"),
    documentUrlPatterns: [
      "https://*.feishu.cn/*",
      "https://*.feishu.net/*",
      "https://*.larksuite.com/*",
      "https://*.feishu-pre.net/*",
      "https://*.larkoffice.com/*",
    ],
  });
});

chrome.contextMenus.onClicked.addListener(({ menuItemId }, tab) => {
  if (!tab?.id) {
    return;
  }

  switch (menuItemId) {
    case MenuItemId.DOWNLOAD_DOCX_AS_MARKDOWN:
      chrome.scripting.executeScript({
        files: ["bundles/scripts/download-lark-docx-as-markdown.js"],
        target: { tabId: tab.id },
        world: "MAIN",
      });
      break;
    case MenuItemId.COPY_DOCX_AS_MARKDOWN:
      chrome.scripting.executeScript({
        files: ["bundles/scripts/copy-lark-docx-as-markdown.js"],
        target: { tabId: tab.id },
        world: "MAIN",
      });
      break;
    default:
      break;
  }
});
