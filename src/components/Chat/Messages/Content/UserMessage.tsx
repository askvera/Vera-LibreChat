import React from 'react';
import { RedactReplace, BlockReplace } from './RedactReplace';

function UserMessage({ message }) {
  const getMessage = () => {
    if (message.isBlocked) {
      return <BlockReplace content={message.text} policyMessage={message.policyMessage} />;
    } else if (message.isRedacted) {
      return <RedactReplace content={message.text} policyMessage={message.policyMessage} />;
    }

    return message.text;
  };

  return <>{getMessage()}</>;
}

export default UserMessage;
