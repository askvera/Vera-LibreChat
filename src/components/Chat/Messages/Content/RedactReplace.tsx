import reactStringReplace from 'react-string-replace';
import BlockedIcon from '~/components/svg/BlockedIcon';
import LockIcon from '~/components/svg/LockIcon';
import { VERA_RED } from '~/utils/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui';

export const formatRedactedString = (content: string) => {
  const redactFilter = content.replaceAll('&lt;REDACTED&gt;', 'REDACTED');
  return redactFilter;
};

interface RedactReplaceProps {
  content: string;
  policyMessage: string;
}

export const RedactReplace = ({ content, policyMessage }: RedactReplaceProps) => {
  return (
    <>
      {reactStringReplace(content, '&lt;REDACTED&gt;', (_, i) => {
        return (
          <TooltipProvider delayDuration={50}>
            <Tooltip>
              <TooltipTrigger>
                <span
                  className="mx-1 inline-flex items-center gap-0.5 px-2 py-0.5 text-sm"
                  style={{
                    color: '#141826',
                    background: '#F5F6FA',
                    width: 'max-content',
                    borderRadius: 100,
                  }}
                  key={content + i}
                >
                  <LockIcon /> REDACTED
                </span>
              </TooltipTrigger>
              {policyMessage && (
                <TooltipContent side="top" sideOffset={-5}>
                  {policyMessage}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </>
  );
};

interface BlockReplaceProps {
  content: string;
  policyMessage: string;
}

export const BlockReplace = ({ content, policyMessage }: BlockReplaceProps) => {
  return (
    <>
      {reactStringReplace(content, 'CONTENT BLOCKED', (_, i) => {
        return (
          <TooltipProvider delayDuration={50}>
            <Tooltip>
              <TooltipTrigger>
                <span
                  className="mx-1 inline-flex items-center gap-0.5 px-2 py-0.5 text-sm"
                  style={{
                    color: VERA_RED,
                    background: '#EE422B1A',
                    width: 'max-content',
                    borderRadius: 100,
                  }}
                  key={content + i}
                >
                  <BlockedIcon /> CONTENT BLOCKED
                </span>
              </TooltipTrigger>
              {policyMessage && (
                <TooltipContent side="top" sideOffset={-5}>
                  {policyMessage}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </>
  );
};
