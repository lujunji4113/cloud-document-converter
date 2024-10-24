const BASE_PATHNAME = '/api/box/stream/download/all/'

/**
 * @description Resolve file download link.
 */
export const resolveFileDownloadUrl = ({
  token,
  recordId,
}: {
  token: string
  recordId: string
}): string => {
  const pathname = `/space${BASE_PATHNAME}${token}`
  const hostname = window.globalConfig?.drive_api?.[0]
  const url = new URL('https://' + hostname + pathname)
  url.searchParams.set('mount_node_token', recordId)
  url.searchParams.set('mount_point', 'docx_file')
  url.searchParams.set(
    'synced_block_host_token',
    window.location.pathname.split('/').at(-1) ?? '',
  )
  url.searchParams.set('synced_block_host_type', '22')
  return url.toString()
}
