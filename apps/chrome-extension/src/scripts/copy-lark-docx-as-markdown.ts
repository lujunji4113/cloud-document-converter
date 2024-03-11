import { docx, Toast } from "@dolphin/lark";
import { generatePublicUrl, makePublicUrlEffective } from "@dolphin/lark/image";
import { isDefined, stringify } from "@dolphin/common";

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

  Toast.loading({
    content: "获取图片中",
    keepAlive: true,
    key: "fetching",
  });

  const isSuccess = await makePublicUrlEffective(Object.fromEntries(tokens));
  if (isSuccess) {
    Toast.success({
      content: "获取图片结束",
    });
  } else {
    Toast.error({
      content: "获取图片失败",
    });
  }

  Toast.remove("fetching");

  const markdown = stringify(root);

  navigator.clipboard.write([
    new ClipboardItem({
      "text/plain": new Blob([markdown], { type: "text/plain" }),
    }),
  ]);
};

main();
