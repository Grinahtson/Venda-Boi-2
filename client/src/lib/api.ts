// API Client for Boi na Rede
export const API_URL = typeof window === "undefined" ? "" : "";

interface ApiOptions {
  sessionId?: string;
  body?: unknown;
}

export async function apiCall<T>(
  endpoint: string,
  method: string = "GET",
  options: ApiOptions = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.sessionId) {
    headers["Authorization"] = `Bearer ${options.sessionId}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// Auth endpoints
export const authAPI = {
  login: (email: string, password: string, rememberMe: boolean = true) =>
    apiCall<{ sessionId: string; user: any }>("/api/auth/login", "POST", {
      body: { email, password, rememberMe },
    }),
  register: (email: string, password: string, name: string, phone?: string) =>
    apiCall<{ sessionId: string; user: any }>("/api/auth/register", "POST", {
      body: { email, password, name, phone },
    }),
  logout: (sessionId: string) =>
    apiCall("/api/auth/logout", "POST", { sessionId }),
  getMe: (sessionId: string) =>
    apiCall<any>("/api/users/me", "GET", { sessionId }),
  updateProfile: (sessionId: string, data: any) =>
    apiCall<any>("/api/users/me", "PUT", { sessionId, body: data }),
};

// Ads endpoints
export const adsAPI = {
  list: (filters?: { category?: string; state?: string; search?: string; priceMin?: number; priceMax?: number; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== "all") params.append("category", filters.category);
    if (filters?.state && filters.state !== "all") params.append("state", filters.state);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.priceMin) params.append("priceMin", filters.priceMin.toString());
    if (filters?.priceMax) params.append("priceMax", filters.priceMax.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    
    const query = params.toString();
    return apiCall<any>(`/api/ads${query ? "?" + query : ""}`);
  },
  nearby: (lat: number, lng: number, radiusKm: number = 100) =>
    apiCall<any[]>(`/api/ads/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`),
  get: (id: string) =>
    apiCall<any>(`/api/ads/${id}`),
  uploadPhotos: (sessionId: string, files: File[]): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const readFile = (file: File): Promise<string> => {
        return new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            res(base64);
          };
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
      };

      Promise.all(files.map(readFile))
        .then((base64Images) => {
          const headers: HeadersInit = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionId}`,
          };

          return fetch("/api/upload", {
            method: "POST",
            headers,
            body: JSON.stringify({ images: base64Images }),
            credentials: "include",
          });
        })
        .then((res) => res.json())
        .then((data) => {
          if (data.urls) resolve(data.urls);
          else reject(new Error(data.message || "Upload failed"));
        })
        .catch(reject);
    });
  },
  create: (sessionId: string, data: any) =>
    apiCall<any>("/api/ads", "POST", { sessionId, body: data }),
  update: (sessionId: string, id: string, data: any) =>
    apiCall<any>(`/api/ads/${id}`, "PUT", { sessionId, body: data }),
  delete: (sessionId: string, id: string) =>
    apiCall<any>(`/api/ads/${id}`, "DELETE", { sessionId }),
  userAds: (sessionId: string) =>
    apiCall<any[]>("/api/ads/user/me", "GET", { sessionId }),
};

// Favorites endpoints
export const favoritesAPI = {
  list: (sessionId: string) =>
    apiCall<any[]>("/api/favorites", "GET", { sessionId }),
  add: (sessionId: string, adId: string) =>
    apiCall<any>(`/api/favorites/${adId}`, "POST", { sessionId }),
  remove: (sessionId: string, adId: string) =>
    apiCall<any>(`/api/favorites/${adId}`, "DELETE", { sessionId }),
};

// Messages endpoints
export const messagesAPI = {
  send: (sessionId: string, receiverId: string, content: string, adId?: string) =>
    apiCall<any>("/api/messages", "POST", {
      sessionId,
      body: { receiverId, content, adId },
    }),
  getConversation: (sessionId: string, userId: string) =>
    apiCall<any[]>(`/api/messages/${userId}`, "GET", { sessionId }),
  getConversations: (sessionId: string) =>
    apiCall<any[]>("/api/conversations", "GET", { sessionId }),
  markAsRead: (sessionId: string, messageId: string) =>
    apiCall<any>(`/api/messages/${messageId}/read`, "PUT", { sessionId }),
};
