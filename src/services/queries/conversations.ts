import { useQuery } from '@tanstack/react-query';
import {
  getAllUserConversations,
  getConversationEvents,
  getConversationMessages,
} from '../api/conversations';
import { useAuthStore } from '~/zustand';
import { useLocation } from 'react-router-dom';

export function useConversationEvents(conversationId: string | null) {
  return useQuery({
    queryKey: ['events', conversationId],
    queryFn: () => getConversationEvents(conversationId!),
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

export function useConversationMessages(conversationId: string | null) {
  const location = useLocation();
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => {
      if (location.state?.shallow) {
        return location.state.messages;
      }
      return getConversationMessages(conversationId!, user!);
    },
    enabled: !!conversationId && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    onSuccess: () => {
      location.state = null;
    },
  });
}

export function useConversations() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => getAllUserConversations(user?.user_id!),
    enabled: !!user?.user_id,
    onSuccess(data) {
      console.log('[USECONVERSATIONS]: ', data);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}
