import { Toast } from '@dolphin/lark/env'
import i18next from 'i18next'
import { CommonTranslationKey, Namespace } from './i18n'

export const confirm = (): Promise<boolean> => {
  return new Promise<boolean>(resolve => {
    let confirmed = false

    Toast.info({
      closable: true,
      content: i18next.t(CommonTranslationKey.CONTINUE, {
        ns: Namespace.COMMON,
      }),
      actionText: i18next.t(CommonTranslationKey.CONFIRM_TEXT, {
        ns: Namespace.COMMON,
      }),
      onActionClick: () => {
        confirmed = true
      },
      onClose: () => {
        resolve(confirmed)
      },
    })
  })
}
