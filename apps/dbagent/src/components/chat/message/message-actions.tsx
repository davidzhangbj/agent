import { Button, toast, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@internal/components';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from 'ai';
import { format } from 'date-fns';
import equal from 'fast-deep-equal';
import { CopyIcon, FullscreenIcon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { memo } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';
import { MessageVote } from '~/lib/db/schema-sqlite';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading
}: {
  chatId: string;
  message: Message;
  vote: MessageVote | undefined;
  isLoading: boolean;
}) {
  const { data: session } = useSession();
  const { project: projectId } = useParams<{ project: string }>();
  const queryClient = useQueryClient();
  const [, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;
  const textFromParts = message.parts
    ?.filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="text-muted-foreground h-fit px-2 py-1"
              variant="outline"
              onClick={async () => {
                if (!textFromParts) {
                  toast.error("There's no text to copy!");
                  return;
                }

                await copyToClipboard(textFromParts);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>
        {textFromParts?.includes('```html') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="text-muted-foreground h-fit px-2 py-1"
                variant="outline"
                onClick={async () => {
                  const textFromParts = message.parts
                    ?.filter((part) => part.type === 'text')
                    .map((part) => part.text)
                    .join('\n')
                    .trim();
                  console.log('copy:', textFromParts);
                  if (textFromParts?.includes('```html')) {
                    const newWindow = window.open('', '_blank');
                    if (newWindow) {
                      newWindow.document.write(textFromParts.replace(/^```html\n/, '').replace(/\n```$/, ''));
                      newWindow.document.close();
                    } else {
                      toast.error('Failed to open a new window. Please allow pop-ups for this site.');
                    }
                  }
                }}
              >
                <FullscreenIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-upvote"
              className="text-muted-foreground !pointer-events-auto h-fit px-2 py-1"
              disabled={vote?.isUpvoted === 1}
              variant="outline"
              onClick={async () => {
                const upvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'up'
                  })
                });

                toast.promise(upvote, {
                  loading: 'Upvoting Response...',
                  success: () => {
                    queryClient.setQueryData<Array<MessageVote>>(['votes', chatId], (currentVotes) => {
                      if (!currentVotes || !session?.user?.id) return [];

                      const votesWithoutCurrent = currentVotes.filter((vote) => vote.messageId !== message.id);

                      return [
                        ...votesWithoutCurrent,
                        {
                          projectId,
                          createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                          userId: session.user.id,
                          chatId,
                          messageId: message.id,
                          isUpvoted: 1
                        }
                      ];
                    });

                    return 'Upvoted Response!';
                  },
                  error: 'Failed to upvote response.'
                });
              }}
            >
              <ThumbsUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upvote Response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-downvote"
              className="text-muted-foreground !pointer-events-auto h-fit px-2 py-1"
              variant="outline"
              disabled={vote && !vote.isUpvoted}
              onClick={async () => {
                const downvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'down'
                  })
                });

                toast.promise(downvote, {
                  loading: 'Downvoting Response...',
                  success: () => {
                    queryClient.setQueryData<Array<MessageVote>>(['votes', chatId], (currentVotes) => {
                      if (!currentVotes || !session?.user?.id) return [];

                      const votesWithoutCurrent = currentVotes.filter((vote) => vote.messageId !== message.id);

                      return [
                        ...votesWithoutCurrent,
                        {
                          projectId,
                          createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                          userId: session.user.id,
                          chatId,
                          messageId: message.id,
                          isUpvoted: 0
                        }
                      ];
                    });

                    return 'Downvoted Response!';
                  },
                  error: 'Failed to downvote response.'
                });
              }}
            >
              <ThumbsDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Downvote Response</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(PureMessageActions, (prevProps, nextProps) => {
  if (!equal(prevProps.vote, nextProps.vote)) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;

  return true;
});
