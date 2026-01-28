'use client';

import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/dates';
import { User } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { ImageViewer } from './ImageViewer';

interface Attachment {
  id: string;
  media_kind: 'image' | 'audio'; // simplified
  url?: string;
}

interface ChatBubbleProps {
  message: {
    id: string;
    body_text?: string;
    created_at: string;
    msg_type: string;
    attachments: Attachment[];
    is_reader: boolean;
  };
  sender?: {
    display_name: string;
    avatar_url?: string | null;
  };
}

export function ChatBubble({ message, sender }: ChatBubbleProps) {
  const isReader = message.is_reader;
  
  // Determine alignment and colors
  // Reader (Tarotista) -> Left (Gray/Dark)
  // User (Client) -> Right (Purple/Brand)
  const alignClass = isReader ? 'justify-start' : 'justify-end';
  const bubbleClass = isReader 
    ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700' 
    : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-lg';

  return (
    <div className={cn("flex gap-2 sm:gap-3 max-w-full", alignClass)}>
      {/* Avatar (Only for Left side / Reader) */}
      {isReader && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 self-end mb-1">
          {sender?.avatar_url ? (
            <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
          )}
        </div>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[85%] sm:max-w-[80%] min-w-[100px] sm:min-w-[120px]", isReader ? "items-start" : "items-end")}>
         {/* Name (for Reader) */}
         {isReader && sender && (
             <span className="text-[10px] text-slate-500 ml-1">{sender.display_name}</span>
         )}

         {/* Attachments */}
         {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col gap-2 mb-1 w-full">
                {message.attachments.map(att => (
                    <div key={att.id}>
                        {att.media_kind === 'image' && att.url && (
                            <ImageViewer src={att.url} />
                        )}
                        {att.media_kind === 'audio' && att.url && (
                             <AudioPlayer src={att.url} />
                        )}
                    </div>
                ))}
            </div>
         )}

         {/* Text Bubble */}
         {message.body_text && (
            <div className={cn("px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words", bubbleClass)}>
                {message.body_text}
            </div>
         )}

         {/* Timestamp */}
         <span className="text-[10px] text-slate-500 opacity-70 px-1">
            {formatDate(message.created_at)}
         </span>
      </div>

      {/* Avatar (Only for Right side / User) */}
      {!isReader && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 self-end mb-1">
          {sender?.avatar_url ? (
            <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
          )}
        </div>
      )}
    </div>
  );
}
