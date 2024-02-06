interface ToastOptions {
  content: string;
  key?: string;
  keepAlive?: boolean;
}

interface Window {
  PageMain?: {
    blockManager: {
      model: {
        rootBlockModel: import("./lark").Root;
      };
    };
  };
  Toast?: {
    error: (options: ToastOptions) => void;
    warning: (options: ToastOptions) => void;
    info: (options: ToastOptions) => void;
    loading: (options: ToastOptions) => void;
    success: (options: ToastOptions) => void;
    remove: (key: string) => void;
  };
  User?: {
    language: string;
  };
}
