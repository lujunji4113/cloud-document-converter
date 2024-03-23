import i18next from 'i18next'
import { Toast, Docx, docx } from '@dolphin/lark'
import { fileSave } from 'browser-fs-access'
import { fs } from '@zip.js/zip.js'
import normalizeFileName from 'filenamify/browser'

const enum TranslationKey {
  CONTENT_LOADING = 'content_loading',
  UNKNOWN_ERROR = 'unknown_error',
  NOT_SUPPORT = 'not_support',
  DOWNLOADING_IMAGES = 'downloading_images',
  FAILED_TO_DOWNLOAD_IMAGE = 'failed_to_download_image',
  DOWNLOAD_COMPLETE = 'download_complete',
  STILL_SAVING = 'still_saving',
}

enum ToastKey {
  DOWNLOADING = 'downloading',
}

i18next.init({
  lng: docx.language,
  resources: {
    en: {
      translation: {
        [TranslationKey.CONTENT_LOADING]:
          'Part of the content is still loading and cannot be downloaded at the moment. Please wait for loading to complete and retry',
        [TranslationKey.UNKNOWN_ERROR]: 'Unknown error during download',
        [TranslationKey.NOT_SUPPORT]:
          'This is not a lark document page and cannot be downloaded as Markdown',
        [TranslationKey.DOWNLOADING_IMAGES]:
          'Download images progress: {{progress}}% (please do not refresh or close the page)',
        [TranslationKey.FAILED_TO_DOWNLOAD_IMAGE]:
          'Failed to download image {{name}}',
        [TranslationKey.STILL_SAVING]:
          'Still saving (please do not refresh or close the page)',
        [TranslationKey.DOWNLOAD_COMPLETE]: 'Download complete',
      },
    },
    zh: {
      translation: {
        [TranslationKey.CONTENT_LOADING]:
          '部分内容仍在加载中，暂时无法下载。请等待加载完成后重试',
        [TranslationKey.UNKNOWN_ERROR]: '下载过程中出现未知错误',
        [TranslationKey.NOT_SUPPORT]:
          '这不是一个飞书文档页面，无法下载为 Markdown',
        [TranslationKey.DOWNLOADING_IMAGES]:
          '下载图片进度：{{progress}}%（请不要刷新或关闭页面）',
        [TranslationKey.FAILED_TO_DOWNLOAD_IMAGE]: '下载图片 {{name}} 失败',
        [TranslationKey.STILL_SAVING]: '仍在保存中（请不要刷新或关闭页面）',
        [TranslationKey.DOWNLOAD_COMPLETE]: '下载完成',
      },
    },
  },
})

const usedNames: Set<string> = new Set()
const fileNameToPreId: Map<string, number> = new Map()
const uniqueFileName = (originFileName: string) => {
  if (usedNames.has(originFileName)) {
    const startDotIndex = originFileName.lastIndexOf('.')

    const preId = fileNameToPreId.get(originFileName) ?? 0
    const id = preId + 1
    fileNameToPreId.set(originFileName, id)

    const fileName =
      startDotIndex === -1
        ? originFileName.concat(`-${id}`)
        : originFileName
            .slice(0, startDotIndex)
            .concat(`-${id}`)
            .concat(originFileName.slice(startDotIndex))

    return fileName
  }

  usedNames.add(originFileName)

  return originFileName
}

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

  const { root, images } = docx.intoMarkdownAST({
    whiteboard: true,
  })
  const recommendName = normalizeFileName(
    docx.pageTitle ? normalizeFileName(docx.pageTitle.slice(0, 100)) : 'doc',
  )
  const hasImages = images.length > 0
  const ext = hasImages ? '.zip' : '.md'

  const toBlob = async () => {
    let blob: Blob

    const allItemsCount = images.length + 1

    const updateLoading = (content: string) => {
      Toast.loading({
        content,
        keepAlive: true,
        key: ToastKey.DOWNLOADING,
      })
    }

    if (!hasImages) {
      const markdown = Docx.stringify(root)

      blob = new Blob([markdown])
    } else {
      const zipFs = new fs.FS()

      updateLoading(
        i18next.t(TranslationKey.DOWNLOADING_IMAGES, {
          progress: '0',
        }),
      )

      let downloadedItemsCount = 0
      await Promise.allSettled(
        images.map(async image => {
          const evaluateImageFile = async (): Promise<{
            name: string
            content: Blob
          } | null> => {
            if (!image.data) return null

            const { name, fetchSources, fetchBlob } = image.data
            if (fetchBlob) {
              const content = await fetchBlob()
              if (!content) return null

              return {
                name: uniqueFileName('diagram.png'),
                content,
              }
            }

            if (name && fetchSources) {
              const sources = await fetchSources()
              if (!sources) return null

              const { src } = sources
              const response = await fetch(src)
              const blob = await response.blob()

              return {
                name: uniqueFileName(name),
                content: blob,
              }
            }

            return null
          }

          try {
            const imageFile = await evaluateImageFile()
            if (!imageFile) return

            const { name, content } = imageFile
            const imageFilePath = `images/${name}`
            image.url = imageFilePath

            zipFs.addBlob(imageFilePath, content)
          } catch {
            Toast.error({
              content: i18next.t(TranslationKey.FAILED_TO_DOWNLOAD_IMAGE, {
                name,
              }),
            })
          }

          updateLoading(
            i18next.t(TranslationKey.DOWNLOADING_IMAGES, {
              progress: Math.floor(
                (downloadedItemsCount++ / allItemsCount) * 100,
              ),
            }),
          )
        }),
      )

      const markdown = Docx.stringify(root)

      zipFs.addText(`${recommendName}.md`, markdown)

      blob = await zipFs.exportBlob()
    }

    updateLoading(i18next.t(TranslationKey.STILL_SAVING))

    return blob
  }

  await fileSave(toBlob(), {
    fileName: `${recommendName}${ext}`,
    extensions: [ext],
  })
}

main()
  .then(() => {
    Toast.success({
      content: i18next.t(TranslationKey.DOWNLOAD_COMPLETE),
    })
  })
  .catch((error: DOMException | TypeError) => {
    if (error.name !== 'AbortError') {
      Toast.error({ content: i18next.t(TranslationKey.UNKNOWN_ERROR) })
    }
  })
  .finally(() => {
    Toast.remove(ToastKey.DOWNLOADING)
  })
