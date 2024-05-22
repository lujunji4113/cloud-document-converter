import { Toast } from '@dolphin/lark/env'
import i18next, { ResourceLanguage } from 'i18next'

export enum Namespace {
  COMMON = 'common',
}

export enum CommonTranslationKey {
  CONTINUE = 'continue',
  CONFIRM_TEXT = 'confirm_text',
}

export const en: ResourceLanguage = {
  common: {
    [CommonTranslationKey.CONTINUE]: 'Please click Confirm to continue',
    [CommonTranslationKey.CONFIRM_TEXT]: 'Confirm',
  },
}

export const zh: ResourceLanguage = {
  common: {
    [CommonTranslationKey.CONTINUE]: '请点击确认以继续',
    [CommonTranslationKey.CONFIRM_TEXT]: '确认',
  },
}

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
