import React from 'react';
import InfoIcon from '~/components/svg/InfoIcon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui';

function MessageInfoChip({ children, text, bg, color }) {
  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip>
        <div
          className="max-w-max-content flex items-center rounded-full px-3 py-1"
          style={{ background: bg, color }}
        >
          <span className="mr-2">{text}</span>{' '}
          <TooltipTrigger>
            <InfoIcon color={color} />
          </TooltipTrigger>
        </div>
        <TooltipContent side="top" sideOffset={-5}>
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default MessageInfoChip;
