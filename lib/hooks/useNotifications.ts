'use client';

import {
    adminApi,
    type NotificationsBroadcastParams,
    type NotificationsBroadcastResult,
} from '@/lib/api/admin';
import { useMutation } from '@tanstack/react-query';

export type { NotificationsBroadcastParams, NotificationsBroadcastResult };

export function useSendNotificationsBroadcast() {
  return useMutation({
    mutationFn: (params: NotificationsBroadcastParams) =>
      adminApi.sendNotificationsBroadcast(params),
  });
}
