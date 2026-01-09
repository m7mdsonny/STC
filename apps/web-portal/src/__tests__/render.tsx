import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

type Options = RenderOptions & {
  route?: string
}

export function renderWithRouter(
  ui: ReactElement,
  { route = '/', ...options }: Options = {}
) {
  window.history.pushState({}, 'Test page', route)

  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        {children}
      </MemoryRouter>
    ),
    ...options,
  })
}
