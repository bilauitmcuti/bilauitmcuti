import nextConfig from "eslint-config-next";

export default [
  {
    ignores: [".open-next/**", ".next/**"],
  },
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
