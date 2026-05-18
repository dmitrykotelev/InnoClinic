import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    host: true, 
    allowedHosts: [
        'my-custom-domain.local', 
        'test-project.com',
        '.ngrok-free.app',
        'inno-clinic.portal.com'
    ],
    port: 4000, 
  }
})
