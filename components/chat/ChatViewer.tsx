'use client';

import { ChatBubble } from './ChatBubble';

interface ChatParticipant {
  display_name: string;
  avatar_url?: string | null;
}

interface ChatAttachment {
  id: string;
  media_kind: 'image' | 'audio';
  url?: string;
}

interface ChatMessage {
  id: string;
  body_text?: string;
  created_at: string;
  msg_type: string;
  attachments: ChatAttachment[];
  is_reader: boolean;
}

interface ChatSession {
  reader?: ChatParticipant;
  user?: ChatParticipant;
}

interface ChatViewerProps {
  session: ChatSession;
  messages: ChatMessage[];
}

export function ChatViewer({ session, messages }: ChatViewerProps) {
  if (!messages || messages.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px] text-slate-500">
            <p className="text-sm">No hay mensajes en esta conversación.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-2 sm:p-4">
      {/* Intro Date Separator */}
      <div className="flex justify-center">
        <span className="text-xs font-medium text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
            Inició la consulta
        </span>
      </div>

      {messages.map((msg) => {
        const sender = msg.is_reader ? session.reader : session.user;
        return (
            <ChatBubble 
                key={msg.id} 
                message={msg} 
                sender={sender} 
            />
        );
      })}
    </div>
  );
}
