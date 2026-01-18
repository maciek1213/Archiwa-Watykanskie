import { useNavigate } from "react-router-dom";
import { isAdmin, getUserId } from "../utils/tokenUtils.ts";
import { useState, useEffect } from "react";
import axios from "axios";
import { BookManagement } from "./BookManagement.tsx";

interface UserData {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

interface AdminUser {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    authorities: Array<{ authority: string }>;
    password?: string;
    accountNonExpired?: boolean;
    accountNonLocked?: boolean;
    credentialsNonExpired?: boolean;
    enabled?: boolean;
}

interface BookItem {
    id: number;
    isbn: string;
    isAvailable: boolean;
    book?: {
        id: number;
        title: string;
        author: string;
    };
}

interface Rental {
    id: number;
    bookItem?: BookItem;
    status: string;
    startDate: string;
    endDate: string;
}

interface BookQueue {
    id: number;
    user: {
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    book: {
        id: number;
        title: string;
        author: string;
    };
    status: string;
}

interface Props {
    token: string | null;
}

export function ProfilePage({ token }: Props) {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loadingRentals, setLoadingRentals] = useState(false);
    const [bookQueues, setBookQueues] = useState<BookQueue[]>([]);
    const [loadingQueues, setLoadingQueues] = useState(false);
    const [queuePositions, setQueuePositions] = useState<{ [key: number]: number }>({});

    const [isEditing, setIsEditing] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editData, setEditData] = useState<{
        username: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        password?: string;
    }>({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
    });

    useEffect(() => {
        const currentToken = token || localStorage.getItem("token");

        if (!currentToken) {
            navigate("/login");
            return;
        }

        const userId = getUserId(currentToken);
        if (!userId) {
            setError("Nie można pobrać ID użytkownika");
            setLoading(false);
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await axios.get<UserData>(
                    `http://localhost:8080/user/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${currentToken}`,
                        },
                    }
                );
                setUserData(response.data);
                setEditData({
                    username: response.data.username,
                    firstName: response.data.firstName,
                    lastName: response.data.lastName,
                    email: response.data.email,
                    phoneNumber: response.data.phoneNumber,
                });
                setError(null);
            } catch (err) {
                setError("Nie udało się pobrać danych użytkownika");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
        fetchUserRentals();
        fetchUserQueues();
    }, [navigate]);

    const fetchUserRentals = async () => {
        try {
            const currentToken = token || localStorage.getItem("token");
            const userId = getUserId(currentToken);
            if (!userId) return;

            setLoadingRentals(true);
            const response = await axios.get<Rental[]>(
                `http://localhost:8080/rentals/user/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${currentToken}`,
                    },
                }
            );
            setRentals(response.data);
        } catch (err) {
            console.error("Nie udało się pobrać wypożyczeń", err);
        } finally {
            setLoadingRentals(false);
        }
    };

    const fetchUserQueues = async () => {
        try {
            const currentToken = token || localStorage.getItem("token");
            const userId = getUserId(currentToken);
            if (!userId) return;

            setLoadingQueues(true);
            const response = await axios.get<BookQueue[]>(
                `http://localhost:8080/queue/user/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${currentToken}`,
                    },
                }
            );
            setBookQueues(response.data);

            const positions: { [key: number]: number } = {};
            for (const queue of response.data) {
                try {
                    const posResponse = await axios.get<number>(
                        `http://localhost:8080/queue/book/${queue.book.id}/position`,
                        {
                            params: { userId },
                            headers: {
                                Authorization: `Bearer ${currentToken}`,
                            },
                        }
                    );
                    positions[queue.book.id] = posResponse.data;
                } catch (err) {
                    console.error(`Nie udało się pobrać pozycji dla książki ${queue.book.id}`, err);
                }
            }
            setQueuePositions(positions);
        } catch (err) {
            console.error("Nie udało się pobrać rezerwacji", err);
        } finally {
            setLoadingQueues(false);
        }
    };

    const handleLeaveQueue = async (bookId: number) => {
        if (!window.confirm("Czy na pewno chcesz opuścić kolejkę?")) {
            return;
        }

        try {
            const currentToken = token || localStorage.getItem("token");
            await axios.delete(`http://localhost:8080/queue/leave`, {
                params: { bookId },
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                },
            });
            alert("Opuszczono kolejkę");
            fetchUserQueues();
        } catch (err) {
            alert("Nie udało się opuścić kolejki");
        }
    };

    const handleReturnBook = async (rentalId: number) => {
        try {
            await axios.post(
                `http://localhost:8080/rentals/return/${rentalId}`,
                null,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );
            alert("Książka została zwrócona!");
            fetchUserRentals();
        } catch (err) {
            alert("Nie udało się zwrócić książki");
        }
    };

    const handleExtendRental = async (rentalId: number) => {
        try {
            await axios.patch(
                `http://localhost:8080/rentals/prolong/${rentalId}`,
                null,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );
            alert("Wypożyczenie zostało przedłużone!");
            fetchUserRentals();
        } catch (err: any) {
        const errorMessage = err.response?.data || "Wystąpił nieoczekiwany błąd";
        alert("Błąd: " + errorMessage);
        }
    };

    const effectiveToken = token || localStorage.getItem("token");
    const adminUser = isAdmin(effectiveToken);

    useEffect(() => {
        if (adminUser && effectiveToken) {
            const fetchAllUsers = async () => {
                try {
                    setLoadingUsers(true);
                    const response = await axios.get<AdminUser[]>(
                        "http://localhost:8080/user",
                        {
                            headers: {
                                Authorization: `Bearer ${effectiveToken}`,
                            },
                        }
                    );
                    setAllUsers(response.data);
                } catch (err) {
                } finally {
                    setLoadingUsers(false);
                }
            };

            fetchAllUsers();
        }
    }, [adminUser, effectiveToken]);

    const handleDeleteUser = async (userId: number) => {
        try {
            await axios.delete(`http://localhost:8080/user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${effectiveToken}`,
                },
            });
            setAllUsers(allUsers.filter((u) => u.id !== userId));
            setDeleteConfirm(null);
        } catch (err) { }
    };

    const handleEditStart = () => {
        setIsEditing(true);
        setEditError(null);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditError(null);
        if (userData) {
            setEditData({
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phoneNumber: userData.phoneNumber,
            });
        }
    };

    const handleEditSubmit = async () => {
        try {
            setEditLoading(true);
            setEditError(null);

            if (
                !editData.username.trim() ||
                !editData.email.trim() ||
                !editData.firstName.trim() ||
                !editData.lastName.trim()
            ) {
                setEditError("Wszystkie pola są wymagane");
                return;
            }

            const userId = getUserId(effectiveToken);
            if (!userId) {
                setEditError("Nie można określić ID użytkownika");
                return;
            }

            const response = await axios.put(
                `http://localhost:8080/user/${userId}`,
                editData,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            setUserData(response.data);
            setIsEditing(false);
        } catch (err) {
            let errorMessage = "Nie udało się zaktualizować profilu";

            if (axios.isAxiosError(err) && err.response) {
                if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response.data?.error) {
                    errorMessage = err.response.data.error;
                } else if (typeof err.response.data === "string") {
                    errorMessage = err.response.data;
                } else if (err.response.status === 400) {
                    errorMessage =
                        "Podane dane są nieprawidłowe (np. email, username lub telefon już zajęty)";
                } else if (err.response.status === 401) {
                    errorMessage = "Brak uprawnień do edycji tego profilu";
                } else if (err.response.status === 404) {
                    errorMessage = "Nie znaleziono użytkownika";
                }
            }

            setEditError(errorMessage);
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Ładowanie danych...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
                        <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Błąd</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-colors"
                            onClick={() => window.location.reload()}
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                )}

                {!loading && !error && userData && (
                    <>
                        {/* Profil użytkownika */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-3xl font-bold">
                        {userData.firstName[0]}{userData.lastName[0]}
                      </span>
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-white mb-2">
                                                {userData.firstName} {userData.lastName}
                                            </h1>
                                            <p className="text-gray-300">@{userData.username}</p>
                                        </div>
                                    </div>
                                    {!isEditing && (
                                        <button
                                            className="px-6 py-3 bg-white text-amber-800 font-semibold rounded-lg hover:bg-amber-50 transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2"
                                            onClick={handleEditStart}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edytuj profil
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-sm">Email</p>
                                                <p className="font-semibold text-gray-900">{userData.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-sm">Telefon</p>
                                                <p className="font-semibold text-gray-900">{userData.phoneNumber}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-sm">Wypożyczenia</p>
                                                <p className="font-semibold text-gray-900">{rentals.length}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-sm">Rezerwacje</p>
                                                <p className="font-semibold text-gray-900">{bookQueues.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="mt-8 p-8 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Edytuj swoje dane</h3>
                                        {editError && (
                                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-red-700">{editError}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Nazwa użytkownika</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:bg-gray-100"
                                                    value={editData.username}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, username: e.target.value })
                                                    }
                                                    disabled={editLoading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                                <input
                                                    type="email"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:bg-gray-100"
                                                    value={editData.email}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, email: e.target.value })
                                                    }
                                                    disabled={editLoading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Imię</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:bg-gray-100"
                                                    value={editData.firstName}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, firstName: e.target.value })
                                                    }
                                                    disabled={editLoading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Nazwisko</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:bg-gray-100"
                                                    value={editData.lastName}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, lastName: e.target.value })
                                                    }
                                                    disabled={editLoading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                                                <input
                                                    type="tel"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:bg-gray-100"
                                                    value={editData.phoneNumber}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, phoneNumber: e.target.value })
                                                    }
                                                    disabled={editLoading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Nowe hasło (opcjonalnie)</label>
                                                <input
                                                    type="password"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:bg-gray-100"
                                                    placeholder="Zostaw puste jeśli nie chcesz zmieniać hasła"
                                                    value={editData.password || ""}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, password: e.target.value })
                                                    }
                                                    disabled={editLoading}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-8">
                                            <button
                                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-colors disabled:opacity-50"
                                                onClick={handleEditSubmit}
                                                disabled={editLoading}
                                            >
                                                {editLoading ? (
                                                    <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Zapisywanie...
                          </span>
                                                ) : "Zapisz zmiany"}
                                            </button>
                                            <button
                                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                                onClick={handleEditCancel}
                                                disabled={editLoading}
                                            >
                                                Anuluj
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Wypożyczenia */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-bold text-gray-900">Moje Wypożyczenia</h3>
                                <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold">
                  {rentals.length} książek
                </span>
                            </div>

                            {loadingRentals ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : rentals.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-gray-600 text-lg">Nie masz żadnych wypożyczeń.</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-gray-200">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-blue-800 to-blue-900">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Książka</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Autor</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">ISBN</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Data wypożyczenia</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Data zwrotu</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Akcja</th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {rentals.map((rental) => (
                                                <tr key={rental.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">
                                                            {rental.bookItem?.book?.title || "Brak danych"}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700">
                                                        {rental.bookItem?.book?.author || "Brak danych"}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-gray-700">
                                                        {rental.bookItem?.isbn || "Brak danych"}
                                                    </td>
                                                    <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-full ${rental.status === "ACTIVE"
                                  ? 'bg-green-100 text-green-800'
                                  : rental.status === "OVERDUE"
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}>
                                {rental.status === "ACTIVE"
                                    ? "Aktywne"
                                    : rental.status === "OVERDUE"
                                        ? "Po terminie"
                                        : rental.status === "RETURNED"
                                            ? "Zwrócone"
                                            : rental.status}
                              </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700">
                                                        {new Date(rental.startDate).toLocaleDateString("pl-PL")}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700">
                                                        {new Date(rental.endDate).toLocaleDateString("pl-PL")}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {rental.status === "ACTIVE" || rental.status === "OVERDUE" ? (
                                                            <div className="flex justify-center gap-2">
                                                                <button
                                                                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-colors text-sm"
                                                                    onClick={() => handleReturnBook(rental.id)}
                                                                >
                                                                    Zwróć
                                                                </button>
                                                                <button
                                                                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-colors text-sm"
                                                                    onClick={() => handleExtendRental(rental.id)}
                                                                >
                                                                    Przedłuż
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rezerwacje */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-bold text-gray-900">Moje Rezerwacje</h3>
                                <span className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-semibold">
                  {bookQueues.length} w kolejce
                </span>
                            </div>

                            {loadingQueues ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                                </div>
                            ) : bookQueues.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-600 text-lg">Nie masz żadnych rezerwacji w kolejce.</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-gray-200">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-amber-800 to-amber-900">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Książka</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Autor</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Pozycja w kolejce</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Akcje</th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {bookQueues.map((queue) => {
                                                const position = queuePositions[queue.book.id];
                                                return (
                                                    <tr key={queue.id} className="hover:bg-amber-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-gray-900">{queue.book.title}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-700">{queue.book.author}</td>
                                                        <td className="px-6 py-4 text-center">
                                <span className={`px-4 py-2 inline-flex text-sm leading-5 font-bold rounded-full ${position === 1
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                                }`}>
                                  {position !== undefined ? position : "..."}
                                </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-full ${queue.status === "NOTIFIED"
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {queue.status === "NOTIFIED" ? "Gotowe do wypożyczenia" : "Oczekiwanie"}
                                </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex gap-2 justify-center">
                                                                {queue.status === "NOTIFIED" && (
                                                                    <button
                                                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-colors text-sm"
                                                                        onClick={() => navigate(`/book/${queue.book.id}`)}
                                                                    >
                                                                        Przejdź do książki
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="px-4 py-2 border-2 border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors text-sm"
                                                                    onClick={() => handleLeaveQueue(queue.book.id)}
                                                                >
                                                                    Opuść kolejkę
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Zarządzanie użytkownikami (dla admina) */}
                        {adminUser && (
                            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900">Zarządzanie Użytkownikami</h3>
                                    <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-semibold">
                    {allUsers.length} użytkowników
                  </span>
                                </div>

                                {loadingUsers ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-gray-200">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gradient-to-r from-red-800 to-red-900">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Nazwa</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Imię i Nazwisko</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Telefon</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Role</th>
                                                    <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Akcje</th>
                                                </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                {allUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-red-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="font-medium text-gray-900">{user.id}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      {user.firstName[0]}{user.lastName[0]}
                                    </span>
                                                                </div>
                                                                <span className="font-medium text-gray-900">{user.username}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-700">{user.email}</td>
                                                        <td className="px-6 py-4 text-gray-700">
                                                            {user.firstName} {user.lastName}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-700">{user.phoneNumber}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {user.authorities && user.authorities.length > 0
                                                                    ? user.authorities.map((r) => (
                                                                        <span
                                                                            key={r.authority}
                                                                            className="px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded"
                                                                        >
                                        {r.authority.replace('ROLE_', '')}
                                      </span>
                                                                    ))
                                                                    : <span className="text-gray-400 italic">Brak ról</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                                                                onClick={() => setDeleteConfirm(user.id)}
                                                            >
                                                                Usuń
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Potwierdzenie usunięcia użytkownika */}
                                {deleteConfirm !== null && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                                            <div className="text-center">
                                                <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">Usunąć użytkownika?</h3>
                                                <p className="text-gray-600 mb-6">
                                                    Czy na pewno chcesz usunąć użytkownika o ID {deleteConfirm}? Tej operacji nie można cofnąć.
                                                </p>
                                                <div className="flex gap-3 justify-center">
                                                    <button
                                                        className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                                        onClick={() => handleDeleteUser(deleteConfirm)}
                                                    >
                                                        Usuń
                                                    </button>
                                                    <button
                                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                                        onClick={() => setDeleteConfirm(null)}
                                                    >
                                                        Anuluj
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Zarządzanie książkami (dla admina) */}
                        {adminUser && <BookManagement token={effectiveToken} />}
                    </>
                )}
            </div>
        </div>
    );
}