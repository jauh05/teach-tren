import { QueryClient } from '@tanstack/react-query'

// Satu QueryClient untuk seluruh aplikasi. Data server dikelola TanStack Query.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
