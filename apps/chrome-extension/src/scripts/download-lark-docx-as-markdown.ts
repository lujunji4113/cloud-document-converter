import i18next from "i18next";
import { Toast, docx } from "@dolphin/lark";
import { stringify } from "@dolphin/common";
import { fileSave } from "browser-fs-access";
import { fs } from "@zip.js/zip.js";

enum TranslationKey {
  CONTENT_LOADING = "content_loading",
  UNKNOWN_ERROR = "unknown_error",
  NOT_SUPPORT = "not_support",
  DOWNLOADING_IMAGES = "downloading_images",
  DOWNLOAD_IMAGES_COMPLETE = "download_images_complete",
  FAILED_TO_DOWNLOAD_IMAGE = "failed_to_download_image",
}

enum ToastKey {
  DOWNLOADING_IMAGES = "downloading_images",
}

i18next.init({
  lng: docx.language,
  resources: {
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
          [TranslationKey.DOWNLOAD_IMAGES_COMPLETE]: "Download images complete",
          [TranslationKey.FAILED_TO_DOWNLOAD_IMAGE]:
            "Failed to download image {{name}}",
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
          [TranslationKey.DOWNLOAD_IMAGES_COMPLETE]: "下载图片完成",
          [TranslationKey.FAILED_TO_DOWNLOAD_IMAGE]: "下载图片 {{name}} 失败",
        },
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
        content: i18next.t(TranslationKey.DOWNLOADING_IMAGES, {
          progress: Math.floor((downloadedItemsCount / allItemsCount) * 100),
        }),
        keepAlive: true,
        key: ToastKey.DOWNLOADING_IMAGES,
      });
    };

    const closeLoading = () => {
      Toast.remove(ToastKey.DOWNLOADING_IMAGES);
    };

    if (!hasImages) {
      const markdown = stringify(root);

      updateLoading();

      blob = new Blob([markdown]);
    } else {
      let zipFs = new fs.FS();

      Toast.loading({
        content: i18next.t(TranslationKey.DOWNLOADING_IMAGES, {
          progress: "0",
        }),
        keepAlive: true,
        key: ToastKey.DOWNLOADING_IMAGES,
      });

      await Promise.allSettled(
        images.map(async (image, index) => {
          if (image.data) {
            const { name, fetchSources } = image.data;
            let blobUrl = (await fetchSources())?.src;
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
              const response = await fetch(blobUrl);
              zipFs.addBlob(imageFileName, await response.blob());
              image.url = imageFileName;
            } catch {
              Toast.error({
                content: i18next.t(TranslationKey.FAILED_TO_DOWNLOAD_IMAGE, {
                  name,
                }),
              });
            }
          }

          updateLoading();
        })
      );

      closeLoading();

      Toast.success({
        content: i18next.t(TranslationKey.DOWNLOAD_IMAGES_COMPLETE),
      });

      const markdown = stringify(root);

      zipFs.addText(`${documentTitle}.md`, markdown);

      blob = await zipFs.exportBlob();
    }

    return blob;
  };

  await fileSave(toBlob(), {
    fileName: `${documentTitle}${ext}`,
    extensions: [ext],
  });
};

main().catch(() => {
  Toast.remove("downloading");

  Toast.error({ content: i18next.t(TranslationKey.UNKNOWN_ERROR) });
});
