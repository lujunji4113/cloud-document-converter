import { encode } from "js-base64";
import { encodeToken } from "./encode/encode-token";

export const generatePublicUrl = (token: string): string => {
  const code = encode(encodeToken(token), true);
  return new URL(
    "/space/api/box/stream/download/asynccode/?code=".concat(code),
    location.origin
  ).toString();
};

const csrfToken = () => {
  const t = document.cookie.match(
    new RegExp("(?:^|;)\\s*".concat("_csrf_token", "=([^;]+)"))
  );
  return window.decodeURIComponent(t ? t[1] : "");
};

export const makePublicUrlEffective = async (
  tokens: Record<string, string>
): Promise<boolean> => {
  try {
    const response = await fetch(
      new URL("/space/api/docx/resources/copy_out", location.origin),
      {
        method: "POST",
        headers: {
          "X-Csrftoken": csrfToken(),
        },
        body: JSON.stringify({
          tokens,
        }),
      }
    );
    const jsonData = await response.json();

    if (jsonData.code !== 0) return false;

    return true;
  } catch {
    return false;
  }
};
