import React from 'react';
import { useChatContext } from '../../contexts/chat-context';
import { useElevenLabsChat } from '../../hooks/use-eleven-labs-chat';
import { Dialog, DialogContent } from '../ui/dialog';
import { ChatInterface } from './index';

export const MobileChatDialog: React.FC = () => {
  const { isMobileDialogOpen, setIsMobileDialogOpen, flowStep } =
    useChatContext();
  const { handleCancelTerms, resetToIntro } = useElevenLabsChat();

  const handleOpenChange = (open: boolean) => {
    setIsMobileDialogOpen(open);
    // If closing the dialog, always reset to intro to allow starting fresh
    if (!open) {
      if (flowStep === 'terms') {
        handleCancelTerms();
      } else if (flowStep === 'chat') {
        resetToIntro();
      }
    }
  };

  return (
    <Dialog open={isMobileDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="md:hidden w-full h-full max-w-none max-h-none p-0 border-0 rounded-none"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="h-full w-full">
          <ChatInterface isMobile={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
