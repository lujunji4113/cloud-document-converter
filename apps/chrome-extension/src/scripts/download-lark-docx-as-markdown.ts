import i18next from 'i18next'
import { Toast, Docx, docx, mdast } from '@dolphin/lark'
import { fileSave, supported } from 'browser-fs-access'
import { fs } from '@zip.js/zip.js'
import normalizeFileName from 'filenamify/browser'
import { cluster } from 'radash'
import { en, zh } from '../common/i18n'
import { confirm } from '../common/notification'
import { legacyFileSave } from '../common/legacy'

const DOWNLOAD_ABORTED = 'Download aborted'

const enum TranslationKey {
  CONTENT_LOADING = 'content_loading',
  UNKNOWN_ERROR = 'unknown_error',
  NOT_SUPPORT = 'not_support',
  DOWNLOADING_FILE = 'downloading_file',
  FAILED_TO_DOWNLOAD = 'failed_to_download',
  DOWNLOAD_PROGRESS = 'download_progress',
  DOWNLOAD_COMPLETE = 'download_complete',
  STILL_SAVING = 'still_saving',
  IMAGE = 'image',
  FILE = 'file',
  CANCEL = 'cancel',
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
        [TranslationKey.DOWNLOADING_FILE]:
          'Download {{name}} in: {{progress}}% (please do not refresh or close the page)',
        [TranslationKey.FAILED_TO_DOWNLOAD]: 'Failed to download {{name}}',
        [TranslationKey.STILL_SAVING]:
          'Still saving (please do not refresh or close the page)',
        [TranslationKey.DOWNLOAD_PROGRESS]:
          '{{name}} download progress: {{progress}} %',
        [TranslationKey.DOWNLOAD_COMPLETE]: 'Download complete',
        [TranslationKey.IMAGE]: 'Image',
        [TranslationKey.FILE]: 'File',
        [TranslationKey.CANCEL]: 'Cancel',
      },
      ...en,
    },
    zh: {
      translation: {
        [TranslationKey.CONTENT_LOADING]:
          '部分内容仍在加载中，暂时无法下载。请等待加载完成后重试',
        [TranslationKey.UNKNOWN_ERROR]: '下载过程中出现未知错误',
        [TranslationKey.NOT_SUPPORT]:
          '这不是一个飞书文档页面，无法下载为 Markdown',
        [TranslationKey.DOWNLOADING_FILE]:
          '下载 {{name}} 中：{{progress}}%（请不要刷新或关闭页面）',
        [TranslationKey.FAILED_TO_DOWNLOAD]: '下载 {{name}} 失败',
        [TranslationKey.STILL_SAVING]: '仍在保存中（请不要刷新或关闭页面）',
        [TranslationKey.DOWNLOAD_PROGRESS]: '{{name}}下载进度：{{progress}}%',
        [TranslationKey.DOWNLOAD_COMPLETE]: '下载完成',
        [TranslationKey.IMAGE]: '图片',
        [TranslationKey.FILE]: '文件',
        [TranslationKey.CANCEL]: '取消',
      },
      ...zh,
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

interface ProgressOptions {
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

async function toBlob(
  response: Response,
  options: ProgressOptions = {},
): Promise<Blob> {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('This request has no response body.')
  }

  const { onProgress, onComplete } = options

  const reader = response.body.getReader()
  const contentLength = parseInt(
    response.headers.get('Content-Length') ?? '0',
    10,
  )

  let receivedLength = 0
  const chunks = []

  let _done = false
  while (!_done) {
    const { done, value } = await reader.read()

    _done = done

    if (done) {
      onComplete?.()

      break
    }

    chunks.push(value)
    receivedLength += value.length

    onProgress?.(receivedLength / contentLength)
  }

  const blob = new Blob(chunks)

  return blob
}

const downloadImage = async (
  image: mdast.Image,
): Promise<DownloadResult | null> => {
  if (!image.data) return null

  const { name: originName, fetchSources, fetchBlob } = image.data

  try {
    // whiteboard
    if (fetchBlob) {
      const content = await fetchBlob()
      if (!content) return null

      const name = uniqueFileName('diagram.png')
      const filename = `images/${name}`

      image.url = filename

      return {
        filename,
        content,
      }
    }

    // image
    if (originName && fetchSources) {
      const sources = await fetchSources()

      if (!sources) return null

      const name = uniqueFileName(originName)
      const filename = `images/${name}`

      const { src } = sources
      const response = await fetch(src)
      try {
        const blob = await toBlob(response, {
          onProgress: progress => {
            Toast.loading({
              content: i18next.t(TranslationKey.DOWNLOADING_FILE, {
                name,
                progress: Math.floor(progress * 100),
              }),
              keepAlive: true,
              key: filename,
            })
          },
        })

        image.url = filename

        return {
          filename,
          content: blob,
        }
      } finally {
        Toast.remove(filename)
      }
    }

    return null
  } catch {
    Toast.error({
      content: i18next.t(TranslationKey.FAILED_TO_DOWNLOAD, {
        name: originName,
      }),
    })

    return null
  }
}

const downloadFile = async (
  file: mdast.Link,
): Promise<DownloadResult | null> => {
  if (!file.data || !file.data.name || !file.data.fetchFile) return null

  const { name, fetchFile } = file.data

  try {
    const filename = `files/${uniqueFileName(name)}`

    const controller = new AbortController()

    const cancel = () => {
      controller.abort()
    }

    const response = await fetchFile({ signal: controller.signal })
    try {
      const blob = await toBlob(response, {
        onProgress: progress => {
          Toast.loading({
            content: i18next.t(TranslationKey.DOWNLOADING_FILE, {
              name,
              progress: Math.floor(progress * 100),
            }),
            keepAlive: true,
            key: filename,
            actionText: i18next.t(TranslationKey.CANCEL),
            onActionClick: cancel,
          })
        },
      })

      file.url = filename

      return {
        filename,
        content: blob,
      }
    } finally {
      Toast.remove(filename)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null
    }

    Toast.error({
      content: i18next.t(TranslationKey.FAILED_TO_DOWNLOAD, {
        name,
      }),
    })

    return null
  }
}

interface DownloadResult {
  filename: string
  content: Blob
}

type File = mdast.Image | mdast.Link

const downloadFiles = async (
  files: File[],
  options: ProgressOptions & {
    /**
     * @default 3
     */
    batchSize?: number
  } = {},
): Promise<DownloadResult[]> => {
  const { onProgress, onComplete, batchSize = 3 } = options

  const results: DownloadResult[] = []

  const totalSize = files.length
  let downloadedSize = 0

  for await (const batch of cluster(files, batchSize)) {
    await Promise.allSettled(
      batch.map(async file => {
        try {
          const result =
            file.type === 'image'
              ? await downloadImage(file)
              : await downloadFile(file)

          if (result) {
            results.push(result)
          }
        } finally {
          downloadedSize++

          onProgress?.(downloadedSize / totalSize)
        }
      }),
    )
  }

  onComplete?.()

  return results
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

  const { root, images, files } = docx.intoMarkdownAST({
    whiteboard: true,
    file: true,
  })

  const recommendName = docx.pageTitle
    ? normalizeFileName(docx.pageTitle.slice(0, 100))
    : 'doc'
  const isZip = images.length > 0 || files.length > 0
  const ext = isZip ? '.zip' : '.md'
  const filename = `${recommendName}${ext}`

  const toBlob = async () => {
    Toast.loading({
      content: i18next.t(TranslationKey.STILL_SAVING),
      keepAlive: true,
      key: ToastKey.DOWNLOADING,
    })

    const singleFileContent = () => {
      const markdown = Docx.stringify(root)

      return new Blob([markdown])
    }

    const zipFileContent = async () => {
      const zipFs = new fs.FS()

      const results = await Promise.all([
        downloadFiles(images, {
          batchSize: 15,
          onProgress: progress => {
            Toast.loading({
              content: i18next.t(TranslationKey.DOWNLOAD_PROGRESS, {
                name: i18next.t(TranslationKey.IMAGE),
                progress: Math.floor(progress * 100),
              }),
              keepAlive: true,
              key: TranslationKey.IMAGE,
            })
          },
          onComplete: () => {
            Toast.remove(TranslationKey.IMAGE)
          },
        }),
        downloadFiles(files, {
          onProgress: progress => {
            Toast.loading({
              content: i18next.t(TranslationKey.DOWNLOAD_PROGRESS, {
                name: i18next.t(TranslationKey.FILE),
                progress: Math.floor(progress * 100),
              }),
              keepAlive: true,
              key: TranslationKey.FILE,
            })
          },
          onComplete: () => {
            Toast.remove(TranslationKey.FILE)
          },
        }),
      ])
      results.flat(1).forEach(({ filename, content }) => {
        zipFs.addBlob(filename, content)
      })

      const markdown = Docx.stringify(root)

      zipFs.addText(`${recommendName}.md`, markdown)

      return await zipFs.exportBlob()
    }

    const content = isZip ? await zipFileContent() : singleFileContent()

    return content
  }

  if (supported) {
    if (!navigator.userActivation.isActive) {
      const confirmed = await confirm()
      if (!confirmed) {
        throw new Error(DOWNLOAD_ABORTED)
      }
    }

    await fileSave(toBlob(), {
      fileName: filename,
      extensions: [ext],
    })
  } else {
    const blob = await toBlob()

    legacyFileSave(blob, {
      fileName: filename,
    })
  }
}

main()
  .then(() => {
    Toast.success({
      content: i18next.t(TranslationKey.DOWNLOAD_COMPLETE),
    })
  })
  .catch((error: DOMException | TypeError | Error) => {
    if (error.name !== 'AbortError' && error.message !== DOWNLOAD_ABORTED) {
      Toast.error({ content: String(error) })
    }
  })
  .finally(() => {
    Toast.remove(ToastKey.DOWNLOADING)
  })
