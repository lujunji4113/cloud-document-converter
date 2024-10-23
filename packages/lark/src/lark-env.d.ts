interface Window {
  PageMain?: import('./env').PageMain
  Toast?: import('./env').Toast
  User?: import('./env').User
  docsLocation?: Location
  local?: {
    apiHost?: string
    driveStreamApiHost?: string
  }
  globalConfig?: {
    space_api?: string[]
    drive_api?: string[]
  }
}
