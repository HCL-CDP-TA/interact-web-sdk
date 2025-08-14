import { defineConfig } from "tsup"

export default defineConfig(options => ({
  format: ["cjs", "esm"],
  entry: ["./src/index.ts"],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  watch: options.watch,
  minify: true,
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      dead_code: true,
      passes: 2,
    },
    mangle: {
      toplevel: true,
    },
    output: {
      comments: false,
    },
    keep_classnames: false,
    keep_fnames: false,
  },
}))
