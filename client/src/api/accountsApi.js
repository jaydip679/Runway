import apiClient from './apiClient';

export const getAccounts = async ({ page = 1, limit = 20 }) => {
  const { data } = await apiClient.get('/accounts', { params: { page, limit } });
  return data;
};

export const createAccount = async (accountData) => {
  const { data } = await apiClient.post('/accounts', accountData);
  return data;
};

export const updateAccount = async ({ id, ...accountData }) => {
  const { data } = await apiClient.patch(`/accounts/${id}`, accountData);
  return data;
};

export const deleteAccount = async (id) => {
  const { data } = await apiClient.delete(`/accounts/${id}`);
  return data;
};
