import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface NotificationDto {
    id: number;
    title: string;
    message: string;
}

interface Props {
    token: string;
}

export function NotificationDropdown({ token }: Props) {
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [show, setShow] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const response = await fetch("http://localhost:8080/notifications/new", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Błąd pobierania powiadomień:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [token]);

    const markAsRead = async (id: number) => {
        try {
            await fetch(`http://localhost:8080/notifications/${id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(notifications.filter((n) => n.id !== id));
        } catch (error) {
            console.error("Błąd przy oznaczaniu jako przeczytane:", error);
        }
    };

    return (
        <div className="relative">
            <button
                className="relative p-2 text-white hover:text-amber-100 transition-colors"
                onClick={() => setShow(!show)}
            >
                <div className="relative">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg">
              {notifications.length}
            </span>
                    )}
                </div>
            </button>

            {show && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShow(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900">
                            <h3 className="text-lg font-semibold text-white flex items-center justify-between">
                                <span>Powiadomienia</span>
                                <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {notifications.length} nowych
                </span>
                            </h3>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-500">Brak nowych wiadomości</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((n) => (
                                        <div key={n.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 pr-4">
                                                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{n.title}</h4>
                                                    <p className="text-gray-600 text-sm">{n.message}</p>
                                                </div>
                                                <button
                                                    onClick={() => markAsRead(n.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                                                >
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="mt-2 flex justify-end">
                        <span className="text-xs text-gray-400">
                          Nowa wiadomość
                        </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200">
                            <button
                                className="w-full p-4 text-center text-amber-700 hover:bg-amber-50 font-medium transition-colors flex items-center justify-center gap-2"
                                onClick={() => {
                                    setShow(false);
                                    navigate("/notifications");
                                }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Zobacz wszystkie powiadomienia
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}