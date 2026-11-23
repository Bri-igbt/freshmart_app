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

// DASHBOARD
export const getDashboard = () => API.get("/admin");

// ORDERS
export const getAllOrders = (params) => API.get("/admin/orders", { params });

export const getSingleOrder = (id) => API.get(`/admin/orders/${id}`);

export const updateOrderStatus = (id, status) =>
  API.put(`/admin/orders/${id}`, {
    orderStatus: status,
  });

export const deleteOrder = (id) => API.delete(`/admin/orders/${id}`);

// CATEGORY
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

// HOOKAHS
export const getHookahs = () => API.get("/hookahs");

export const getHookah = (id) => API.get(`/hookahs/${id}`);

export const createHookah = (data) => API.post("/hookahs", data);

export const updateHookah = (id, data) => API.put(`/hookahs/${id}`, data);

export const deleteHookah = (id) => API.delete(`/hookahs/${id}`);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const uploadImage = async (file) => {
  if (!file) throw new Error("Please select an image");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Only JPG, PNG or WebP images are allowed");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image must be 5MB or smaller");
  }

  const formData = new FormData();
  formData.append("image", file);

  const { data } = await API.post("/upload", formData);
  return data; 
};

export default API;
