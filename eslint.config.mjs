import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 放宽类型检查规则
      "@typescript-eslint/no-explicit-any": "off",      // 允许使用 any 类型
      "@typescript-eslint/no-unused-vars": "warn",      // 未使用变量只警告不报错
      "prefer-const": "warn",                           // 对可以使用 const 的变量只警告不报错
      "no-console": "off"                               // 允许使用 console
    }
  }
];

export default eslintConfig;
