const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://amenguide-backend-775250805671.us-west1.run.app';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // 외부 signal이 있으면 사용, 없으면 내부 timeout용 controller 생성
    const externalSignal = options?.signal;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    // 외부 signal이 abort되면 내부 controller도 abort
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
    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
            throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}
