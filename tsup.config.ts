import { defineConfig } from "tsup"

export default defineConfig(options => ({
  format: ["cjs", "esm", "iife"],
  entry: ["./src/index.ts"],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  watch: options.watch,
  minify: false, // Disable minification for development
  sourcemap: true,
  globalName: "HCLInteractSDK", // For IIFE format
  platform: "browser", // Optimize for browser usage
}))
