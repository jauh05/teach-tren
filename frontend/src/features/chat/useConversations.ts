import { useQuery } from '@tanstack/react-query'
import { fetchConversations } from '../../api/conversations'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => fetchConversations(),
  })
}
