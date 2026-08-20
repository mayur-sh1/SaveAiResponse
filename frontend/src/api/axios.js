import axios from 'axios';

const api = axios.create({
  baseURL: 'https://save-ai-response-api.onrender.com/api',
});

export default api;
