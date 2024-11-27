export enum Flag {
  ExecuteCopyScript = 'copy_docx_as_markdown',
  ExecuteDownloadScript = 'download_docx_as_markdown',
}

interface ExecuteScriptMessage {
  flag: Flag.ExecuteCopyScript | Flag.ExecuteDownloadScript
}

export type Message = ExecuteScriptMessage

export enum StatusCode {
  Success,
  Error,
}

export interface Response {
  statusCode: StatusCode
  message?: string
}
