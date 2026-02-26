const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://amenguide-backend-wcnovu4ydq-uw.a.run.app';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
            throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}
