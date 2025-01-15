import { ResourceLanguage } from 'i18next'

export enum Namespace {
  COMMON = 'common',
}

export enum CommonTranslationKey {
  CONTINUE = 'continue',
  CONFIRM_TEXT = 'confirm_text',
  CONFIRM_REPORT_BUG = 'confirm_report_bug',
  ISSUE_TEMPLATE_BODY = 'issue_template_body',
}

export const en: ResourceLanguage = {
  common: {
    [CommonTranslationKey.CONTINUE]: 'Please click Confirm to continue',
    [CommonTranslationKey.CONFIRM_TEXT]: 'Confirm',
    [CommonTranslationKey.CONFIRM_REPORT_BUG]: 'Report Bug',
    [CommonTranslationKey.ISSUE_TEMPLATE_BODY]: `
**Description**

A clear and concise description of what the bug is.

**Recording**

A GIF or video showing the issue happening. (If you don't include this, there's a very good chance your issue will be closed, because it's much too hard to figure out exactly what is going wrong, and it makes maintenance much harder.)

**Example Document**

A link to a Lark Document where the error can be reproduced. (Please ensure that the documentation is publicly accessible.)

**Steps**

To reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expectation**

A clear and concise description of what you expected to happen.

**Environment**

- Extension Version: {{version}}
- Browser: [e.g. Chrome, Edge]

**Context**

Add any other context about the problem here. (The fastest way to have an issue fixed is to create a pull request with working, tested code and we'll help merge it.)

**Error Information**
\`\`\`json
{{errorInfo}}
\`\`\`
`,
  },
}

export const zh: ResourceLanguage = {
  common: {
    [CommonTranslationKey.CONTINUE]: '请点击确认以继续',
    [CommonTranslationKey.CONFIRM_TEXT]: '确认',
    [CommonTranslationKey.CONFIRM_REPORT_BUG]: '报告错误',
    [CommonTranslationKey.ISSUE_TEMPLATE_BODY]: `
**问题描述**

清晰简洁地描述这个 Bug 是什么。

**录屏**

展示问题发生的 GIF 或视频。（如果不包含这个，你的问题很可能会被关闭，因为很难准确了解问题出在哪里，这会使维护变得更加困难。）

**示例文档**

一个可以重现错误的飞书文档链接。（请确保文档是公开可访问的。）

**复现步骤**

重现该行为的步骤：

1. 前往 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**期望行为**

清晰简洁地描述你期望发生的情况。

**环境信息**

- 扩展版本：{{version}}
- 浏览器：[例如 Chrome、Edge]

**上下文**

在此添加关于该问题的任何其他上下文。（修复问题最快的方法是创建一个包含已经过测试的可用代码的 Pull Request，我们会协助合并。）

**错误信息**
\`\`\`json
{{errorInfo}}
\`\`\`
`,
  },
}
