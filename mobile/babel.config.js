module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: [
      require.resolve("expo-router/babel"),
      ["inline-import", { extensions: [".sql"] }],
      [
        "module-resolver",
        {
          alias: {
            "react-native-worklets/plugin": "./src/worklets/plugin.js"
          }
        }
      ],
      "react-native-reanimated/plugin"
    ]
  }
}
