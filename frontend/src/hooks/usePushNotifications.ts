"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://amenguide-backend-775250805671.us-west1.run.app";

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");

    useEffect(() => {
        const supported =
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            "PushManager" in window &&
            "Notification" in window;
        setIsSupported(supported);
        if (supported) {
            setPermission(Notification.permission);
        }
    }, []);

    // 서버에서 구독 상태 확인
    const checkStatus = useCallback(async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/notifications/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setIsSubscribed(data.subscribed);
            }
        } catch {}
    }, []);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    /** 푸시 알림 구독 */
    const subscribe = useCallback(async () => {
        if (!isSupported) return false;
        setLoading(true);
        try {
            // 1. 알림 권한 요청
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== "granted") {
                setLoading(false);
                return false;
            }

            // 2. Service Worker 등록
            const registration = await navigator.serviceWorker.register("/sw.js");
            await navigator.serviceWorker.ready;

            // 3. VAPID 공개 키 가져오기
            const vapidRes = await fetch(`${API_BASE}/notifications/vapid-key`);
            const { publicKey } = await vapidRes.json();
            if (!publicKey) {
                console.error("VAPID public key not configured");
                setLoading(false);
                return false;
            }

            // 4. PushManager 구독
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            // 5. 서버에 구독 정보 전송
            const token = localStorage.getItem("authToken");
            if (!token) {
                setLoading(false);
                return false;
            }

            const subJson = subscription.toJSON();
            await fetch(`${API_BASE}/notifications/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    endpoint: subJson.endpoint,
                    keys: {
                        p256dh: subJson.keys?.p256dh,
                        auth: subJson.keys?.auth,
                    },
                }),
            });

            setIsSubscribed(true);
            setLoading(false);
            return true;
        } catch (err) {
            console.error("Push subscription failed:", err);
            setLoading(false);
            return false;
        }
    }, [isSupported]);

    /** 푸시 알림 구독 해제 */
    const unsubscribe = useCallback(async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    const token = localStorage.getItem("authToken");
                    if (token) {
                        await fetch(`${API_BASE}/notifications/unsubscribe`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ endpoint: subscription.endpoint }),
                        });
                    }
                    await subscription.unsubscribe();
                }
            }
            setIsSubscribed(false);
        } catch (err) {
            console.error("Push unsubscribe failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    return { isSupported, isSubscribed, loading, permission, subscribe, unsubscribe };
}

/** VAPID 공개 키를 Uint8Array로 변환 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; i++) {
        view[i] = rawData.charCodeAt(i);
    }
    return buffer;
}
