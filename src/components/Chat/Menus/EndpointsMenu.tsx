import { alternateName } from 'librechat-data-provider';
import { Content, Portal, Root } from '@radix-ui/react-popover';
import type { FC } from 'react';
import EndpointItems from './Endpoints/MenuItems';
import { useChatContext } from '~/Providers';
import TitleButton from './UI/TitleButton';

// ! This will be where we place the models

const EndpointsMenu: FC = () => {
  const { conversation } = useChatContext();
  const selected = conversation?.endpoint ?? '';

  return (
    <Root>
      <TitleButton primaryText={(alternateName[selected] ?? selected ?? '') + ' '} />
      <Portal>
        <div
          style={{
            position: 'fixed',
            left: '0px',
            top: '0px',
            transform: 'translate3d(268px, 50px, 0px)',
            minWidth: 'max-content',
            zIndex: 'auto',
          }}
        >
          <Content
            side="bottom"
            align="start"
            className="mt-2 max-h-[65vh] min-w-[340px] overflow-y-auto rounded-lg border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white lg:max-h-[75vh]"
          >
            <EndpointItems endpoints={[]} selected={selected} />
          </Content>
        </div>
      </Portal>
    </Root>
  );
};

export default EndpointsMenu;
