import { initApp } from './ui/app'

document.addEventListener('DOMContentLoaded', () => {
  initApp().catch(err => console.error('App initialization failed:', err))
})
