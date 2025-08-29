// vite.config.js
import path from "node:path";
import vue from "file:///D:/working/release-flow/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { defineConfig } from "file:///D:/working/release-flow/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "D:\\working\\release-flow";
var vite_config_default = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      "@main": path.resolve(__vite_injected_original_dirname, "src/main"),
      "@renderer": path.resolve(__vite_injected_original_dirname, "src/renderer"),
      "@preload": path.resolve(__vite_injected_original_dirname, "src/preload")
    }
  },
  server: {
    port: 5173,
    hmr: true
  },
  base: "./",
  // Usar rutas relativas para que funcione con file://
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx3b3JraW5nXFxcXHJlbGVhc2UtZmxvd1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcd29ya2luZ1xcXFxyZWxlYXNlLWZsb3dcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3dvcmtpbmcvcmVsZWFzZS1mbG93L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xyXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3Z1ZSgpXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcclxuICAgICAgJ0BtYWluJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9tYWluJyksXHJcbiAgICAgICdAcmVuZGVyZXInOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3JlbmRlcmVyJyksXHJcbiAgICAgICdAcHJlbG9hZCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvcHJlbG9hZCcpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogNTE3MyxcclxuICAgIGhtcjogdHJ1ZSxcclxuICB9LFxyXG4gIGJhc2U6ICcuLycsIC8vIFVzYXIgcnV0YXMgcmVsYXRpdmFzIHBhcmEgcXVlIGZ1bmNpb25lIGNvbiBmaWxlOi8vXHJcbiAgYnVpbGQ6IHtcclxuICAgIG91dERpcjogJ2Rpc3QnLFxyXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXHJcbiAgfSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2UCxPQUFPLFVBQVU7QUFDOVEsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsb0JBQW9CO0FBRjdCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFBQSxFQUNmLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxNQUNsQyxTQUFTLEtBQUssUUFBUSxrQ0FBVyxVQUFVO0FBQUEsTUFDM0MsYUFBYSxLQUFLLFFBQVEsa0NBQVcsY0FBYztBQUFBLE1BQ25ELFlBQVksS0FBSyxRQUFRLGtDQUFXLGFBQWE7QUFBQSxJQUNuRDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxFQUNQO0FBQUEsRUFDQSxNQUFNO0FBQUE7QUFBQSxFQUNOLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxFQUNmO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
