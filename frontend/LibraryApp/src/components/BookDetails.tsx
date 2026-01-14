import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getUserId, isAdmin } from "../utils/tokenUtils.ts";

interface Category {
    id: number;
    name: string;
}

interface BookItem {
    id: number;
    isbn: string;
    isAvailable: boolean;
}

interface Book {
    id: number;
    title: string;
    author: string;
    count: number;
    categories: Category[];
    averageRating?: number;
    reviewCount?: number;
}

interface Review {
    id: number;
    rating: number;
    description: string | null;
    user: {
        id: number;
        username: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

interface ReviewData {
    reviews: Review[];
    averageRating: number;
    reviewCount: number;
}

interface QueueUser {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface AdminQueueItem {
    id: number;
    user: QueueUser;
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

export function BookDetails({ token }: Props) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [book, setBook] = useState<Book | null>(null);
    const [bookItems, setBookItems] = useState<BookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingItems, setLoadingItems] = useState(false);
    const [queuePosition, setQueuePosition] = useState<number>(-1);
    const [loadingQueue, setLoadingQueue] = useState(false);
    const [hasQueue, setHasQueue] = useState<boolean>(false);
    const [hasActiveRental, setHasActiveRental] = useState<boolean>(false);
    const [isReservedForOther, setIsReservedForOther] = useState<boolean>(false);
    const [showAdminQueue, setShowAdminQueue] = useState<boolean>(false);
    const [adminQueueData, setAdminQueueData] = useState<AdminQueueItem[]>([]);
    const [loadingAdminQueue, setLoadingAdminQueue] = useState<boolean>(false);
    const [bookCover, setBookCover] = useState<string | null>(null);

    // Reviews state
    const [reviewData, setReviewData] = useState<ReviewData | null>(null);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [newRating, setNewRating] = useState<number>(5);
    const [newDescription, setNewDescription] = useState<string>("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [userReview, setUserReview] = useState<Review | null>(null);

    const effectiveToken = token || localStorage.getItem("token");
    const adminUser = isAdmin(effectiveToken);

    useEffect(() => {
        fetchBookDetails();
        checkQueueStatus();
        checkActiveRental();
        fetchReviews();
    }, [id]);

    useEffect(() => {
        if (book) {
            fetchBookCover();
        }
    }, [bookItems]);


    const fetchBookCover = async () => {
        if (!book) return;

        try {
            const isbn = bookItems.length > 0 ? bookItems[0].isbn : null;

            if (!isbn) return;


            const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`);

            if (response.status === 200) {
                setBookCover(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`);
            }
        } catch (err) {
            // Fallback do innego API jeśli pierwsze nie działa
            try {
                const isbn = bookItems.length > 0 ? bookItems[0].isbn : null;
                if (!isbn) return;

                const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
                const data = await response.json();
                if (data.items && data.items[0] && data.items[0].volumeInfo.imageLinks) {
                    setBookCover(data.items[0].volumeInfo.imageLinks.thumbnail.replace('http://', 'https://'));
                }
            } catch (error) {

            }
        }
    };

    const checkActiveRental = async () => {
        try {
            const userId = getUserId(effectiveToken);
            if (!userId || !id) return;

            const response = await axios.get(
                `http://localhost:8080/rentals/user/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            const hasRental = response.data.some(
                (rental: any) =>
                    rental.status === "ACTIVE" &&
                    rental.bookItem?.book?.id === parseInt(id)
            );
            setHasActiveRental(hasRental);
        } catch (err) {
            console.error("Nie udało się sprawdzić aktywnych wypożyczeń", err);
        }
    };

    const fetchBookDetails = async () => {
        try {
            setLoading(true);

            const bookResponse = await axios.get<Book>(
                `http://localhost:8080/book/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );
            setBook(bookResponse.data);

            await fetchBookItems(parseInt(id!));

            setError(null);
        } catch (err) {
            setError("Nie udało się pobrać szczegółów książki");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookItems = async (bookId: number) => {
        try {
            setLoadingItems(true);
            const response = await axios.get<BookItem[]>(
                `http://localhost:8080/book/${bookId}/items`,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );
            setBookItems(response.data);
        } catch (err) {
            console.error("Nie udało się pobrać egzemplarzy");
        } finally {
            setLoadingItems(false);
        }
    };

    const handleBorrowBook = async () => {
        try {
            const userId = getUserId(effectiveToken);
            if (!userId || !id) {
                alert("Nie można określić ID użytkownika");
                return;
            }

            await axios.post(
                `http://localhost:8080/rentals/rent-by-book`,
                null,
                {
                    params: {
                        userId: userId,
                        bookId: id
                    },
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            alert("Książka została wypożyczona!");
            await fetchBookDetails();
            await checkQueueStatus();
            await checkActiveRental();
        } catch (err: any) {
            let errorMessage = "Nie udało się wypożyczyć książki";
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            alert(errorMessage);
        }
    };

    const checkQueueStatus = async () => {
        try {
            const userId = getUserId(effectiveToken);
            if (!userId || !id) return;

            setLoadingQueue(true);

            const hasQueueResponse = await axios.get<boolean>(
                `http://localhost:8080/queue/book/${id}/has-queue`,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );
            setHasQueue(hasQueueResponse.data);

            const isReservedResponse = await axios.get<boolean>(
                `http://localhost:8080/queue/book/${id}/is-reserved`,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );
            const reserved = isReservedResponse.data;

            const positionResponse = await axios.get<number>(
                `http://localhost:8080/queue/book/${id}/position`,
                {
                    params: { userId },
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );
            setQueuePosition(positionResponse.data);

            setIsReservedForOther(reserved && positionResponse.data !== 1);
        } catch (err) {
            console.error("Nie udało się sprawdzić statusu kolejki", err);
        } finally {
            setLoadingQueue(false);
        }
    };

    const handleReserveBook = async () => {
        try {
            const userId = getUserId(effectiveToken);
            if (!userId || !id) {
                alert("Nie można określić ID użytkownika");
                return;
            }

            await axios.post(
                `http://localhost:8080/queue/reserve`,
                null,
                {
                    params: {
                        userId: userId,
                        bookId: id
                    },
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            alert("Zostałeś dodany do kolejki! Otrzymasz powiadomienie gdy książka będzie dostępna.");
            checkQueueStatus();
            fetchBookDetails();
        } catch (err: any) {
            const errorMessage = err.response?.data || "Nie udało się zarezerwować książki";
            alert(errorMessage);
        }
    };

    const handleLeaveQueue = async () => {
        try {
            const userId = getUserId(effectiveToken);
            if (!userId || !id) {
                alert("Nie można określić ID użytkownika");
                return;
            }

            if (!confirm("Czy na pewno chcesz opuścić kolejkę?")) {
                return;
            }

            await axios.delete(
                `http://localhost:8080/queue/leave`,
                {
                    params: {
                        userId: userId,
                        bookId: id
                    },
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            alert("Opuściłeś kolejkę.");
            await checkQueueStatus();
            await fetchBookDetails();
        } catch (err: any) {
            let errorMessage = "Nie udało się opuścić kolejki";
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            alert(errorMessage);
        }
    };

    const fetchAdminQueue = async () => {
        if (!id || !adminUser) return;

        try {
            setLoadingAdminQueue(true);
            const response = await axios.get<AdminQueueItem[]>(
                `http://localhost:8080/queue/book/${id}/details`,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );
            setAdminQueueData(response.data);
        } catch (err) {
            console.error("Nie udało się pobrać szczegółów kolejki", err);
        } finally {
            setLoadingAdminQueue(false);
        }
    };

    const fetchReviews = async () => {
        if (!id) return;

        try {
            setLoadingReviews(true);
            const response = await axios.get<ReviewData>(
                `http://localhost:8080/book/${id}/reviews`,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );
            setReviewData(response.data);

            // Check if current user has already reviewed
            const userId = getUserId(effectiveToken);
            if (userId) {
                const currentUserReview = response.data.reviews.find(
                    (r) => r.user.id === userId
                );
                setUserReview(currentUserReview || null);
            }
        } catch (err) {
            console.error("Nie udało się pobrać opinii", err);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!id) return;

        try {
            setSubmittingReview(true);
            await axios.post(
                `http://localhost:8080/book/${id}/reviews`,
                {
                    rating: newRating,
                    description: newDescription.trim() || null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            alert("Opinia została dodana!");
            setNewRating(5);
            setNewDescription("");
            await fetchReviews();
            await fetchBookDetails(); // Refresh book data to update average rating
        } catch (err: any) {
            let errorMessage = "Nie udało się dodać opinii";
            if (err.response?.status === 409) {
                errorMessage = "Już dodałeś opinię do tej książki";
            } else if (err.response?.data) {
                if (typeof err.response.data === "string") {
                    errorMessage = err.response.data;
                }
            }
            alert(errorMessage);
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
        if (!id) return;

        const confirmed = window.confirm("Czy na pewno chcesz usunąć tę opinię?");
        if (!confirmed) return;

        try {
            await axios.delete(
                `http://localhost:8080/book/${id}/reviews/${reviewId}`,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            alert("Opinia została usunięta!");
            await fetchReviews();
            await fetchBookDetails(); // Refresh book data to update average rating
        } catch (err: any) {
            let errorMessage = "Nie udało się usunąć opinii";
            if (err.response?.status === 403) {
                errorMessage = "Nie masz uprawnień do usunięcia tej opinii";
            } else if (err.response?.status === 404) {
                errorMessage = "Opinia nie została znaleziona";
            } else if (err.response?.data) {
                if (typeof err.response.data === "string") {
                    errorMessage = err.response.data;
                }
            }
            alert(errorMessage);
        }
    };

    const toggleAdminQueue = () => {
        if (!showAdminQueue) {
            fetchAdminQueue();
        }
        setShowAdminQueue(!showAdminQueue);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-amber-200 rounded w-64 mb-4"></div>
                        <div className="h-96 bg-amber-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h3 className="text-2xl font-bold text-red-600 mb-4">Błąd</h3>
                        <p className="text-gray-700 mb-6">{error || "Książka nie została znaleziona"}</p>
                        <button
                            className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                            onClick={() => navigate("/")}
                        >
                            Powrót do listy książek
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const hasAvailableItems = bookItems.some(item => item.isAvailable);
    const allItemsUnavailable = bookItems.length > 0 && bookItems.every(item => !item.isAvailable);
    const canBorrowDirectly = !loadingQueue && ((!hasQueue || queuePosition === 1) && !isReservedForOther);

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <button
                    className="mb-6 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                    onClick={() => navigate("/")}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Powrót do listy książek
                </button>

                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Lewa kolumna - zdjęcie i podstawowe info */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                {bookCover ? (
                                    <div className="mb-6 overflow-hidden rounded-xl shadow-lg">
                                        <img
                                            src={bookCover}
                                            alt={`Okładka książki ${book.title}`}
                                            className="w-full h-auto object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=Brak+okładki';
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="mb-6 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl shadow-lg p-12 flex items-center justify-center">
                                        <div className="text-center">
                                            <svg className="w-24 h-24 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                            <p className="text-amber-700 font-medium">Brak dostępnej okładki</p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg font-semibold text-gray-700">Dostępność:</span>
                                        <span className={`px-4 py-2 rounded-full font-bold ${book.count > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {book.count} dostępnych
                    </span>
                                    </div>

                                    {hasAvailableItems && (
                                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                            <p className="text-sm text-green-700">
                                                System automatycznie wybierze dostępny egzemplarz
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Prawa kolumna - szczegóły */}
                        <div className="lg:col-span-2">
                            <div className="mb-8">
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">{book.title}</h1>
                                <h2 className="text-2xl text-amber-700 font-medium mb-4">{book.author}</h2>

                                {/* Wyświetlanie średniej oceny */}
                                {reviewData && reviewData.reviewCount > 0 ? (
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg
                                                    key={star}
                                                    className={`w-6 h-6 ${
                                                        star <= Math.round(reviewData.averageRating)
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                    }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                                    />
                                                </svg>
                                            ))}
                                        </div>
                                        <span className="text-xl font-semibold text-gray-700">
                                            {reviewData.averageRating.toFixed(1)} / 5
                                        </span>
                                        <span className="text-gray-500">
                                            ({reviewData.reviewCount} {reviewData.reviewCount === 1 ? 'opinia' : 'opinii'})
                                        </span>
                                    </div>
                                ) : (
                                    <div className="mb-6">
                                        <span className="text-gray-500">Brak opinii</span>
                                    </div>
                                )}

                                {/* Kategorie */}
                                {book.categories && book.categories.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Kategorie:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {book.categories.map((category) => (
                                                <span
                                                    key={category.id}
                                                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-semibold text-sm shadow-sm"
                                                >
                          {category.name}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Statusy */}
                                {isReservedForOther && hasAvailableItems && (
                                    <div className="mb-6 p-5 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h4 className="text-lg font-medium text-yellow-800">Książka zarezerwowana</h4>
                                                <p className="mt-1 text-yellow-700">
                                                    Ta książka jest zarezerwowana dla użytkownika z kolejki.
                                                    Nie możesz jej wypożyczyć dopóki ta osoba nie odbierze książki lub nie upłynie czas rezerwacji.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {hasQueue && hasAvailableItems && queuePosition !== 1 && !isReservedForOther && (
                                    <div className="mb-6 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h4 className="text-lg font-medium text-blue-800">Książka zarezerwowana</h4>
                                                <p className="mt-1 text-blue-700">
                                                    {queuePosition > 0
                                                        ? `Będziesz mógł wypożyczyć książkę gdy będziesz pierwszy w kolejce (aktualna pozycja: ${queuePosition}).`
                                                        : "Jest kolejka rezerwacji. Aby wypożyczyć tę książkę, musisz najpierw zarezerwować miejsce w kolejce."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {allItemsUnavailable && !hasActiveRental && (
                                    <div className="mb-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h4 className="text-lg font-medium text-red-800">Brak dostępnych egzemplarzy</h4>
                                                <p className="mt-1 text-red-700">
                                                    Wszystkie egzemplarze są wypożyczone. {queuePosition <= 0 && "Możesz zarezerwować miejsce w kolejce poniżej."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Przyciski akcji */}
                            {!hasActiveRental && (
                                <div className="mb-10">
                                    <div className="flex flex-wrap gap-4 items-center">
                                        {hasAvailableItems ? (
                                            canBorrowDirectly ? (
                                                <>
                                                    <button
                                                        onClick={handleBorrowBook}
                                                        disabled={loadingQueue}
                                                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                                                    >
                                                        {loadingQueue ? (
                                                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sprawdzanie...
                              </span>
                                                        ) : (
                                                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Wypożycz książkę
                              </span>
                                                        )}
                                                    </button>
                                                    {queuePosition === 1 && (
                                                        <button
                                                            onClick={handleLeaveQueue}
                                                            disabled={loadingQueue}
                                                            className="px-6 py-3 border-2 border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                                                        >
                                                            Zrezygnuj z rezerwacji
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={handleReserveBook}
                                                        disabled={queuePosition > 0 || loadingQueue}
                                                        className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all transform hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                                                    >
                                                        {loadingQueue ? (
                                                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sprawdzanie...
                              </span>
                                                        ) : queuePosition > 0 ? (
                                                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                W kolejce ({queuePosition})
                              </span>
                                                        ) : (
                                                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                📋 Zarezerwuj miejsce
                              </span>
                                                        )}
                                                    </button>
                                                    {queuePosition > 0 && (
                                                        <button
                                                            onClick={handleLeaveQueue}
                                                            disabled={loadingQueue}
                                                            className="px-6 py-3 border-2 border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                                                        >
                                                            Opuść kolejkę
                                                        </button>
                                                    )}
                                                </>
                                            )
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleReserveBook}
                                                    disabled={queuePosition > 0 || loadingQueue}
                                                    className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all transform hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                                                >
                                                    {loadingQueue ? (
                                                        <span className="flex items-center gap-2">
                              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sprawdzanie...
                            </span>
                                                    ) : queuePosition > 0 ? (
                                                        <span className="flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              W kolejce ({queuePosition})
                            </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              📋 Zarezerwuj miejsce w kolejce
                            </span>
                                                    )}
                                                </button>
                                                {queuePosition > 0 && (
                                                    <button
                                                        onClick={handleLeaveQueue}
                                                        disabled={loadingQueue}
                                                        className="px-6 py-3 border-2 border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                                                    >
                                                        Opuść kolejkę
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Panel admina */}
                            {adminUser && (
                                <div className="mb-8">
                                    <button
                                        onClick={toggleAdminQueue}
                                        className="w-full p-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-900 hover:to-black transition-all flex justify-between items-center"
                                    >
                                        <span className="font-bold text-lg">Szczegóły kolejki</span>
                                        <span className="text-xl">{showAdminQueue ? "▲" : "▼"}</span>
                                    </button>

                                    {showAdminQueue && (
                                        <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                            {loadingAdminQueue ? (
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                                                </div>
                                            ) : adminQueueData.length === 0 ? (
                                                <p className="text-gray-600 text-center">Brak użytkowników w kolejce.</p>
                                            ) : (
                                                <div>
                                                    <p className="font-bold text-gray-800 mb-4">
                                                        Liczba osób w kolejce: <span className="text-amber-600">{adminQueueData.length}</span>
                                                    </p>
                                                    <ol className="space-y-3">
                                                        {adminQueueData.map((item) => (
                                                            <li key={item.id} className="p-4 bg-white rounded-lg border border-gray-200">
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <strong className="text-gray-900">{item.user.firstName} {item.user.lastName}</strong>
                                                                        <p className="text-sm text-gray-600">{item.user.email}</p>
                                                                    </div>
                                                                    {item.status === "NOTIFIED" && (
                                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                                      POWIADOMIONY
                                    </span>
                                                                    )}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Egzemplarze */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Dostępne egzemplarze</h3>

                                {loadingItems ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                                    </div>
                                ) : bookItems.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-gray-600">Brak dostępnych egzemplarzy tej książki</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">ISBN</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {bookItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{item.isbn}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${item.isAvailable
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.isAvailable ? "Dostępny" : "Wypożyczony"}
                              </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Sekcja opinii */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Opinie czytelników</h3>

                                {/* Formularz dodawania opinii */}
                                {!userReview ? (
                                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-6 mb-8 border border-amber-200">
                                        <h4 className="text-xl font-semibold text-gray-900 mb-4">Dodaj swoją opinię</h4>
                                        <form onSubmit={handleSubmitReview}>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    Ocena:
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setNewRating(star)}
                                                            className="focus:outline-none transition-transform hover:scale-110"
                                                        >
                                                            <svg
                                                                className={`w-8 h-8 ${
                                                                    star <= newRating
                                                                        ? 'text-yellow-400 fill-current'
                                                                        : 'text-gray-300'
                                                                }`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                                                />
                                                            </svg>
                                                        </button>
                                                    ))}
                                                    <span className="ml-2 text-lg font-semibold text-gray-700">
                                                        {newRating} / 5
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    Opis (opcjonalnie):
                                                </label>
                                                <textarea
                                                    value={newDescription}
                                                    onChange={(e) => setNewDescription(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                                    rows={4}
                                                    placeholder="Podziel się swoją opinią o książce..."
                                                    maxLength={1000}
                                                />
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {newDescription.length} / 1000 znaków
                                                </p>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={submittingReview}
                                                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {submittingReview ? 'Dodawanie...' : 'Dodaj opinię'}
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 rounded-xl p-6 mb-8 border border-green-200">
                                        <p className="text-green-800 font-medium">
                                            ✓ Dodałeś już opinię do tej książki
                                        </p>
                                    </div>
                                )}

                                {/* Lista opinii */}
                                {loadingReviews ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                                    </div>
                                ) : reviewData && reviewData.reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviewData.reviews.map((review) => {
                                            const currentUserId = getUserId(effectiveToken);
                                            const canDelete = adminUser || (currentUserId && review.user.id === currentUserId);
                                            
                                            return (
                                            <div
                                                key={review.id}
                                                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h5 className="font-semibold text-lg text-gray-900">
                                                            {review.user.firstName} {review.user.lastName}
                                                        </h5>
                                                        <p className="text-sm text-gray-500">
                                                            @{review.user.username}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <svg
                                                                        key={star}
                                                                        className={`w-5 h-5 ${
                                                                            star <= review.rating
                                                                                ? 'text-yellow-400 fill-current'
                                                                                : 'text-gray-300'
                                                                        }`}
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                                                        />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                            <span className="font-semibold text-gray-700">
                                                                {review.rating}/5
                                                            </span>
                                                        </div>
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => handleDeleteReview(review.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Usuń opinię"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {review.description && (
                                                    <p className="text-gray-700 mb-3 leading-relaxed">
                                                        {review.description}
                                                    </p>
                                                )}

                                                <p className="text-sm text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString('pl-PL', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                        <p className="text-gray-600 text-lg">Brak opinii</p>
                                        <p className="text-gray-500 mt-2">Bądź pierwszym, który oceni tę książkę!</p>
                                    </div>
                                )}
                            </div>

                            {/* Informacje o wypożyczeniu */}
                            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                                <h4 className="text-xl font-bold text-gray-900 mb-4">Informacje o wypożyczeniu</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="font-semibold text-gray-800">Okres wypożyczenia</p>
                                            <p className="text-gray-600">Maksymalnie 30 dni</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <div>
                                            <p className="font-semibold text-gray-800">Przedłużenie</p>
                                            <p className="text-gray-600">Możliwość 1 przedłużenia</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="font-semibold text-gray-800">Kara za przetrzymanie</p>
                                            <p className="text-gray-600">1 zł za każdy dzień</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <div>
                                            <p className="font-semibold text-gray-800">Rezerwacja</p>
                                            <p className="text-gray-600">Możliwa na 7 dni</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}