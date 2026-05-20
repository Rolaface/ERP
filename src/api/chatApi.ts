import axios from 'axios';

export type SendMessagePayload = {
  message: string;
};

export type SendMessageResponse = {
  success: boolean;
  reply: string;
};

export const sendMessage = async (
  payload: SendMessagePayload
): Promise<SendMessageResponse> => {

  const response = await axios.post(
    '/chat/message',
    payload
  );

  return response.data;
};