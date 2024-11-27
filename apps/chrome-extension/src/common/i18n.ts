import { ResourceLanguage } from 'i18next'

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
