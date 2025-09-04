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
  // Don't set platform to let tsup handle each format appropriately
}))
