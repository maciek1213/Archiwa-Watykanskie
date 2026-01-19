import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Category {
    id: number;
    name: string;
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

// Maksymalna liczba jednoczesnych zapytań do API
const MAX_CONCURRENT_REQUESTS = 5;
// Opóźnienie między batchami zapytań (ms)
const BATCH_DELAY = 100;

// Funkcja do dzielenia tablicy na mniejsze części
const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

// Cache dla pobranych okładek
const coverCache: { [key: string]: string } = {};

export function HomePage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [categories, setCategories] = useState<Category[]>([]);
    const [bookCovers, setBookCovers] = useState<{ [key: number]: string }>({});
    const [coversLoading, setCoversLoading] = useState<{ [key: number]: boolean }>({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchBooks();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (books.length > 0) {
            fetchBookCovers();
        }
    }, [books]);

    const fetchBookCovers = useCallback(async () => {
        const booksWithoutCovers = books.filter(
            book => !bookCovers[book.id] && !coverCache[`${book.title}-${book.author}`]
        );

        if (booksWithoutCovers.length === 0) return;

        // Dzielimy książki na mniejsze partie
        const batches = chunkArray(booksWithoutCovers, MAX_CONCURRENT_REQUESTS);
        const newCovers: { [key: number]: string } = { ...bookCovers };
        const loadingState: { [key: number]: boolean } = {};

        // Ustawiamy stan ładowania dla każdej książki
        booksWithoutCovers.forEach(book => {
            loadingState[book.id] = true;
        });
        setCoversLoading(prev => ({ ...prev, ...loadingState }));

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];

            // Wykonujemy równolegle zapytania dla batcha
            const promises = batch.map(async (book) => {
                const cacheKey = `${book.title}-${book.author}`;

                // Sprawdzamy cache
                if (coverCache[cacheKey]) {
                    return { id: book.id, cover: coverCache[cacheKey] };
                }

                try {
                    // Dodajemy losowe opóźnienie (0-300ms) aby rozłożyć zapytania
                    await new Promise(resolve =>
                        setTimeout(resolve, Math.random() * 300)
                    );

                    const response = await fetch(
                        `https://openlibrary.org/search.json?` +
                        `title=${encodeURIComponent(book.title)}` +
                        `&author=${encodeURIComponent(book.author)}` +
                        `&limit=1`
                    );

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();

                    if (data.docs?.[0]?.cover_i) {
                        const coverUrl = `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-M.jpg`;
                        // Zapisz w cache
                        coverCache[cacheKey] = coverUrl;
                        return { id: book.id, cover: coverUrl };
                    }

                    return { id: book.id, cover: '' };
                } catch (err) {
                    console.log(`Nie udało się pobrać okładki dla książki ${book.id}:`, err);
                    return { id: book.id, cover: '' };
                }
            });

            try {
                const results = await Promise.allSettled(promises);

                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value.cover) {
                        newCovers[result.value.id] = result.value.cover;
                    }
                });

                // Aktualizujemy stan po każdym batchu
                setBookCovers(prev => ({ ...prev, ...newCovers }));

                // Usuwamy stan ładowania dla pobranych okładek
                batch.forEach(book => {
                    loadingState[book.id] = false;
                });
                setCoversLoading(prev => ({ ...prev, ...loadingState }));

                // Dodajemy opóźnienie między batchami (opcjonalnie)
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
                }
            } catch (err) {
                console.error('Błąd podczas pobierania batcha okładek:', err);
            }
        }
    }, [books, bookCovers]);

    const fetchBooks = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            setLoading(true);
            const response = await axios.get<Book[]>("http://localhost:8080/book", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setBooks(response.data);
            setError(null);
        } catch (err) {
            setError("Nie udało się pobrać książek");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get<Category[]>("http://localhost:8080/category", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setCategories(response.data);
        } catch (err) {
            console.error("Nie udało się pobrać kategorii");
        }
    };

    const handleBookClick = (bookId: number) => {
        navigate(`/book/${bookId}`);
    };

    const filteredBooks = books.filter((book) => {
        const matchesSearch =
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
            selectedCategory === "all" ||
            book.categories.some(cat => cat.name === selectedCategory);

        return matchesSearch && matchesCategory;
    });

    // Funkcja do lazy loading obrazków
    const handleImageLoad = (bookId: number) => {
        setCoversLoading(prev => ({ ...prev, [bookId]: false }));
    };

    const handleImageError = (bookId: number) => {
        setCoversLoading(prev => ({ ...prev, [bookId]: false }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 tracking-tight">
                            Biblioteka Archiwów Watykańskich
                        </h1>
                        <p className="text-xl md:text-2xl text-amber-100 max-w-3xl mx-auto mb-10">
                            Odkryj niezwykłą kolekcję książek z całego świata. Wiedza czeka na Ciebie.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                className="px-8 py-3 bg-white text-amber-800 font-semibold rounded-lg hover:bg-amber-50 transition-all transform hover:-translate-y-1 shadow-lg"
                                onClick={() => document.getElementById('book-search')?.focus()}
                            >
                                Przeglądaj kolekcję
                            </button>
                            {!localStorage.getItem("token") && (
                                <button
                                    className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-amber-800 transition-all"
                                    onClick={() => navigate("/register")}
                                >
                                    Dołącz do biblioteki
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Wyszukiwarka i filtry */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    id="book-search"
                                    type="text"
                                    className="block w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg"
                                    placeholder="Wyszukaj książkę, autora, tytuł..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <select
                                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">Wszystkie kategorie</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.name}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                        <div className="text-gray-700">
                            <p className="text-lg">
                                Znaleziono <span className="font-bold text-amber-600">{filteredBooks.length}</span> książek
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    fetchBooks();
                                    setBookCovers({});
                                }}
                                className="px-4 py-2 text-amber-700 hover:text-amber-800 font-medium flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Odśwież wszystko
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Główna zawartość */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 text-lg">Ładowanie kolekcji...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <svg className="w-20 h-20 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Błąd ładowania</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-colors"
                            onClick={fetchBooks}
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <div className="text-center py-20">
                        <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Brak wyników</h3>
                        <p className="text-gray-600">Nie znaleziono książek spełniających kryteria wyszukiwania</p>
                        <button
                            className="mt-6 px-6 py-3 border-2 border-amber-600 text-amber-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedCategory("all");
                            }}
                        >
                            Wyczyść filtry
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredBooks.map((book) => (
                            <div
                                key={book.id}
                                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:-translate-y-2 cursor-pointer"
                                onClick={() => handleBookClick(book.id)}
                            >
                                <div className="relative h-48 overflow-hidden">
                                    {coversLoading[book.id] ? (
                                        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                                            <div className="animate-pulse flex flex-col items-center">
                                                <svg className="w-12 h-12 text-amber-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                                <span className="text-amber-500 text-sm">Ładowanie okładki...</span>
                                            </div>
                                        </div>
                                    ) : bookCovers[book.id] ? (
                                        <img
                                            src={bookCovers[book.id]}
                                            alt={`Okładka książki ${book.title}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                            decoding="async"
                                            onLoad={() => handleImageLoad(book.id)}
                                            onError={() => handleImageError(book.id)}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                                            <div className="text-center p-4">
                                                <svg className="w-16 h-16 text-amber-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                                <span className="text-amber-600 text-sm">Brak okładki</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1.5 rounded-full text-sm font-bold shadow ${book.count > 0
                                            ? 'bg-green-500 text-white'
                                            : 'bg-red-500 text-white'
                                        }`}>
                                            {book.count} dostępnych
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
                                        {book.title}
                                    </h3>
                                    <p className="text-amber-600 font-medium mb-3">{book.author}</p>

                                    {/* Wyświetlanie oceny */}
                                    {book.reviewCount && book.reviewCount > 0 ? (
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex items-center">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <svg
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= Math.round(book.averageRating || 0)
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
                                            <span className="text-sm text-gray-600 font-medium">
                                                {book.averageRating?.toFixed(1)} ({book.reviewCount} {book.reviewCount === 1 ? 'opinia' : 'opinii'})
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-sm text-gray-400">Brak opinii</span>
                                        </div>
                                    )}

                                    {book.categories && book.categories.length > 0 && (
                                        <div className="mb-6">
                                            <div className="flex flex-wrap gap-2">
                                                {book.categories.map((category) => (
                                                    <span
                                                        key={category.id}
                                                        className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold"
                                                    >
                                                        {category.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <button
                                            className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${book.count > 0
                                                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800'
                                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBookClick(book.id);
                                            }}
                                            disabled={book.count === 0}
                                        >
                                            {book.count > 0 ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                    </svg>
                                                    Zobacz szczegóły
                                                </span>
                                            ) : (
                                                "Niedostępna"
                                            )}
                                        </button>
                                        <span className="text-sm text-gray-500">
                                            ID: {book.id}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sekcja dla niezalogowanych */}
            {!localStorage.getItem("token") && (
                <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Dołącz do naszej społeczności czytelników</h2>
                        <p className="text-xl text-amber-100 max-w-3xl mx-auto mb-10">
                            Zarejestruj się, aby wypożyczać książki, tworzyć rezerwacje i śledzić swoje wypożyczenia.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                className="px-8 py-3 bg-white text-amber-800 font-semibold rounded-lg hover:bg-amber-50 transition-all transform hover:-translate-y-1 shadow-lg"
                                onClick={() => navigate("/register")}
                            >
                                Zarejestruj się za darmo
                            </button>
                            <button
                                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-amber-800 transition-all"
                                onClick={() => navigate("/login")}
                            >
                                Zaloguj się
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stopka */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-2xl font-serif font-bold mb-4">Biblioteka Watykańska</h3>
                            <p className="text-gray-400">
                                Ochrona i udostępnianie światowego dziedzictwa literackiego od 1475 roku.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-4">Godziny otwarcia</h4>
                            <p className="text-gray-400">Poniedziałek - Piątek: 8:00 - 20:00</p>
                            <p className="text-gray-400">Sobota: 9:00 - 16:00</p>
                            <p className="text-gray-400">Niedziela: 10:00 - 14:00</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-4">Kontakt</h4>
                            <p className="text-gray-400">00120 Watykan</p>
                            <p className="text-gray-400">+39 06 6987 511</p>
                            <p className="text-gray-400">biblioteka@vatlib.va</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-4">Statystyki</h4>
                            <p className="text-gray-400">Książek: {books.length}</p>
                            <p className="text-gray-400">Kategorii: {categories.length}</p>
                            <p className="text-gray-400">Dostępnych egzemplarzy: {books.reduce((sum, book) => sum + book.count, 0)}</p>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>© {new Date().getFullYear()} Biblioteka Archiwów Watykańskich. Wszelkie prawa zastrzeżone.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}