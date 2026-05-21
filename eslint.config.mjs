import nextConfig from "eslint-config-next";

export default [
  {
    ignores: [".open-next/**", ".vercel/**", ".next/**"],
  },
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
