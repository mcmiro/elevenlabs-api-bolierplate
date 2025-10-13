import React from 'react';
import { Button } from '../ui/button';

interface TermsAndConditionsProps {
  onAccept: () => void;
  onCancel: () => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({
  onAccept,
  onCancel,
}) => {
  return (
    <div className="flex justify-center items-center h-full p-5 border-r border-black">
      <div className="p-10 w-full text-center">
        <h2 className="text-gray-800 text-2xl mb-7 font-semibold">
          Terms and conditions
        </h2>
        <div className="border border-black">
          <div className="text-left p-4 px-5 leading-7 text-black">
            <p>
              By clicking "Agree," and each time I interact with this AI agent,
              I consent to the recording, storage, and sharing of my
              communications with third-party service providers, and as
              described in the Privacy Policy. If you do not wish to have your
              conversations recorded, please refrain from using this service.
            </p>
          </div>
          <div className="border-t border-black grid grid-cols-2">
            <Button
              onClick={onCancel}
              variant="ghost"
              className="py-4 px-7 border-none text-base !outline-none ring-0 font-semibold cursor-pointer transition-all duration-300 min-w-[120px] bg-transparent text-black hover:bg-black/20 rounded-none h-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={onAccept}
              variant="default"
              className="py-4 px-7 border-none text-base font-semibold cursor-pointer transition-all duration-300 min-w-[120px] bg-black text-white hover:bg-black/80 rounded-none h-auto"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
