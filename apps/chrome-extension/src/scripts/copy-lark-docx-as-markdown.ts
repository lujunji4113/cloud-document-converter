import i18next from "i18next";
import { docx, Toast } from "@dolphin/lark";
import { generatePublicUrl, makePublicUrlEffective } from "@dolphin/lark/image";
import { isDefined, stringify } from "@dolphin/common";

enum TranslationKey {
  FAILED_TO_COPY_IMAGES = "failed_to_copy_images",
  UNKNOWN_ERROR = "unknown_error",
}

i18next.init({
  lng: docx.language,
  resources: {
    en: {
      translations: {
        [TranslationKey.FAILED_TO_COPY_IMAGES]: "Failed to copy images",
        [TranslationKey.UNKNOWN_ERROR]: "Unknown error during download",
      },
    },
    zh: {
      translations: {
        [TranslationKey.FAILED_TO_COPY_IMAGES]: "复制图片失败",
        [TranslationKey.UNKNOWN_ERROR]: "下载过程中出现未知错误",
      },
    },
  },
});

const main = async () => {
  const { root, images } = docx.intoMarkdownAST();

  const tokens = images
    .map((image) => {
      if (!image.data) return null;

      const { token } = image.data;
      const publicUrl = generatePublicUrl(token);
      const code = new URL(publicUrl).searchParams.get("code");
      if (!code) return null;

      image.url = publicUrl;

      return [token, code];
    })
    .filter(isDefined);

  const isSuccess = await makePublicUrlEffective(Object.fromEntries(tokens));
  if (!isSuccess) {
    Toast.error({
      content: i18next.t(TranslationKey.FAILED_TO_COPY_IMAGES),
    });
  }

  const markdown = stringify(root);

  navigator.clipboard.write([
    new ClipboardItem({
      "text/plain": new Blob([markdown], { type: "text/plain" }),
    }),
  ]);
};

main().catch(() => {
  Toast.error({
    content: i18next.t(TranslationKey.UNKNOWN_ERROR),
  });
});
