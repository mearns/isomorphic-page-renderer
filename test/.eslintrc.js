module.exports = {
    env: {
        browser: true,
        node: true,
        mocha: true
    },
    parser: "babel-eslint",
    plugins: [
        "react"
    ],
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        }
    },
    extends: ["plugin:react/recommended"]
};
