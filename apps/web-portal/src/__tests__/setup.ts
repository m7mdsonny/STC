import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})

// Mock window.location for jsdom (BrowserRouter needs origin/href)
const mockLocation = {
  href: 'http://localhost:5173/',
  origin: 'http://localhost:5173',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  host: 'localhost:5173',
  hostname: 'localhost',
  port: '5173',
  protocol: 'http:',
}

Object.defineProperty(window, 'location', {
  writable: true,
  value: mockLocation,
})

global.fetch = vi.fn()
