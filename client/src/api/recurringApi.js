import apiClient from './apiClient';

export const getRecurringList = async () => {
  const response = await apiClient.get('/recurring');
  return response.data;
};

export const createRecurring = async (data) => {
  const response = await apiClient.post('/recurring', data);
  return response.data;
};

export const updateRecurring = async ({ id, data }) => {
  const response = await apiClient.patch(`/recurring/${id}`, data);
  return response.data;
};

export const confirmRecurring = async (id) => {
  const response = await apiClient.post(`/recurring/${id}/confirm`);
  return response.data;
};

export const dismissRecurring = async (id) => {
  const response = await apiClient.post(`/recurring/${id}/dismiss`);
  return response.data;
};

export const deleteRecurring = async (id) => {
  const response = await apiClient.delete(`/recurring/${id}`);
  return response.data;
};
