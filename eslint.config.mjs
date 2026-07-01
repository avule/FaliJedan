import next from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "node_modules/**", ".claude/**"] },
  ...next,
  ...nextCoreWebVitals,
  {
    // Server components (page.tsx / layout.tsx / route handlers in app/)
    // render once per request - the purity rule is meant for client renders.
    files: [
      "app/**/page.tsx",
      "app/**/layout.tsx",
      "app/**/route.ts",
    ],
    rules: {
      "react-hooks/purity": "off",
    },
  },
];

export default config;
