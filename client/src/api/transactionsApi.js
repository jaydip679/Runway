import apiClient from './apiClient';

export const getTransactions = async (params) => {
  const { data } = await apiClient.get('/transactions', { params });
  return data;
};

export const createTransaction = async (transactionData) => {
  const { data } = await apiClient.post('/transactions', transactionData);
  return data;
};

export const updateTransaction = async ({ id, ...transactionData }) => {
  const { data } = await apiClient.patch(`/transactions/${id}`, transactionData);
  return data;
};

export const deleteTransaction = async (id) => {
  const { data } = await apiClient.delete(`/transactions/${id}`);
  return data;
};

export const uploadReceipt = async (id, file) => {
  const formData = new FormData();
  formData.append('receipt', file);
  const { data } = await apiClient.post(`/transactions/${id}/receipt`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const importCsv = async (accountId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('accountId', accountId);
  const { data } = await apiClient.post('/transactions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const getImportStatus = async (jobId) => {
  const { data } = await apiClient.get(`/transactions/import/${jobId}`);
  return data;
};

export const aggregateTransactions = async (params) => {
  const { data } = await apiClient.get('/transactions/aggregate', { params });
  return data;
};
