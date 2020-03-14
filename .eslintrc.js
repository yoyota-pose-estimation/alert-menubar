module.exports = {
  extends: [
    "airbnb",
    "prettier/react",
    "plugin:jest/recommended",
    "plugin:promise/recommended",
    "plugin:prettier/recommended"
  ],
  env: {
    jest: true,
    node: true,
    browser: true
  },
  plugins: ["jest", "promise", "prettier", "react", "react-hooks"],
  rules: {
    "no-console": "off",
    "no-alert": "error",
    "no-param-reassign": ["error", { props: false }],
    "no-unused-vars": [
      "error",
      {
        varsIgnorePattern: "_"
      }
    ],
    "prettier/prettier": [
      "error",
      {
        semi: false
      }
    ],
    "react/prop-types": "off",
    "react/jsx-filename-extension": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "import/no-extraneous-dependencies": "off"
  }
}
