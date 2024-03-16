import { convertUserPath } from "./orbito-common.js";

export const tailwindCss = (cssPath) => {
  return {
    cssPath: convertUserPath(cssPath),
  };
};
