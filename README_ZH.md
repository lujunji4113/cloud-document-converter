<p align="center">
  <p align="center">
   <img width="150" height="150" src="apps/chrome-extension/design/logo.svg" alt="Logo">
  </p>
	<h1 align="center"><b>Cloud Document Converter</b></h1>
</p>

Cloud Document Converter 是一个浏览器扩展， 支持下载、复制飞书云文档为 Markdown。

[English](./README.md) · **简体中文**

# 安装

从 [Chrome 应用商店](https://chromewebstore.google.com/detail/cloud-document-converter/ehkomhhcinhikfddnmklbloahaakploh)、[Microsoft Edge 加载项](https://microsoftedge.microsoft.com/addons/detail/pcjebkebnehplnpkpnhipagefaffiopp) 和 [Firefox 附加组件](https://addons.mozilla.org/addon/cloud-document-converter) 安装 Cloud Document Converter。

# 功能

- 下载飞书云文档为 Markdown

- 复制飞书云文档为 Markdown

  > ❗注意: 通过这种方式生成的图像 URL 只有两个小时的访问时间。这意味着两小时后，将无法再访问图像资源。

# 兼容性

## 块级元素

| **飞书云文档**        | **支持情况** | **Markdown**                      |
| --------------------- | ------------ | --------------------------------- |
| 分割线                | ✔️           | Thematic Break                    |
| 标题 (一级至六级)     | ✔️           | ATX Headings (Level 1 to level 6) |
| 标题 (七级至九级)     | ✔️           | Paragraph                         |
| 代码块                | ✔️           | Code Block                        |
| 引用                  | ✔️           | Blockquote                        |
| 无序列表              | ✔️           | Bullet list                       |
| 有序列表              | ✔️           | Ordered list                      |
| 任务列表              | ✔️           | Task list                         |
| 表格                  | ✔️           | Table                             |
| 图片                  | ✔️           | Image                             |
| 公示                  | ✔️           | Math Block                        |
| 高亮块                | ❌           | Blockquote                        |
| 图表 (流程图、UML 图) | ❌           | Image（仅下载支持）               |
| 分栏                  | ❌           | _分栏内容会被扁平化_              |
| 多维表格              | 待定         |                                   |
| 群名片                | 待定         |                                   |
| 文件                  | ❌           | Link（仅下载支持）                |
| 内嵌网页              | ✔️           | HTML                              |
| 小组件                | 待定         |                                   |
| 思维笔记              | 待定         |                                   |
| 电子表格              | 待定         |                                   |

## 行内元素

| **飞书云文档** | **支持情况** | **Markdown** |
| -------------- | ------------ | ------------ |
| 加粗           | ✔️           | Bold         |
| 删除线         | ✔️           | Delete       |
| 倾斜           | ✔️           | Italic       |
| 行内代码       | ✔️           | Inline code  |
| 链接           | ✔️           | Link         |
| 下划线         | 待定         |              |

## 其它

- 缩进和对齐：待定

- 字体颜色和背景色：待定

# 支持我

如果你喜欢这个项目，欢迎你请我喝杯咖啡！你的支持将帮助我继续改进和维护这个项目。

[请我喝咖啡 ☕](https://lujunji.vercel.app/about)

# 免责声明

本项目（以下简称“项目”）仅供参考和学习使用。作者尽力确保项目的准确性和可靠性，但不提供任何明示或暗示的保证，包括但不限于对项目的适销性、特定用途的适用性或无侵权的保证。

作者不对因使用本项目而产生的任何直接、间接、偶然、特殊、惩罚性或结果性损害承担任何责任，包括但不限于因使用、误用、或依赖项目中的信息而导致的利润损失、业务中断或数据丢失。

本项目中的所有内容均基于作者的个人见解和经验，不代表任何组织或公司的观点。

使用者应自行承担使用本项目所产生的一切风险。在任何情况下，作者均不对使用本项目而导致的任何损失或损害承担责任。
