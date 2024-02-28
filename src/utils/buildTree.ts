import { TFile, TMessage } from 'librechat-data-provider';
import { MessageType } from '~/types/conversation';
import { EVENT_TYPES, MessageEventType } from '~/types/events';
import { User } from '~/types/user';

const even =
  'w-full border-b border-black/10 dark:border-gray-900/50 text-gray-800 bg-white dark:text-gray-100 group dark:bg-gray-800 hover:bg-gray-100/25 hover:text-gray-700  dark:hover:bg-gray-900 dark:hover:text-gray-200';
const odd =
  'w-full border-b border-black/10 bg-gray-50 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group bg-gray-100 dark:bg-gray-1000 hover:bg-gray-100/40 hover:text-gray-700 dark:hover:bg-[#3b3d49] dark:hover:text-gray-200';

export default function buildTree({
  messages,
  fileMap,
  groupAll = false,
}: {
  messages: TMessage[] | null;
  fileMap?: Record<string, TFile>;
  groupAll?: boolean;
}) {
  if (messages === null) {
    return null;
  }

  const messageMap: Record<string, TMessage & { children: TMessage[] }> = {};
  const rootMessages: TMessage[] = [];

  if (groupAll) {
    return messages.map((m, idx) => ({ ...m, bg: idx % 2 === 0 ? even : odd }));
  }
  if (!groupAll) {
    // Traverse the messages array and store each element in messageMap.
    messages.forEach((message) => {
      messageMap[message.messageId] = { ...message, children: [] };

      if (message.files && fileMap) {
        messageMap[message.messageId].files = message.files.map(
          (file) => fileMap[file.file_id] ?? file,
        );
      }

      const parentMessage = messageMap[message.parentMessageId ?? ''];
      if (parentMessage) {
        parentMessage.children.push(messageMap[message.messageId]);
      } else {
        rootMessages.push(messageMap[message.messageId]);
      }
    });

    return rootMessages;
  }
}

export function buildMessagesFromEvents({ events, user }) {
  if (!events || !user) {
    return null;
  }

  const messages: MessageType[] = [];

  let interactionId = null;
  let conversationId = null;
  let modelId = null;
  let modelReason = null;
  let promptBlocked = false;
  let promptRedacted = false;
  let responseBlocked = false;
  let responseRedacted = false;
  let modelPolicyResults = null;
  let modelPolicyMessage = null;
  let modelSystemMessage = null;
  let userPolicyResults = null;
  let userPolicyMessage = null;
  let userSystemMessage = null;
  let message: any = {};
  events.forEach((event: any) => {
    //console.log(event)
    switch (event.event_type) {
      case EVENT_TYPES.INIT_CONVERSATION:
        conversationId = event.event.conversation_id;
        break;
      case EVENT_TYPES.INIT_INTERACTION:
        interactionId = event.event.interaction_id;
        break;
      case EVENT_TYPES.PROCESS_PROMPT:
        userPolicyResults = event.event.policy_results;
        userPolicyMessage = event.event.policy_message;
        userSystemMessage = event.event.system_message;

        promptBlocked = !!event.event.is_blocked;
        promptRedacted = !!event.event.is_redacted;
        break;
      case EVENT_TYPES.ROUTE_PROMPT:
        modelId = event.event.selected_model_id;
        modelReason = event.event.reason;
        break;
      case EVENT_TYPES.GENERATE_RESPONSE:
        message.isCacheResult = event.event.is_cache_result;
        break;
      case EVENT_TYPES.PROCESS_RESPONSE:
        modelPolicyResults = event.event.policy_results;
        modelPolicyMessage = event.event.policy_message;
        modelSystemMessage = event.event.system_message;

        responseBlocked = !!event.event.is_blocked;
        responseRedacted = !!event.event.is_redacted;
        break;
      case EVENT_TYPES.MESSAGE:
        message.isCreatedByUser = event.event.is_user_created;
        message.text = event.event.body;
        message.messageId = event.event.message_id;
        message.parentMessageId = event.event.parent_message_id;
        message.sender = event.event.is_user_created ? user.username : 'Vera';
        message.error = event.is_error;
        message.conversationId = conversationId;
        message.interactionId = interactionId;

        if (!message.isCreatedByUser) {
          message.policyMessage = event.event.policy_message || modelPolicyMessage;
          message.policyResults = event.event.policy_results || modelPolicyResults;
          message.systemMessage = event.event.system_message || modelSystemMessage;
          message.isBlocked = responseBlocked;
          message.isRedacted = responseRedacted;
          message.modelId = modelId;
          message.modelReason = modelReason;
          // another way to check if prompt was blocked
          // (handling response)
          if (message.text === null) {
            message.modelId = null;
            message.modelReason = null;
            message.text = message.systemMessage;
            message.systemMessage = null;
          }
        } else {
          message.policyMessage = userPolicyMessage;
          message.policyResults = userPolicyResults;
          message.systemMessage = userSystemMessage;
          message.isBlocked = promptBlocked;
          message.isRedacted = promptRedacted;
        }

        messages.push(message);
        message = {};
        break;
      default:
        throw Error('Unexpected event caught: ', event);
    }
  });
  console.log('[BUILT MESSAGES]: ', messages);
  return messages;
}

export function buildMessageTreeFromMessages({ messages }) {
  if (!messages) {
    return null;
  }

  const messageMap: Record<string, MessageType> = {};
  const messagesTree: MessageType[] = [];

  messages.forEach((message) => {
    messageMap[message.messageId] = { ...message, children: [] };
  });

  Object.keys(messageMap).forEach((messageId) => {
    const message = messageMap[messageId];

    const parentMessage = message.parentMessageId ? messageMap[message.parentMessageId] : null;
    if (parentMessage) {
      parentMessage.children.push(messageMap[message.messageId]);
    } else {
      messagesTree.push(messageMap[message.messageId]);
    }
  });

  console.log('[BUILD] messagesTree: ', messagesTree);
  return messagesTree;
}

export function buildMessageTreeFromEvents({
  events,
  user,
}: {
  events: MessageEventType[] | null;
  user: User | null;
}) {
  if (!events || !user) {
    return null;
  }

  const messages = buildMessagesFromEvents({ events, user });
  const messagesTree = buildMessageTreeFromMessages({ messages });
  return messagesTree;
}
