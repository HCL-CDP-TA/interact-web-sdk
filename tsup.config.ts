import { defineConfig } from "tsup"

export default defineConfig(options => ({
  format: ["cjs", "esm", "iife"],
  entry: ["./src/index.ts"],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  watch: options.watch,
  minify: false,
  sourcemap: true,
  globalName: "HCLInteractSDK", // For IIFE format
  cjsInterop: true,
  splitting: false,
  target: "es2018", // Lower target for better compatibility
  platform: "neutral", // Let each format determine its own platform
}))
