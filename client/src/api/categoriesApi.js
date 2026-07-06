import apiClient from './apiClient';

export const getCategories = async ({ page = 1, limit = 50, type }) => {
  const { data } = await apiClient.get('/categories', { params: { page, limit, type } });
  return data;
};

export const createCategory = async (categoryData) => {
  const { data } = await apiClient.post('/categories', categoryData);
  return data;
};

export const updateCategory = async ({ id, ...categoryData }) => {
  const { data } = await apiClient.patch(`/categories/${id}`, categoryData);
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await apiClient.delete(`/categories/${id}`);
  return data;
};
