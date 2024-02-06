export interface User {
  language: string;
}

interface ToastOptions {
  content: string;
  key?: string;
  keepAlive?: boolean;
}

export interface Toast {
  error: (options: ToastOptions) => void;
  warning: (options: ToastOptions) => void;
  info: (options: ToastOptions) => void;
  loading: (options: ToastOptions) => void;
  success: (options: ToastOptions) => void;
  remove: (key: string) => void;
}

export interface PageMain {
  blockManager: {
    model: {
      rootBlockModel: import("./lark").Root;
    };
  };
}

export const User = window.User;

export const Toast = window.Toast;

export const PageMain = window.PageMain;
