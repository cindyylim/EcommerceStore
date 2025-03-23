import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // https://vitejs.dev/config/#server-proxy
  // proxy server requests from client to server
  // this is useful for developing the client and server simultaneously
  // without having to start the server and client separately
  // for example, if you have an api route that you want to access from the client
  // you can proxy the request to the server
  // this is useful for developing the client and server simultaneously
  // without having to start the server and client separately
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      }
    }
  }
})
