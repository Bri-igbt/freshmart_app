import axios from "axios";

const isBrowser = typeof window !== "undefined";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
});

API.interceptors.request.use((config) => {
  const token = isBrowser ? localStorage.getItem("token") : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      isBrowser &&
      error.response?.status === 401 &&
      localStorage.getItem("token") &&
      window.location.pathname !== "/login"
    ) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Dashboard
export const getDashboard = () => API.get("/admin");

// Orders
export const getAllOrders = (params) => API.get("/admin/orders", { params });

export const getSingleOrder = (id) => API.get(`/admin/orders/${id}`);

export const updateOrderStatus = (id, status) =>
  API.put(`/admin/orders/${id}`, {
    orderStatus: status,
  });

export const deleteOrder = (id) => API.delete(`/admin/orders/${id}`);

// Category
export const getCategories = () => API.get("/categories");

export const getCategory = (id) => API.get(`/categories/${id}`);

export const createCategory = (data) => API.post("/categories/add", data);

export const updateCategory = (id, data) => API.put(`/categories/${id}`, data);

export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// Products
export const getProducts = (params = {}) => API.get("/products", { params });

export const getProduct = (id) => API.get(`/products/${id}`);

export const createProducts = (data) => API.post("/products/add", data);

export const updateProducts = (id, data) => API.put(`/products/${id}`, data);

export const deleteProducts = (id) => API.delete(`/products/${id}`);

// Hookahs
export const getHookahs = () => API.get("/hookahs");

export const getHookah = (id) => API.get(`/hookahs/${id}`);

export const createHookah = (data) => API.post("/hookahs", data);

export const updateHookah = (id, data) => API.put(`/hookahs/${id}`, data);

export const deleteHookah = (id) => API.delete(`/hookahs/${id}`);

// Upload Images
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await API.post("/upload", formData);
  return response.data;
};

export default API;
