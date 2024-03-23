import { convertUserPath } from "./orbito-common";

export const tailwindCss = (cssPath) => {
  return {
    cssPath: convertUserPath(cssPath),
  };
};
