export const imageDataToBlob = (imageData: ImageData): Promise<Blob | null> => {
  const width = imageData.width
  const height = imageData.height
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return Promise.resolve(null)
  }

  ctx.putImageData(imageData, 0, 0)

  return new Promise(resolve => {
    canvas.toBlob(resolve)
  })
}
