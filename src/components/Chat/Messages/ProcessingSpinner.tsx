import React from 'react';
import VeraSpinner from '~/components/svg/VeraSpinner';
import Message from './Message';
import { Icon } from '~/components/Endpoints';
import { cn } from '~/utils';

function ProcessingSpinner({ event }) {
  const icon = Icon({
    iconURL: '',
    model: '',
    size: 28.8,
  });

  return (
    <>
      <div
        className="text-token-text-primary w-full border-0 bg-transparent dark:border-0 dark:bg-transparent"
        // onWheel={handleScroll}
        // onTouchMove={handleScroll}
      >
        <div className="m-auto justify-center p-4 py-2 text-base md:gap-6 ">
          <div className="} group mx-auto flex flex-1 gap-3 text-base md:max-w-3xl md:px-5 lg:max-w-[40rem] lg:px-1 xl:max-w-[48rem] xl:px-5">
            <div className="relative flex flex-shrink-0 flex-col items-end">
              <div>
                <div className="pt-0.5">
                  <div className="gizmo-shadow-stroke flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                    {typeof icon === 'string' && /[^\\x00-\\x7F]+/.test(icon as string) ? (
                      <span className=" direction-rtl w-40 overflow-x-scroll">{icon}</span>
                    ) : (
                      icon
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={cn('relative flex w-full flex-col', 'agent-turn')}>
              <div className="select-none font-semibold mb-2">Vera</div>
              <div className="flex-col gap-1 md:gap-3">
                <div className="flex max-w-full flex-grow flex-col gap-0">
                  <div
                    className="flex items-center justify-center max-w-max pl-4 pr-5 py-2 rounded-full"
                    style={{
                      background:
                        ' radial-gradient(96.65% 96.65% at -2.56% 24.88%, rgba(63, 90, 255, 0.1) 0%, rgba(25, 216, 202, 0.1) 100%) ',
                    }}
                  >
                    <VeraSpinner className="mr-1" /> {event}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProcessingSpinner;
