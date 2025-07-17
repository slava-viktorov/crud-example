'use server';

import axios from 'axios';
import { getAllRequestCookiesToString } from '@/lib/cookies.server';
import { axiosInstanceConfig } from './api';

const api = axios.create({ ...axiosInstanceConfig, baseURL: process.env.API_URL });

api.interceptors.request.use(async (config) => {
  const cookies = await getAllRequestCookiesToString();
  if (cookies) {
    config.headers['Cookie'] = cookies;
  }
  return config;
});

export const apiServer = api;