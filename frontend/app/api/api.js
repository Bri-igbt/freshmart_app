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
    const isLoginRequest = error.config?.url?.startsWith("/users/login");

    if (
      isBrowser &&
      error.response?.status === 401 &&
      !isLoginRequest &&
      localStorage.getItem("token")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("freshmart-user");
      localStorage.removeItem("freshmart-auth");
      window.dispatchEvent(new Event("freshmart-auth-change"));
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// REGISTRATION & LOGIN
export const registerUser = (data) => API.post("/users/register", data);

export const verifyEmail = (data) => API.post("/users/verify-email", data);

export const resendOtp = (data) => API.post("/users/resend-otp", data);

export const loginUser = (data) => API.post("/users/login", data);

export const forgotPassword = (data) =>
  API.post("/users/forgot-password", data);

export const resetPassword = (data) => API.post("/users/reset-password", data);

// PROFILE
export const getProfile = () => API.get("/users/profile");

// CATALOG
export const getCategories = () => API.get("/categories");

export const getProducts = (params) => API.get("/products", { params });

export const getProduct = (id) => API.get(`/products/${id}`);

export const getHookahs = () => API.get("/hookahs");

export const getHookah = (id) => API.get(`/hookahs/${id}`);

// ADDRESSES
export const getAddress = () => API.get("/address");

export const addAddress = (data) => API.post("/address/add", data);

export const updateAddress = (id, data) => API.put(`/address/${id}`, data);

export const deleteAddress = (id) => API.delete(`/address/${id}`);

// CART 
export const addToCart = (data) => API.post("/cart", data);

export const getCart = () => API.get("/cart");

export const updateCart = (id, quantity) =>
  API.put(`/cart/${id}`, { quantity });

export const removeCart = (id) => API.delete(`/cart/${id}`);

// ORDERS  
export const placeOrder = (data) => API.post("/orders/place", data);

export const getMyOrders = () => API.get("/orders/my-orders");

export const getOrder = (id) => API.get(`/orders/${id}`);

export const cancelOrder = (id) => API.put(`/orders/${id}/cancel`);

// CHECKOUT 
export const createCheckoutSession = (order) =>
  API.post("/payment/create-session", { order });

export const verifyPayment = (sessionId) =>
  API.post("/payment/verify-payment", { sessionId });

export default API;
