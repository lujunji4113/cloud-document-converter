import i18next from 'i18next'
import { serializeError } from 'serialize-error'
import { CommonTranslationKey, Namespace } from './i18n'
import { version } from '../../package.json'

interface Issue {
  /**
   * Title
   */
  title: string
  /**
   * Description
   */
  body: string
  /**
   * Labels
   */
  labels?: Label[]
  /**
   * Issue template
   */
  template: string
}

enum Label {
  /**
   * Something isn't working
   */
  Bug = 'bug',
}

function generateIssueUrl(issue: Issue): string {
  const { title, body, labels = [], template } = issue

  const baseUrl =
    'https://github.com/whale4113/cloud-document-converter/issues/new'
  const params = new URLSearchParams({
    title: title,
    body: body,
    labels: labels.join(','),
    template,
  })

  return `${baseUrl}?${params.toString()}`
}

export const reportBug = (error: unknown) => {
  const url = generateIssueUrl({
    title: '',
    body: i18next.t(CommonTranslationKey.ISSUE_TEMPLATE_BODY, {
      version,
      errorInfo: JSON.stringify(serializeError(error), null, 2),
      ns: Namespace.COMMON,
      interpolation: { escapeValue: false },
    }),
    labels: [Label.Bug],
    template: 'bug.md',
  })

  window.open(url, '__blank')
}
