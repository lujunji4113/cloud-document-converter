import i18next from "i18next";
import { Toast, docx } from "@dolphin/lark";
import { stringify } from "@dolphin/common";
import { fileSave } from "browser-fs-access";
import { fs } from "@zip.js/zip.js";
import normalizeFileName from "filenamify/browser";

const enum TranslationKey {
  CONTENT_LOADING = "content_loading",
  UNKNOWN_ERROR = "unknown_error",
  NOT_SUPPORT = "not_support",
  DOWNLOADING_IMAGES = "downloading_images",
  FAILED_TO_DOWNLOAD_IMAGE = "failed_to_download_image",
  DOWNLOAD_COMPLETE = "download_complete",
  STILL_DOWNLOADING = "still_downloading",
}

enum ToastKey {
  DOWNLOADING = "downloading",
}

i18next.init({
  lng: docx.language,
  resources: {
    en: {
      translation: {
        [TranslationKey.CONTENT_LOADING]:
          "Part of the content is still loading and cannot be downloaded at the moment. Please wait for loading to complete and retry",
        [TranslationKey.UNKNOWN_ERROR]: "Unknown error during download",
        [TranslationKey.NOT_SUPPORT]:
          "This is not a lark document page and cannot be downloaded as Markdown",
        [TranslationKey.DOWNLOADING_IMAGES]:
          "Download images progress: {{progress}}% (please do not refresh or close the page)",
        [TranslationKey.FAILED_TO_DOWNLOAD_IMAGE]:
          "Failed to download image {{name}}",
        [TranslationKey.STILL_DOWNLOADING]:
          "Still downloading (please do not refresh or close the page)",
        [TranslationKey.DOWNLOAD_COMPLETE]: "Download complete",
      },
    },
    zh: {
      translation: {
        [TranslationKey.CONTENT_LOADING]:
          "部分内容仍在加载中，暂时无法下载。请等待加载完成后重试",
        [TranslationKey.UNKNOWN_ERROR]: "下载过程中出现未知错误",
        [TranslationKey.NOT_SUPPORT]:
          "这不是一个飞书文档页面，无法下载为 Markdown",
        [TranslationKey.DOWNLOADING_IMAGES]:
          "下载图片进度：{{progress}}%（请不要刷新或关闭页面）",
        [TranslationKey.FAILED_TO_DOWNLOAD_IMAGE]: "下载图片 {{name}} 失败",
        [TranslationKey.STILL_DOWNLOADING]:
          "仍在下载中（请不要刷新或关闭页面）",
        [TranslationKey.DOWNLOAD_COMPLETE]: "下载完成",
      },
    },
  },
});

const usedNames: Set<string> = new Set();
const fileNameToPreId: Map<string, number> = new Map();
const uniqueFileName = (originFileName: string) => {
  if (usedNames.has(originFileName)) {
    const startDotIndex = originFileName.lastIndexOf(".");

    const preId = fileNameToPreId.get(originFileName) ?? 0;
    const id = preId + 1;
    fileNameToPreId.set(originFileName, id);

    const fileName =
      startDotIndex === -1
        ? originFileName.concat(`-${id}`)
        : originFileName
            .slice(0, startDotIndex)
            .concat(`-${id}`)
            .concat(originFileName.slice(startDotIndex));

    return fileName;
  }

  usedNames.add(originFileName);

  return originFileName;
};

const main = async () => {
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

  const { root, images } = docx.intoMarkdownAST();
  const recommendName = normalizeFileName(
    docx.pageTitle ? normalizeFileName(docx.pageTitle.slice(0, 100)) : "doc"
  );
  const hasImages = images.length > 0;
  const ext = hasImages ? ".zip" : ".md";

  const toBlob = async () => {
    let blob: Blob;

    const allItemsCount = images.length + 1;

    const updateLoading = (content: string) => {
      Toast.loading({
        content,
        keepAlive: true,
        key: ToastKey.DOWNLOADING,
      });
    };

    if (!hasImages) {
      const markdown = stringify(root);

      blob = new Blob([markdown]);
    } else {
      const zipFs = new fs.FS();

      updateLoading(
        i18next.t(TranslationKey.DOWNLOADING_IMAGES, {
          progress: "0",
        })
      );

      let downloadedItemsCount = 0;
      await Promise.allSettled(
        images.map(async (image) => {
          if (image.data) {
            const { name, fetchSources } = image.data;
            const blobUrl = (await fetchSources())?.src;
            if (!blobUrl) {
              Toast.error({
                content: i18next.t(TranslationKey.FAILED_TO_DOWNLOAD_IMAGE, {
                  name,
                }),
              });

              return;
            }

            try {
              const imageFileName = uniqueFileName(name);
              const imageFilePath = `images/${imageFileName}`;
              const response = await fetch(blobUrl);
              zipFs.addBlob(imageFilePath, await response.blob());
              image.url = imageFilePath;
            } catch {
              Toast.error({
                content: i18next.t(TranslationKey.FAILED_TO_DOWNLOAD_IMAGE, {
                  name,
                }),
              });
            }
          }

          updateLoading(
            i18next.t(TranslationKey.DOWNLOADING_IMAGES, {
              progress: Math.floor(
                (downloadedItemsCount++ / allItemsCount) * 100
              ),
            })
          );
        })
      );

      updateLoading(i18next.t(TranslationKey.STILL_DOWNLOADING));

      const markdown = stringify(root);

      zipFs.addText(`${recommendName}.md`, markdown);

      blob = await zipFs.exportBlob();
    }

    Toast.remove(ToastKey.DOWNLOADING);

    Toast.success({
      content: i18next.t(TranslationKey.DOWNLOAD_COMPLETE),
    });

    return blob;
  };

  await fileSave(toBlob(), {
    fileName: `${recommendName}${ext}`,
    extensions: [ext],
  });
};

main()
  .catch((error: DOMException | TypeError) => {
    if (error.name !== "AbortError") {
      Toast.error({ content: i18next.t(TranslationKey.UNKNOWN_ERROR) });
    }
  })
  .finally(() => {
    Toast.remove(ToastKey.DOWNLOADING);
  });
