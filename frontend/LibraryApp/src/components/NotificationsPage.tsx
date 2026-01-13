import { useEffect, useState } from "react";

interface NotificationDto {
    id: number;
    title: string;
    message: string;
    createdAt?: string;
}

interface Props {
    token: string | null;
}

export function NotificationsPage({ token }: Props) {
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        setLoading(true);
        fetch("http://localhost:8080/notifications", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setNotifications(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Błąd:", err);
                setLoading(false);
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Historia powiadomień</h1>
                                <p className="text-gray-300">Wszystkie otrzymane powiadomienia</p>
                            </div>
                            <div className="flex items-center gap-4">
                <span className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-full font-semibold">
                  {notifications.length} wiadomości
                </span>
                                <button
                                    onClick={() => window.history.back()}
                                    className="p-2 text-white hover:text-amber-100 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-16">
                                <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Brak powiadomień</h3>
                                <p className="text-gray-600">Nie masz jeszcze żadnych powiadomień.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-lg">{notification.title}</h4>
                                                        {notification.createdAt && (
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(notification.createdAt).toLocaleDateString('pl-PL', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 ml-14">{notification.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Stats */}
                        {notifications.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                                        <div className="text-3xl font-bold text-blue-700 mb-2">{notifications.length}</div>
                                        <p className="text-blue-900 font-medium">Wszystkich powiadomień</p>
                                    </div>
                                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                                        <div className="text-3xl font-bold text-green-700 mb-2">
                                            {notifications.filter(n => n.title.includes('dostępna') || n.message.includes('dostępna')).length}
                                        </div>
                                        <p className="text-green-900 font-medium">Powiadomień o dostępności</p>
                                    </div>
                                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-6">
                                        <div className="text-3xl font-bold text-amber-700 mb-2">
                                            {notifications.filter(n => n.title.includes('termin') || n.message.includes('termin')).length}
                                        </div>
                                        <p className="text-amber-900 font-medium">Powiadomień o terminach</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}