import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'https://communisafe-backend.onrender.com';

// Axios instance
const API = axios.create({
  baseURL: API_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


export const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  path: '/socket.io/',
});

// Example utility function (keep this if you use it elsewhere)
export const getLatestWaterLevel = async () => {
  const res = await axios.get(`${API_URL}/api/flood/latest`);
  return res.data;
};

export default API;