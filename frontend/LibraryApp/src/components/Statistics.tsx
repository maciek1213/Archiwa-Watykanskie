import { useState, useEffect } from "react";
import axios from "axios";

interface BooksBorrowedByUser {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    totalRentals: number;
}

interface BookRentals {
    bookId: number;
    title: string;
    author: string;
    totalRentals: number;
}

interface Props {
    token: string | null;
}

export function Statistics({ token }: Props) {
    const [rentalsPerUser, setRentalsPerUser] = useState<BooksBorrowedByUser[]>([]);
    const [rentalsByBook, setRentalsByBook] = useState<BookRentals[]>([]);
    const [rentalsByBookThisYear, setRentalsByBookThisYear] = useState<BookRentals[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'users' | 'books-all' | 'books-year'>('users');

    const effectiveToken = token || localStorage.getItem("token");

    useEffect(() => {
        if (!effectiveToken) {
            setError("Brak autoryzacji");
            setLoading(false);
            return;
        }

        const fetchStatistics = async () => {
            try {
                setLoading(true);
                setError(null);

                const [usersResponse, booksResponse, booksYearResponse] = await Promise.all([
                    axios.get<BooksBorrowedByUser[]>("http://localhost:8080/stats/rentalsPerUser", {
                        headers: { Authorization: `Bearer ${effectiveToken}` },
                    }),
                    axios.get<BookRentals[]>("http://localhost:8080/stats/rentalsByBook", {
                        headers: { Authorization: `Bearer ${effectiveToken}` },
                    }),
                    axios.get<BookRentals[]>("http://localhost:8080/stats/rentalsByBookThisYear", {
                        headers: { Authorization: `Bearer ${effectiveToken}` },
                    }),
                ]);

                setRentalsPerUser(usersResponse.data);
                setRentalsByBook(booksResponse.data);
                setRentalsByBookThisYear(booksYearResponse.data);
            } catch (err) {
                console.error("Błąd podczas pobierania statystyk:", err);
                setError("Nie udało się pobrać statystyk");
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, [effectiveToken]);

    const getMaxValue = (data: BooksBorrowedByUser[] | BookRentals[]) => {
        if (data.length === 0) return 1;
        return Math.max(...data.map(item => item.totalRentals));
    };

    const renderBarChart = (data: BooksBorrowedByUser[] | BookRentals[], type: 'users' | 'books') => {
        if (data.length === 0) {
            return (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-600 text-lg">Brak danych do wyświetlenia</p>
                </div>
            );
        }

        const maxValue = getMaxValue(data);
        const sortedData = [...data].sort((a, b) => b.totalRentals - a.totalRentals).slice(0, 15);

        return (
            <div className="space-y-4">
                {sortedData.map((item, index) => {
                    const percentage = (item.totalRentals / maxValue) * 100;
                    const isUser = 'username' in item;
                    const label = isUser
                        ? `${item.firstName} ${item.lastName} (@${item.username})`
                        : `${item.title} - ${item.author}`;

                    return (
                        <div key={isUser ? item.userId : item.bookId} className="group">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {index + 1}
                                    </span>
                                    <span className="text-gray-900 font-medium truncate">{label}</span>
                                </div>
                                <span className="ml-4 flex-shrink-0 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold text-sm">
                                    {item.totalRentals}
                                </span>
                            </div>
                            <div className="h-10 bg-gray-100 rounded-xl overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl transition-all duration-700 ease-out flex items-center px-4 group-hover:from-amber-600 group-hover:to-amber-700"
                                    style={{ width: `${percentage}%` }}
                                >
                                    {percentage > 15 && (
                                        <span className="text-white font-semibold text-sm">
                                            {item.totalRentals} {item.totalRentals === 1 ? 'wypożyczenie' : 'wypożyczeń'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderSummaryCards = () => {
        const totalUsers = rentalsPerUser.length;
        const totalBooks = rentalsByBook.length;
        const totalRentalsAllTime = rentalsByBook.reduce((sum, book) => sum + book.totalRentals, 0);
        const totalRentalsThisYear = rentalsByBookThisYear.reduce((sum, book) => sum + book.totalRentals, 0);
        const averageRentalsPerUser = totalUsers > 0 ? (totalRentalsAllTime / totalUsers).toFixed(1) : '0';

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="text-4xl font-bold">{totalUsers}</span>
                    </div>
                    <p className="text-blue-100 text-sm font-medium">Użytkowników z wypożyczeniami</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-4xl font-bold">{totalBooks}</span>
                    </div>
                    <p className="text-purple-100 text-sm font-medium">Książek wypożyczanych</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <span className="text-4xl font-bold">{totalRentalsAllTime}</span>
                    </div>
                    <p className="text-green-100 text-sm font-medium">Wypożyczeń ogółem</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-4xl font-bold">{averageRentalsPerUser}</span>
                    </div>
                    <p className="text-amber-100 text-sm font-medium">Średnio na użytkownika</p>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Ładowanie statystyk...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
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
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Statystyki Biblioteki</h1>
                    <p className="text-gray-600 text-lg">Przegląd aktywności wypożyczeń i popularności książek</p>
                </div>

                {/* Summary Cards */}
                {renderSummaryCards()}

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-xl mb-8">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        <button
                            className={`px-6 py-4 text-lg font-medium whitespace-nowrap ${
                                activeView === 'users'
                                    ? 'text-amber-700 border-b-2 border-amber-700'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setActiveView('users')}
                        >
                            Wypożyczenia na użytkownika
                        </button>
                        <button
                            className={`px-6 py-4 text-lg font-medium whitespace-nowrap ${
                                activeView === 'books-all'
                                    ? 'text-amber-700 border-b-2 border-amber-700'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setActiveView('books-all')}
                        >
                            Najpopularniejsze książki (cały czas)
                        </button>
                        <button
                            className={`px-6 py-4 text-lg font-medium whitespace-nowrap ${
                                activeView === 'books-year'
                                    ? 'text-amber-700 border-b-2 border-amber-700'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setActiveView('books-year')}
                        >
                            Najpopularniejsze książki (ten rok)
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {activeView === 'users' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Top 15 użytkowników z największą liczbą wypożyczeń
                                </h3>
                                <p className="text-gray-600">
                                    Ranking najbardziej aktywnych czytelników w bibliotece
                                </p>
                            </div>
                            {renderBarChart(rentalsPerUser, 'users')}
                        </div>
                    )}

                    {activeView === 'books-all' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Top 15 najpopularniejszych książek (wszystkie lata)
                                </h3>
                                <p className="text-gray-600">
                                    Ranking książek z największą liczbą wypożyczeń w historii
                                </p>
                            </div>
                            {renderBarChart(rentalsByBook, 'books')}
                        </div>
                    )}

                    {activeView === 'books-year' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Top 15 najpopularniejszych książek ({new Date().getFullYear()})
                                </h3>
                                <p className="text-gray-600">
                                    Ranking książek z największą liczbą wypożyczeń w tym roku
                                </p>
                            </div>
                            {renderBarChart(rentalsByBookThisYear, 'books')}
                        </div>
                    )}
                </div>

                {/* Additional info */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-start gap-4">
                        <svg className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Informacje o statystykach</h4>
                            <p className="text-blue-800 text-sm">
                                Statystyki są aktualizowane w czasie rzeczywistym i pokazują TOP 15 pozycji w każdej kategorii.
                                Dane obejmują wszystkie wypożyczenia zarejestrowane w systemie.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}