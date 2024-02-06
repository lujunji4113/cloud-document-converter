export const error = (
  content: string,
  options: Omit<ToastOptions, "content"> = {}
) => {
  window.Toast?.error({ content, ...options });
};

export const warn = (
  content: string,
  options: Omit<ToastOptions, "content"> = {}
) => {
  window.Toast?.warning({ content, ...options });
};

export const info = (
  content: string,
  options: Omit<ToastOptions, "content"> = {}
) => {
  window.Toast?.info({ content, ...options });
};

export const loading = (
  content: string,
  options: Omit<ToastOptions, "content"> = {}
) => {
  window.Toast?.loading({ content, ...options });
};

export const success = (
  content: string,
  options: Omit<ToastOptions, "content"> = {}
) => {
  window.Toast?.success({ content, ...options });
};

export const remove = (key: string) => {
  window.Toast?.remove(key);
};

export const Toast = {
  error,
  warn,
  info,
  loading,
  success,
  remove,
};
