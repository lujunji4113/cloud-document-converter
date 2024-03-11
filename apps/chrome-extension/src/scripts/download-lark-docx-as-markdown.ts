import i18next from "i18next";
import { Toast, docx } from "@dolphin/lark";
import { stringify } from "@dolphin/common";
import { fileSave } from "browser-fs-access";
import { fs } from "@zip.js/zip.js";

enum TranslationKey {
  CONTENT_LOADING = "content_loading",
  FAILED_TO_DOWNLOAD = "failed_to_download",
  UNKNOWN_ERROR = "unknown_error",
  NOT_SUPPORT = "not_support",
  DOWNLOADING = "downloading",
  DOWNLOAD_COMPLETE = "download_complete",
}

i18next.init({
  lng: docx.language,
  resources: {
    resources: {
      en: {
        translation: {
          [TranslationKey.CONTENT_LOADING]:
            "Part of the content is still loading and cannot be downloaded at the moment. Please wait for loading to complete and retry",
          [TranslationKey.FAILED_TO_DOWNLOAD]: "Failed to download {{name}}",
          [TranslationKey.UNKNOWN_ERROR]: "Unknown error during download",
          [TranslationKey.NOT_SUPPORT]:
            "This is not a lark document page and cannot be downloaded as Markdown",
          [TranslationKey.DOWNLOADING]:
            "Download progress: {{progress}}% (please do not refresh or close the page)",
          [TranslationKey.DOWNLOAD_COMPLETE]: "Download complete",
        },
      },
      zh: {
        translation: {
          [TranslationKey.CONTENT_LOADING]:
            "部分内容仍在加载中，暂时无法下载。请等待加载完成后重试",
          [TranslationKey.FAILED_TO_DOWNLOAD]: "下载 {{name}} 失败",
          [TranslationKey.UNKNOWN_ERROR]: "下载过程中出现未知错误",
          [TranslationKey.NOT_SUPPORT]:
            "这不是一个飞书文档页面，无法下载为 Markdown",
          [TranslationKey.DOWNLOADING]:
            "下载进度：{{progress}}%（请不要刷新或关闭页面）",
          [TranslationKey.DOWNLOAD_COMPLETE]: "下载完成",
        },
      },
    },
  },
});

const main = async () => {
  try {
    if (!docx.rootBlock) {
      Toast.warning({ content: i18next.t(TranslationKey.NOT_SUPPORT) });

      return;
    }

    if (!docx.isReady()) {
      Toast.warning({
        content: i18next.t(TranslationKey.CONTENT_LOADING),
      });

      return;
    }

    Toast.loading({
      content: i18next.t(TranslationKey.DOWNLOADING, { progress: "0" }),
      keepAlive: true,
      key: "downloading",
    });

    let { root, images } = docx.intoMarkdownAST();
    const documentTitle = "doc";
    const hasImages = images.length > 0;
    const ext = hasImages ? ".zip" : ".md";

    const toBlob = async () => {
      let blob: Blob;

      let allItemsCount = images.length + 1;
      let downloadedItemsCount = 0;

      const updateLoading = () => {
        downloadedItemsCount++;
        Toast.loading({
          content: i18next.t(TranslationKey.DOWNLOADING, {
            progress: Math.floor((downloadedItemsCount / allItemsCount) * 100),
          }),
          keepAlive: true,
          key: "downloading",
        });
      };

      const closeLoading = () => {
        Toast.remove("downloading");
      };

      if (!hasImages) {
        const markdown = stringify(root);

        updateLoading();

        blob = new Blob([markdown]);
      } else {
        let zipFs = new fs.FS();

        await Promise.allSettled(
          images.map(async (image, index) => {
            if (image.data) {
              const { name, fetchSources } = image.data;
              let blobUrl = (await fetchSources())?.src;
              if (!blobUrl) {
                Toast.error({
                  content: i18next.t(TranslationKey.FAILED_TO_DOWNLOAD, {
                    name,
                  }),
                });

                return;
              }

              try {
                const imageFileName = `${index}-${name}`;
                const response = await fetch(blobUrl);
                zipFs.addBlob(imageFileName, await response.blob());
                image.url = imageFileName;
              } catch {
                Toast.error({
                  content: i18next.t(TranslationKey.FAILED_TO_DOWNLOAD, {
                    name,
                  }),
                });
              }
            }

            updateLoading();
          })
        );

        const markdown = stringify(root);

        updateLoading();

        zipFs.addText(`${documentTitle}.md`, markdown);

        blob = await zipFs.exportBlob();
      }

      closeLoading();

      Toast.success({ content: i18next.t(TranslationKey.DOWNLOAD_COMPLETE) });

      return blob;
    };

    await fileSave(toBlob(), {
      fileName: `${documentTitle}${ext}`,
      extensions: [ext],
    });
  } catch {
    Toast.remove("downloading");

    Toast.error({ content: i18next.t(TranslationKey.UNKNOWN_ERROR) });
  }
};

main();
