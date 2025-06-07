'use client';
import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { RoomContext } from '@livekit/components-react';
import { Room } from 'livekit-client';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [room] = React.useState(() => new Room());
  return (
    <SessionProvider>
      <RoomContext.Provider value={room}>
      {children}
      </RoomContext.Provider>
    </SessionProvider>
  );
};