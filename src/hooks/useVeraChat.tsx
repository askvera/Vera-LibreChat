import { v4 } from 'uuid';
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { useRecoilState, useResetRecoilState, useSetRecoilState } from 'recoil';
import type { TMessage } from 'librechat-data-provider';
import type { TAskFunction } from '~/common';
import useNewConvo from './useNewConvo';
import store from '~/store';
import { useAuthStore } from '~/zustand';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { VERA_HEADER } from '~/utils/constants';
import { EVENT_TYPES } from '~/types/events';
import { BASE_API_URL } from '~/services/api/setup';
import { useNavigate } from 'react-router-dom';

// this to be set somewhere else
export default function useVeraChat(index = 0, paramId: string | undefined) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, user } = useAuthStore();
  const [abortController, setAbortController] = useState(new AbortController());
  const [showStopButton, setShowStopButton] = useState(false);

  const [currEvent, setCurrEvent] = useRecoilState(store.eventMessageByIndex(index));
  const [isSubmitting, setIsSubmitting] = useRecoilState(store.isSubmittingFamily(index));
  const [error, setError] = useRecoilState(store.errorMessageByIndex(index));
  const [latestMessage, setLatestMessage] = useRecoilState(store.latestMessageFamily(index));

  const [files, setFiles] = useRecoilState(store.filesByIndex(index));
  const [filesLoading, setFilesLoading] = useState(false);

  const { newConversation } = useNewConvo(index);
  const { useCreateConversationAtom } = store;
  const { conversation, setConversation } = useCreateConversationAtom(index);
  const { conversationId } = conversation ?? {};

  const queryParam = paramId === 'new' ? paramId : conversationId ?? paramId ?? '';

  const resetLatestMessage = useResetRecoilState(store.latestMessageFamily(index));
  const setSiblingIdx = useSetRecoilState(
    store.messagesSiblingIdxFamily(latestMessage?.parentMessageId ?? null),
  );

  const setMessages = useCallback(
    (messages: TMessage[]) => {
      queryClient.setQueryData<TMessage[]>([QueryKeys.messages, queryParam], messages);
    },
    [queryParam, queryClient],
  );

  const getMessages = useCallback(() => {
    return queryClient.getQueryData<TMessage[]>([QueryKeys.messages, queryParam]);
  }, [queryParam, queryClient]);

  const setSubmission = useSetRecoilState(store.submissionByIndex(index));

  const ask: TAskFunction = (
    { text, parentMessageId = null, conversationId = null, messageId = null },
    {
      editedText = null,
      editedMessageId = null,
      isRegenerate = false,
      isContinued = false,
      isEdited = false,
    } = {},
  ) => {
    setError('');
    const messages = getMessages() ?? [];
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    setShowStopButton(true);
    setIsSubmitting(true);
    setCurrEvent('Analyzing');

    const convoId =
      conversationId ?? conversation?.conversation_id ?? lastMessage?.conversationId ?? null;

    const tempMessage = {
      text: text.trim(),
      sender: user?.username,
      isCreatedByUser: true,
      parentMessageId: parentMessageId ?? lastMessage?.messageId ?? null,
      conversationId: convoId,
      messageId: 'tempMessage',
      error: false,
    };
    console.log('[ASK] parentMessageId', parentMessageId);
    setMessages([...messages, tempMessage]);

    const apiUrl = `${BASE_API_URL}/chat`;
    const apiKey = token!;
    const payload = {
      prompt_text: text.trim(),
      conversation_id: convoId,
    };
    const headers = {
      'Content-Type': 'application/json',
      [VERA_HEADER]: apiKey,
    };

    console.log('[ASK] Messages after adding temp message: ', messages);

    // console.log(`[PROTO] ESTABLISHING CONNECTION WITH TOKEN: \n${apiKey}\n and PROMPT: \n${text}`);

    fetchEventSource(apiUrl, {
      method: 'POST',
      headers,
      signal: abortController.signal,
      body: JSON.stringify(payload),
      async onopen(response) {
        // console.log('[PROTO] OPENED CONNECTION:', response);
        if (response.ok) {
          return; // everything's good
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          // client-side errors are usually non-retriable:
          throw new Error();
        } else {
          throw new Error();
        }
      },
      onmessage(msg) {
        //// console.log('[PROTO] NEW EVENT:', msg);
        if (msg.data) {
          const data = JSON.parse(msg.data);
          //// console.log('[PROTO] EVENT DATA:', data);
          processEventMessage(data);
        }
        if (msg.event === 'FatalError') throw new Error(msg.data);
      },
      onerror(e) {
        abortController.abort();
        setAbortController(new AbortController());
        setCurrEvent('');
        setShowStopButton(false);
        setIsSubmitting(false);
        setError(e);
        // console.log('[PROTO] ERROR: ', e);
        throw Error(e);
      },
      onclose() {
        const messages = getMessages() ?? [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        const convoId =
          conversationId ?? conversation?.conversation_id ?? lastMessage?.conversationId ?? null;
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        console.log('convoId', convoId);
        if (convoId) {
          const newConvoPathName = `/c/${convoId}`;
          navigate(newConvoPathName, { state: { shallow: true } });
        }
        setCurrEvent('');
        setShowStopButton(false);
        setIsSubmitting(false);
        // console.log('[PROTO] CONNECTION CLOSED');
      },
    });
  };

  const processEventMessage = (data) => {
    let currentMessages: TMessage[] | null = getMessages() ?? [];
    if (data.is_skipped) console.log('skipped: ', data);
    switch (data.event_type) {
      case EVENT_TYPES.INIT_CONVERSATION:
        console.log('conversation:', data);
        // navigate(`/c/${data.event.conversation_id}`);
        // console.log(EVENT_TYPES.INIT_CONVERSATION, ':', data);
        break;
      case EVENT_TYPES.INIT_INTERACTION:
        // console.log(EVENT_TYPES.INIT_INTERACTION, ':', data);
        break;
      case EVENT_TYPES.PROCESS_PROMPT:
        if (!data.is_skipped) setCurrEvent('Processing Prompt');
        // console.log(EVENT_TYPES.PROCESS_PROMPT, ':', data);
        break;
      case EVENT_TYPES.ROUTE_PROMPT:
        if (!data.is_skipped) setCurrEvent('Routing Prompt');
        // console.log(EVENT_TYPES.ROUTE_PROMPT, ':', data);
        break;
      case EVENT_TYPES.GENERATE_RESPONSE:
        if (!data.is_skipped) setCurrEvent('Generating Response');
        // console.log(EVENT_TYPES.GENERATE_RESPONSE, ':', data);
        break;
      case EVENT_TYPES.PROCESS_RESPONSE:
        if (!data.is_skipped) setCurrEvent('Processing Response');
        // console.log(EVENT_TYPES.PROCESS_RESPONSE, ':', data);
        break;
      case EVENT_TYPES.MESSAGE:
        // console.log('MESSAGE RECEIVED! : ', data);

        // // console.log('message: ', data);
        // const { body, is_user_created, parent_message_id, message_id } = data.event;
        // const { conversation_id, is_error } = data;

        // const msg = {
        //   text: body,
        //   sender: is_user_created ? user?.username : 'Vera',
        //   isCreatedByUser: is_user_created,
        //   parentMessageId: parent_message_id,
        //   conversationId: conversation_id,
        //   messageId: message_id,
        //   error: is_error,
        // };

        // if (!is_user_created) {
        //   const {
        //     policy_message,
        //     system_message,
        //     selected_model = 'Sample Model',
        //     selected_model_reason = 'Sample Reason: Lorem Ipsum Genuar Jaguar Lem Ip Su onpunm Delra gris',
        //   } = data.event;

        //   msg.model = selected_model;
        //   msg.modelReason = selected_model_reason;
        //   msg.policyMessage = policy_message;
        //   msg.systemMessage = system_message;

        //   setMessages([...currentMessages, msg]);
        // } else {
        //   const tempMsgIndex = currentMessages.findIndex((msg) => msg.messageId === 'tempMessage');
        //   currentMessages[tempMsgIndex] = msg;

        //   setMessages([...currentMessages]);
        // }

        // setLatestMessage(msg);
        break;
      case 'temp__user_message': {
        console.log('user message: ', data);
        const { body, is_user_created, parent_message_id, message_id, is_blocked, is_redacted } =
          data.event;
        const { conversation_id, is_error } = data;

        const msg = {
          text: body,
          sender: is_user_created ? user?.username : 'Vera',
          isCreatedByUser: is_user_created,
          parentMessageId: parent_message_id,
          conversationId: conversation_id,
          messageId: message_id,
          error: is_error,
          isBlocked: is_blocked,
          isRedacted: is_redacted,
        };

        const tempMsgIndex = currentMessages.findIndex((msg) => msg.messageId === 'tempMessage');
        currentMessages[tempMsgIndex] = msg;

        setMessages([...currentMessages]);
        setLatestMessage(msg);
        console.log('[ASK] Messages after adding USER message: ', currentMessages);
        break;
      }
      case 'temp__bot_message': {
        console.log('bot message: ', data);
        const {
          body,
          is_user_created,
          parent_message_id,
          message_id,
          policy_message,
          system_message,
          model_id,
          selected_model_id,
          reason,
          is_cache_result,
          is_blocked,
          is_redacted,
        } = data.event;
        const { conversation_id, is_error } = data;
        const msg = {
          text: body,
          sender: is_user_created ? user?.username : 'Vera',
          isCreatedByUser: is_user_created,
          parentMessageId: parent_message_id,
          conversationId: conversation_id,
          messageId: message_id,
          error: is_error,
          modelId: selected_model_id ?? model_id,
          modelReason: reason,
          policyMessage: policy_message,
          systemMessage: system_message,
          isCacheResult: is_cache_result,
          isBlocked: is_blocked,
          isRedacted: is_redacted,
        };

        // another way to check if prompt was blocked
        // (for handling model response)
        if (msg.text === null) {
          msg.modelId = null;
          msg.modelReason = null;
          msg.text = msg.systemMessage;
          msg.systemMessage = null;
        }

        setMessages([...currentMessages, msg]);

        setLatestMessage(msg);
        console.log('[ASK] Messages after adding BOT message: ', currentMessages);
        break;
      }
      default:
      // console.log('uncaught event: ', data);
    }
  };

  const regenerate = ({ parentMessageId }) => {
    const messages = getMessages();
    const parentMessage = messages?.find((element) => element.messageId == parentMessageId);

    if (parentMessage && parentMessage.isCreatedByUser) {
      ask({ ...parentMessage }, { isRegenerate: true });
    } else {
      console.error(
        'Failed to regenerate the message: parentMessage not found or not created by user.',
      );
    }
  };

  const continueGeneration = () => {
    if (!latestMessage) {
      console.error('Failed to regenerate the message: latestMessage not found.');
      return;
    }

    const messages = getMessages();

    const parentMessage = messages?.find(
      (element) => element.messageId == latestMessage.parentMessageId,
    );

    if (parentMessage && parentMessage.isCreatedByUser) {
      ask({ ...parentMessage }, { isContinued: true, isRegenerate: true, isEdited: true });
    } else {
      console.error(
        'Failed to regenerate the message: parentMessage not found, or not created by user.',
      );
    }
  };

  const stopGenerating = () => {
    abortController.abort();
    setAbortController(new AbortController());
    setSubmission(null);
    setShowStopButton(false);
    setIsSubmitting(false);
  };

  const handleStopGenerating = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    stopGenerating();
  };

  const handleRegenerate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const parentMessageId = latestMessage?.parentMessageId;
    if (!parentMessageId) {
      console.error('Failed to regenerate the message: parentMessageId not found.');
      return;
    }
    regenerate({ parentMessageId });
  };

  const handleContinue = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    continueGeneration();
    setSiblingIdx(0);
  };

  const [showBingToneSetting, setShowBingToneSetting] = useRecoilState(
    store.showBingToneSettingFamily(index),
  );
  const [showPopover, setShowPopover] = useRecoilState(store.showPopoverFamily(index));
  const [abortScroll, setAbortScroll] = useRecoilState(store.abortScrollFamily(index));
  const [preset, setPreset] = useRecoilState(store.presetByIndex(index));
  const [optionSettings, setOptionSettings] = useRecoilState(store.optionSettingsFamily(index));
  const [showAgentSettings, setShowAgentSettings] = useRecoilState(
    store.showAgentSettingsFamily(index),
  );

  return {
    newConversation,
    conversation,
    setConversation,
    // getConvos,
    // setConvos,
    isSubmitting,
    setIsSubmitting,
    getMessages,
    setMessages,
    setSiblingIdx,
    latestMessage,
    setLatestMessage,
    resetLatestMessage,
    index,
    regenerate,
    stopGenerating,
    handleStopGenerating,
    handleRegenerate,
    handleContinue,
    showPopover,
    setShowPopover,
    abortScroll,
    setAbortScroll,
    showBingToneSetting,
    setShowBingToneSetting,
    preset,
    setPreset,
    optionSettings,
    setOptionSettings,
    showAgentSettings,
    setShowAgentSettings,
    files,
    setFiles,
    filesLoading,
    setFilesLoading,

    error,
    currEvent,
    setCurrEvent,
    ask,
    showStopButton,
    setShowStopButton,
  };
}
