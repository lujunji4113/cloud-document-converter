import { FirstFileSaveOptions } from 'browser-fs-access'

export const legacyFileSave = (
  blob: Blob,
  options: FirstFileSaveOptions = {},
) => {
  const { fileName = 'Untitled' } = options

  const a = document.createElement('a')

  a.download = fileName
  a.href = URL.createObjectURL(blob)

  a.addEventListener(
    'click',
    event => {
      // click events may be intercepted by websites and block the browser's default behavior
      event.stopPropagation()

      // `setTimeout()` due to
      // https://github.com/LLK/scratch-gui/issues/1783#issuecomment-426286393
      setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000)
    },
    true,
  )

  a.click()
}
