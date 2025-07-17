import { cache } from 'react';

import { apiServer } from './api.server';

export const getMeCached = cache(async function getMeCached() {
  try {
    const res = await apiServer.get(`/auth/me?key=server`);
    return res.data;
  } catch {
    return null;
  }
});
