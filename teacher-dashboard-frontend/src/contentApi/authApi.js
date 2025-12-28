import axios from 'axios';
import BASE_URL from '../config/apiConfig.js';


export const loginUser = async (email, password) => {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return res.data;
};
