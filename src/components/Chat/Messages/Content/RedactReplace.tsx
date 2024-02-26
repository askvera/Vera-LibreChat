import reactStringReplace from 'react-string-replace';
import LockIcon from '~/components/svg/LockIcon';
interface RedactReplaceProps {
  content: string;
}

export const formatRedactedString = (content: string) => {
  const redactFilter = content.replaceAll('&lt;REDACTED&gt;', 'REDACTED');
  return redactFilter;
};

export const RedactReplace = ({ content }: RedactReplaceProps) => {
  return (
    <div>
      {reactStringReplace(content, '&lt;REDACTED&gt;', (_, i) => {
        return (
          <span
            className="px-2 py-0.5 ml-1 inline-flex items-center gap-0.5 text-sm"
            style={{
              color: '#141826',
              background: '#F5F6FA',
              width: 'max-content',
              borderRadius: 100,
              
            }}
            key={content + i}
          >
              <LockIcon/> REDACTED
          </span>

        );
      })}
    </div>
  );
};
