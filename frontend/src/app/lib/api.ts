import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

const getStoredAccessToken = () => localStorage.getItem('accessToken');

const getRefreshEndpoint = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('/company') || url.includes('/company')) return '/company/refresh-token';
  if (url.startsWith('/consumer') || url.includes('/consumer')) return '/consumer/refresh-token';
  return undefined;
};

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as any;

    if (!originalConfig || originalConfig._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const refreshEndpoint = getRefreshEndpoint(originalConfig.url);
    if (!refreshEndpoint) {
      return Promise.reject(error);
    }

    originalConfig._retry = true;
    const token = getStoredAccessToken();

    try {
      const refreshResponse = await axios.post(
        '/api' + refreshEndpoint,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );

      const newAccessToken = refreshResponse.data?.accessToken;
      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
        originalConfig.headers = {
          ...originalConfig.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        return api(originalConfig);
      }
    } catch (refreshError) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('companyAuth');
      localStorage.removeItem('userAuth');
      localStorage.removeItem('company');
      localStorage.removeItem('user');
      localStorage.removeItem('companyEmail');
      localStorage.removeItem('companyName');
      localStorage.removeItem('companyPhone');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
    }

    return Promise.reject(error);
  }
);

export { api };
