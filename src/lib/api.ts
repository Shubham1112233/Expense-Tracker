const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:4000';

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { authToken?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (options.authToken) headers['Authorization'] = `Bearer ${options.authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : (await res.text() as any);
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || res.statusText;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  signup: (body: { name: string; email: string; password: string }) =>
    apiRequest<{ token: string; user: { id: string; name: string; email: string } }>(
      '/api/auth/signup',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  login: (body: { email: string; password: string }) =>
    apiRequest<{ token: string; user: { id: string; name: string; email: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  listTransactions: (
    params: Partial<{ type: string; category: string; q: string; startDate: string; endDate: string; page: number; limit: number }>,
    authToken: string
  ) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') search.set(k, String(v));
    });
    const qs = search.toString();
    return apiRequest<{ data: any[]; total: number }>(`/api/transactions${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      authToken
    } as any);
  },
  createTransaction: (
    body: { type: 'income'|'expense'; amount: number; category: string; description?: string; date: string },
    authToken: string
  ) => apiRequest<{ data: any }>(
    '/api/transactions',
    { method: 'POST', body: JSON.stringify(body), authToken } as any
  ),
  updateTransaction: (
    id: string,
    body: { type: 'income'|'expense'; amount: number; category: string; description?: string; date: string },
    authToken: string
  ) => apiRequest<{ data: any }>(
    `/api/transactions/${id}`,
    { method: 'PUT', body: JSON.stringify(body), authToken } as any
  ),
  deleteTransaction: (id: string, authToken: string) =>
    apiRequest<{ ok: true }>(`/api/transactions/${id}`, { method: 'DELETE', authToken } as any),
  checkAffordability: (body: { productName: string ; userIncome?: number; userExpenses?: number; productPrice?: number }, authToken: string) =>
    apiRequest<{ 
      success: boolean;
      message: string;
      data: {
        productName: string;
        productPrice: any;
        monthlySavings: number;
        monthsToAfford: number;
        explanation: string;
      }
     }>(`/api/ai-playground`, { method: 'POST', body: JSON.stringify(body), authToken } as any)
};


