import { useEffect, useState } from "react";
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
}

interface BookItem {
    id: number;
    isbn: string;
    isAvailable: boolean;
}

interface Props {
    token: string | null;
}

export function BookManagement({ token }: Props) {
    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isAddingBook, setIsAddingBook] = useState(false);
    const [editingBookId, setEditingBookId] = useState<number | null>(null);
    const [bookFormData, setBookFormData] = useState({
        title: "",
        author: "",
        count: 0,
        categoryIds: [] as number[],
    });
    const [bookFormError, setBookFormError] = useState<string | null>(null);

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [categoryFormData, setCategoryFormData] = useState({
        name: "",
    });
    const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
    const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<number | null>(null);

    const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
    const [bookItems, setBookItems] = useState<BookItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [itemFormData, setItemFormData] = useState({
        isbn: "",
        isAvailable: true,
    });
    const [itemFormError, setItemFormError] = useState<string | null>(null);

    const [deleteConfirmBook, setDeleteConfirmBook] = useState<number | null>(null);
    const [deleteConfirmItem, setDeleteConfirmItem] = useState<number | null>(null);

    const effectiveToken = token || localStorage.getItem("token");

    useEffect(() => {
        fetchBooks();
        fetchCategories();
    }, []);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await axios.get<Book[]>("http://localhost:8080/book", {
                headers: {
                    Authorization: `Bearer ${effectiveToken}`,
                },
            });
            setBooks(response.data);
            setError(null);
        } catch (err) {
            setError("Nie udało się pobrać książek");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get<Category[]>("http://localhost:8080/category", {
                headers: {
                    Authorization: `Bearer ${effectiveToken}`,
                },
            });
            setCategories(response.data);
        } catch (err) {
            console.error("Nie udało się pobrać kategorii");
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

    const handleAddBook = async () => {
        try {
            setBookFormError(null);
            if (!bookFormData.title || !bookFormData.author) {
                setBookFormError("Tytuł i autor są wymagane");
                return;
            }

            const bookData = {
                title: bookFormData.title,
                author: bookFormData.author,
                count: bookFormData.count,
                categories: bookFormData.categoryIds.map(id => {
                    const category = categories.find(c => c.id === id);
                    return category ? { id: category.id, name: category.name } : null;
                }).filter(Boolean),
            };

            await axios.post("http://localhost:8080/book", bookData, {
                headers: {
                    Authorization: `Bearer ${effectiveToken}`,
                },
            });

            setIsAddingBook(false);
            setBookFormData({ title: "", author: "", count: 0, categoryIds: [] });
            fetchBooks();
        } catch (err) {
            setBookFormError("Nie udało się dodać książki");
        }
    };

    const handleUpdateBook = async () => {
        if (!editingBookId) return;

        try {
            setBookFormError(null);

            const bookData = {
                title: bookFormData.title,
                author: bookFormData.author,
                count: bookFormData.count,
                categories: bookFormData.categoryIds.map(id => ({ id })),
            };

            await axios.put(
                `http://localhost:8080/book/${editingBookId}`,
                bookData,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            setEditingBookId(null);
            setBookFormData({ title: "", author: "", count: 0, categoryIds: [] });
            fetchBooks();
        } catch (err) {
            setBookFormError("Nie udało się zaktualizować książki");
        }
    };

    const handleDeleteBook = async (bookId: number) => {
        try {
            await axios.delete(`http://localhost:8080/book/${bookId}`, {
                headers: {
                    Authorization: `Bearer ${effectiveToken}`,
                },
            });

            setBooks(books.filter((b) => b.id !== bookId));
            setDeleteConfirmBook(null);
            if (selectedBookId === bookId) {
                setSelectedBookId(null);
                setBookItems([]);
            }
        } catch (err) {
            setError("Nie udało się usunąć książki");
        }
    };

    const startEditBook = (book: Book) => {
        setEditingBookId(book.id);
        setBookFormData({
            title: book.title,
            author: book.author,
            count: book.count,
            categoryIds: book.categories.map(c => c.id),
        });
        setIsAddingBook(false);
    };

    const cancelBookForm = () => {
        setIsAddingBook(false);
        setEditingBookId(null);
        setBookFormData({ title: "", author: "", count: 0, categoryIds: [] });
        setBookFormError(null);
    };

    const toggleCategory = (categoryId: number) => {
        setBookFormData(prev => ({
            ...prev,
            categoryIds: prev.categoryIds.includes(categoryId)
                ? prev.categoryIds.filter(id => id !== categoryId)
                : [...prev.categoryIds, categoryId]
        }));
    };

    const handleAddCategory = async () => {
        try {
            setCategoryFormError(null);
            if (!categoryFormData.name) {
                setCategoryFormError("Nazwa kategorii jest wymagane");
                return;
            }

            await axios.post("http://localhost:8080/category", categoryFormData, {
                headers: {
                    Authorization: `Bearer ${effectiveToken}`,
                },
            });

            setIsAddingCategory(false);
            setCategoryFormData({ name: "" });
            fetchCategories();
        } catch (err: any) {
            setCategoryFormError(err.response?.data || "Nie udało się dodać kategorii");
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategoryId) return;

        try {
            setCategoryFormError(null);
            await axios.put(
                `http://localhost:8080/category/${editingCategoryId}`,
                categoryFormData,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            setEditingCategoryId(null);
            setCategoryFormData({ name: "" });
            fetchCategories();
            fetchBooks();
        } catch (err: any) {
            setCategoryFormError(err.response?.data || "Nie udało się zaktualizować kategorii");
        }
    };

    const handleDeleteCategory = async (categoryId: number) => {
        try {
            await axios.delete(`http://localhost:8080/category/${categoryId}`, {
                headers: {
                    Authorization: `Bearer ${effectiveToken}`,
                },
            });

            setCategories(categories.filter((c) => c.id !== categoryId));
            setDeleteConfirmCategory(null);
            fetchBooks();
        } catch (err: any) {
            setError(err.response?.data || "Nie udało się usunąć kategorii");
        }
    };

    const startEditCategory = (category: Category) => {
        setEditingCategoryId(category.id);
        setCategoryFormData({ name: category.name });
        setIsAddingCategory(false);
    };

    const cancelCategoryForm = () => {
        setEditingCategoryId(null);
        setIsAddingCategory(false);
        setCategoryFormData({ name: "" });
        setCategoryFormError(null);
    };

    const handleAddBookItem = async () => {
        if (!selectedBookId) return;

        try {
            setItemFormError(null);
            if (!itemFormData.isbn) {
                setItemFormError("ISBN jest wymagany");
                return;
            }

            await axios.post(
                `http://localhost:8080/book/${selectedBookId}/items`,
                itemFormData,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            setIsAddingItem(false);
            setItemFormData({ isbn: "", isAvailable: true });

            fetchBookItems(selectedBookId);
            fetchBooks();
        } catch (err) {
            setItemFormError("Nie udało się dodać egzemplarza");
        }
    };

    const handleUpdateBookItem = async () => {
        if (!editingItemId) return;

        try {
            setItemFormError(null);
            await axios.put(
                `http://localhost:8080/book/items/${editingItemId}`,
                itemFormData,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            setEditingItemId(null);
            setItemFormData({ isbn: "", isAvailable: true });
            if (selectedBookId) fetchBookItems(selectedBookId);
        } catch (err) {
            setItemFormError("Nie udało się zaktualizować egzemplarza");
        }
    };

    const handleDeleteBookItem = async (itemId: number) => {
        try {
            await axios.delete(`http://localhost:8080/book/items/${itemId}`, {
                headers: {
                    Authorization: `Bearer ${effectiveToken}`,
                },
            });

            setBookItems(bookItems.filter((i) => i.id !== itemId));
            setDeleteConfirmItem(null);
            fetchBooks();
        } catch (err) {
            setError("Nie udało się usunąć egzemplarza");
        }
    };

    const startEditItem = (item: BookItem) => {
        setEditingItemId(item.id);
        setItemFormData({
            isbn: item.isbn,
            isAvailable: item.isAvailable,
        });
        setIsAddingItem(false);
    };

    const cancelItemForm = () => {
        setIsAddingItem(false);
        setEditingItemId(null);
        setItemFormData({ isbn: "", isAvailable: true });
        setItemFormError(null);
    };

    const showBookItems = (bookId: number) => {
        setSelectedBookId(bookId);
        fetchBookItems(bookId);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900">Zarządzanie Książkami</h3>
                <div className="flex gap-3">
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all transform hover:-translate-y-0.5 shadow-lg"
                        onClick={() => setIsAddingBook(true)}
                        disabled={isAddingBook || editingBookId !== null}
                    >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Dodaj książkę
            </span>
                    </button>
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all transform hover:-translate-y-0.5 shadow-lg"
                        onClick={() => setIsAddingCategory(true)}
                        disabled={isAddingCategory || editingCategoryId !== null}
                    >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Dodaj kategorię
            </span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Formularz dodawania/edycji książki */}
            {(isAddingBook || editingBookId) && (
                <div className="mb-8 p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200 shadow-lg">
                    <h4 className="text-2xl font-bold text-gray-900 mb-6">{editingBookId ? "Edytuj książkę" : "Dodaj książkę"}</h4>
                    {bookFormError && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700">{bookFormError}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Tytuł</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                value={bookFormData.title}
                                onChange={(e) =>
                                    setBookFormData({ ...bookFormData, title: e.target.value })
                                }
                                placeholder="Wpisz tytuł książki"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Autor</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                value={bookFormData.author}
                                onChange={(e) =>
                                    setBookFormData({ ...bookFormData, author: e.target.value })
                                }
                                placeholder="Wpisz autora"
                            />
                        </div>
                    </div>

                    {/* Wybór kategorii */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Kategorie</label>
                        <div className="flex flex-wrap gap-3">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => toggleCategory(category.id)}
                                    className={`px-5 py-2.5 rounded-lg font-medium transition-all ${bookFormData.categoryIds.includes(category.id)
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-amber-400'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                            {categories.length === 0 && (
                                <p className="text-gray-500 italic">
                                    Brak dostępnych kategorii. Dodaj kategorie poniżej.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-colors"
                            onClick={editingBookId ? handleUpdateBook : handleAddBook}
                        >
                            {editingBookId ? "Zapisz zmiany" : "Dodaj książkę"}
                        </button>
                        <button
                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={cancelBookForm}
                        >
                            Anuluj
                        </button>
                    </div>
                </div>
            )}

            {/* Lista książek */}
            <div className="mb-12">
                <h4 className="text-xl font-bold text-gray-900 mb-6">Lista książek ({books.length})</h4>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 shadow">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Tytuł</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Autor</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Kategorie</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Egzemplarze</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Akcje</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {books.map((book) => (
                                    <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{book.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{book.author}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {book.categories && book.categories.length > 0 ? (
                                                    book.categories.map((category) => (
                                                        <span
                                                            key={category.id}
                                                            className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full text-xs font-semibold"
                                                        >
                                {category.name}
                              </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 italic text-sm">Brak</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-full ${book.count > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {book.count}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                                                    onClick={() => showBookItems(book.id)}
                                                >
                                                    Egzemplarze
                                                </button>
                                                <button
                                                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium text-sm"
                                                    onClick={() => startEditBook(book)}
                                                >
                                                    Edytuj
                                                </button>
                                                <button
                                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                                                    onClick={() => setDeleteConfirmBook(book.id)}
                                                >
                                                    Usuń
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Potwierdzenie usunięcia książki */}
            {deleteConfirmBook !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Usunąć książkę?</h3>
                            <p className="text-gray-600 mb-6">
                                Czy na pewno chcesz usunąć książkę o ID {deleteConfirmBook}? Tej operacji nie można cofnąć.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                    onClick={() => handleDeleteBook(deleteConfirmBook)}
                                >
                                    Usuń
                                </button>
                                <button
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                    onClick={() => setDeleteConfirmBook(null)}
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sekcja egzemplarzy */}
            {selectedBookId !== null && (
                <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-lg">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-2xl font-bold text-gray-900">
                            Egzemplarze książki:{" "}
                            <span className="text-blue-700">{books.find((b) => b.id === selectedBookId)?.title}</span>
                        </h4>
                        <button
                            className="px-4 py-2 border-2 border-gray-400 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={() => {
                                setSelectedBookId(null);
                                setBookItems([]);
                                setIsAddingItem(false);
                                setEditingItemId(null);
                            }}
                        >
                            Zamknij
                        </button>
                    </div>

                    {/* Formularz dodawania/edycji egzemplarza */}
                    {(isAddingItem || editingItemId) && (
                        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow">
                            <h5 className="text-xl font-bold text-gray-900 mb-6">
                                {editingItemId ? "Edytuj egzemplarz" : "Dodaj egzemplarz"}
                            </h5>
                            {itemFormError && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700">{itemFormError}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">ISBN</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        value={itemFormData.isbn}
                                        onChange={(e) =>
                                            setItemFormData({ ...itemFormData, isbn: e.target.value })
                                        }
                                        placeholder="np. 978-3-16-148410-0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={itemFormData.isAvailable}
                                                onChange={(e) =>
                                                    setItemFormData({
                                                        ...itemFormData,
                                                        isAvailable: e.target.checked,
                                                    })
                                                }
                                            />
                                            <div className={`w-14 h-7 rounded-full ${itemFormData.isAvailable ? 'bg-green-500' : 'bg-gray-300'} transition-colors`}></div>
                                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${itemFormData.isAvailable ? 'left-8' : 'left-1'}`}></div>
                                        </div>
                                        <span className={`font-medium ${itemFormData.isAvailable ? 'text-green-700' : 'text-gray-700'}`}>
                      {itemFormData.isAvailable ? 'Dostępny' : 'Wypożyczony'}
                    </span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors"
                                    onClick={
                                        editingItemId ? handleUpdateBookItem : handleAddBookItem
                                    }
                                >
                                    {editingItemId ? "Zapisz zmiany" : "Dodaj egzemplarz"}
                                </button>
                                <button
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                    onClick={cancelItemForm}
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        className="mb-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2"
                        onClick={() => setIsAddingItem(true)}
                        disabled={isAddingItem || editingItemId !== null}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Dodaj egzemplarz
                    </button>

                    {loadingItems ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : bookItems.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 text-lg">Brak egzemplarzy dla tej książki</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-gray-200 shadow">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-blue-800 to-blue-900">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">ISBN</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Akcje</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {bookItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{item.isbn}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${item.isAvailable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.isAvailable ? "Dostępny" : "Wypożyczony"}
                          </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                                                        onClick={() => startEditItem(item)}
                                                    >
                                                        Edytuj
                                                    </button>
                                                    <button
                                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                                                        onClick={() => setDeleteConfirmItem(item.id)}
                                                    >
                                                        Usuń
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Potwierdzenie usunięcia egzemplarza */}
                    {deleteConfirmItem !== null && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Usunąć egzemplarz?</h3>
                                    <p className="text-gray-600 mb-6">
                                        Czy na pewno chcesz usunąć egzemplarz o ID {deleteConfirmItem}?
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                            onClick={() => handleDeleteBookItem(deleteConfirmItem)}
                                        >
                                            Usuń
                                        </button>
                                        <button
                                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                            onClick={() => setDeleteConfirmItem(null)}
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

            {/* Sekcja zarządzania kategoriami */}
            <div className="mt-12 p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 shadow-lg">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Zarządzanie Kategoriami</h3>

                {/* Formularz dodawania/edycji kategorii */}
                {(isAddingCategory || editingCategoryId) && (
                    <div className="mb-8 p-6 bg-white rounded-xl border border-emerald-200 shadow">
                        <h4 className="text-2xl font-bold text-gray-900 mb-6">{editingCategoryId ? "Edytuj kategorię" : "Dodaj kategorię"}</h4>
                        {categoryFormError && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700">{categoryFormError}</p>
                            </div>
                        )}
                        <div className="space-y-2 max-w-md">
                            <label className="block text-sm font-medium text-gray-700">Nazwa kategorii</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                value={categoryFormData.name}
                                onChange={(e) =>
                                    setCategoryFormData({ ...categoryFormData, name: e.target.value })
                                }
                                placeholder="np. Fantastyka"
                            />
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-colors"
                                onClick={editingCategoryId ? handleUpdateCategory : handleAddCategory}
                            >
                                {editingCategoryId ? "Zapisz zmiany" : "Dodaj kategorię"}
                            </button>
                            <button
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                onClick={cancelCategoryForm}
                            >
                                Anuluj
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista kategorii */}
                {categories.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <p className="text-gray-500 text-lg">Brak kategorii. Dodaj pierwszą kategorię.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 shadow">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-emerald-800 to-emerald-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Nazwa</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Akcje</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-emerald-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{category.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium text-sm"
                                                    onClick={() => startEditCategory(category)}
                                                >
                                                    Edytuj
                                                </button>
                                                <button
                                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                                                    onClick={() => setDeleteConfirmCategory(category.id)}
                                                >
                                                    Usuń
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Potwierdzenie usunięcia kategorii */}
                {deleteConfirmCategory !== null && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                            <div className="text-center">
                                <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Usunąć kategorię?</h3>
                                <p className="text-gray-600 mb-6">
                                    Czy na pewno chcesz usunąć kategorię o ID {deleteConfirmCategory}?
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                        onClick={() => handleDeleteCategory(deleteConfirmCategory)}
                                    >
                                        Usuń
                                    </button>
                                    <button
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                        onClick={() => setDeleteConfirmCategory(null)}
                                    >
                                        Anuluj
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}