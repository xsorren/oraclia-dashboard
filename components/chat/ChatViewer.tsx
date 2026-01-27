'use client';

import { ChatBubble } from './ChatBubble';

interface ChatViewerProps {
  session: any;
  messages: any[];
}

export function ChatViewer({ session, messages }: ChatViewerProps) {
  if (!messages || messages.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
            <p>No hay mensajes en esta conversación.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Intro Date Separator */}
      <div className="flex justify-center">
        <span className="textxs font-medium text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
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
