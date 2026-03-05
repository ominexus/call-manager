import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✏️ GitHub 레포지토리 이름으로 변경하세요
// 예: 레포 이름이 "call-manager" 이면 base: '/call-manager/'
const REPO_NAME = 'call-manager'

export default defineConfig({
  plugins: [react()],
  base: `/${REPO_NAME}/`,
})
