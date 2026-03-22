const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://amenguide-backend-775250805671.us-west1.run.app';

async function fetchOnce<T>(url: string, options?: RequestInit, externalSignal?: AbortSignal | null): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout (콜드 스타트 대응)

    if (externalSignal) {
        if (externalSignal.aborted) { controller.abort(); }
        else { externalSignal.addEventListener('abort', () => controller.abort(), { once: true }); }
    }

    try {
        const isFormData = options?.body instanceof FormData;
        const headers: Record<string, string> = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options?.headers as Record<string, string>),
        };

        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const externalSignal = options?.signal ?? null;

    try {
        return await fetchOnce<T>(url, options, externalSignal);
    } catch (err: unknown) {
        // 외부에서 abort된 경우 재시도하지 않음
        if (externalSignal?.aborted) {
            throw err;
        }
        // 1회 재시도 (콜드 스타트 대응)
        try {
            return await fetchOnce<T>(url, options, externalSignal);
        } catch (retryErr: unknown) {
            if (retryErr instanceof Error && retryErr.name === 'AbortError') {
                throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
            }
            throw retryErr;
        }
    }
}
