import { encode } from 'js-base64'
import { encodeToken } from './encode/encode-token'

const isNewHost = () =>
  ['docs.bytedance.net'].every(
    hostname => -1 === hostname.indexOf(location.hostname),
  )

const evaluateBaseUrl = () => {
  if (isNewHost()) {
    const apiHost = window.local?.apiHost ?? 'https://'.concat(location.host)
    return apiHost.concat('/space')
  }

  return window.docsLocation?.origin ?? location.origin
}

const generateApiUrl = (url: string) => evaluateBaseUrl().concat(url)

export const generatePublicUrl = (token: string): string => {
  const code = encode(encodeToken(token), true)
  return generateApiUrl(
    '/api/box/stream/download/asynccode/?code='.concat(code),
  )
}

const csrfToken = () => {
  const t = document.cookie.match(
    new RegExp('(?:^|;)\\s*'.concat('_csrf_token', '=([^;]+)')),
  )
  return window.decodeURIComponent(t ? t[1] : '')
}

export const makePublicUrlEffective = async (
  tokens: Record<string, string>,
): Promise<boolean> => {
  try {
    const response = await fetch(
      generateApiUrl('/api/docx/resources/copy_out'),
      {
        method: 'POST',
        headers: {
          'X-Csrftoken': csrfToken(),
        },
        body: JSON.stringify({
          tokens,
        }),
      },
    )
    const jsonData = await response.json()

    if (jsonData.code !== 0) return false

    return true
  } catch {
    return false
  }
}
