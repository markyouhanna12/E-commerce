export interface INotificationPayload {
  userId: string;

  title: string;

  body: string;

  type: string;

  data?: Record<string, string>;
}
