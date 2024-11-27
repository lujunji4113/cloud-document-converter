import i18next from 'i18next'
import { Docx, docx, Toast } from '@dolphin/lark'
import { generatePublicUrl, makePublicUrlEffective } from '@dolphin/lark/image'
import { isDefined } from '@dolphin/common'
import { en, zh } from '../common/i18n'
import { confirm } from '../common/notification'

const enum TranslationKey {
  FAILED_TO_COPY_IMAGES = 'failed_to_copy_images',
  UNKNOWN_ERROR = 'unknown_error',
  CONTENT_LOADING = 'content_loading',
  NOT_SUPPORT = 'not_support',
}

i18next.init({
  lng: docx.language,
  resources: {
    en: {
      translation: {
        [TranslationKey.FAILED_TO_COPY_IMAGES]: 'Failed to copy images',
        [TranslationKey.UNKNOWN_ERROR]: 'Unknown error during download',
        [TranslationKey.CONTENT_LOADING]:
          'Part of the content is still loading and cannot be copied at the moment. Please wait for loading to complete and retry',
        [TranslationKey.NOT_SUPPORT]:
          'This is not a lark document page and cannot be copied as Markdown',
      },
      ...en,
    },
    zh: {
      translation: {
        [TranslationKey.FAILED_TO_COPY_IMAGES]: '复制图片失败',
        [TranslationKey.UNKNOWN_ERROR]: '下载过程中出现未知错误',
        [TranslationKey.CONTENT_LOADING]:
          '部分内容仍在加载中，暂时无法复制。请等待加载完成后重试',
        [TranslationKey.NOT_SUPPORT]:
          '这不是一个飞书文档页面，无法复制为 Markdown',
      },
      ...zh,
    },
  },
})

const main = async () => {
  if (!docx.rootBlock) {
    Toast.warning({ content: i18next.t(TranslationKey.NOT_SUPPORT) })

    return
  }

  if (!docx.isReady()) {
    Toast.warning({
      content: i18next.t(TranslationKey.CONTENT_LOADING),
    })

    return
  }

  const { root, images } = docx.intoMarkdownAST()

  const tokens = images
    .map(image => {
      if (!image.data || !image.data.token) return null

      const { token } = image.data
      const publicUrl = generatePublicUrl(token)
      const code = new URL(publicUrl).searchParams.get('code')
      if (!code) return null

      image.url = publicUrl

      return [token, code]
    })
    .filter(isDefined)

  const markdown = Docx.stringify(root)

  if (!window.document.hasFocus()) {
    const confirmed = await confirm()
    if (!confirmed) {
      return
    }
  }

  navigator.clipboard.write([
    new ClipboardItem({
      'text/plain': new Blob([markdown], { type: 'text/plain' }),
    }),
  ])

  if (tokens.length > 0) {
    const isSuccess = await makePublicUrlEffective(Object.fromEntries(tokens))
    if (!isSuccess) {
      Toast.error({
        content: i18next.t(TranslationKey.FAILED_TO_COPY_IMAGES),
      })
    }
  }
}

main().catch(() => {
  Toast.error({
    content: i18next.t(TranslationKey.UNKNOWN_ERROR),
  })
})
