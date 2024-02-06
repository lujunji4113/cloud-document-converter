chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "download_as_markdown",
    title: chrome.i18n.getMessage("download_as_markdown"),
    documentUrlPatterns: [
      "https://*.feishu.cn/*",
      "https://*.feishu.net/*",
      "https://*.larksuite.com/*",
      "https://*.feishu-pre.net/*",
      "https://*.larkoffice.com/*",
    ],
  });
});

chrome.contextMenus.onClicked.addListener((_, tab) => {
  if (tab?.id) {
    chrome.scripting.executeScript({
      files: ["scripts/lark.js"],
      target: { tabId: tab.id },
      world: "MAIN",
    });
  }
});
