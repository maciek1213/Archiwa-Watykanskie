import { useState, useEffect } from "react";
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
                categories: bookFormData.categoryIds.map(id => ({ id })),
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
                setCategoryFormError("Nazwa kategorii jest wymagana");
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
        <div className="profile-card" style={{ marginTop: "2rem" }}>
            <h3>Zarządzanie Książkami</h3>

            {error && (
                <div style={{ color: "#ff6b6b", marginBottom: "1rem" }}>{error}</div>
            )}

            {/* Formularz dodawania/edycji książki */}
            {(isAddingBook || editingBookId) && (
                <div
                    style={{
                        marginBottom: "2rem",
                        padding: "1rem",
                        backgroundColor: "var(--bg-secondary)",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                    }}
                >
                    <h4>{editingBookId ? "Edytuj książkę" : "Dodaj książkę"}</h4>
                    {bookFormError && (
                        <div style={{ color: "#ff6b6b", marginBottom: "0.5rem" }}>
                            {bookFormError}
                        </div>
                    )}
                    <div className="form-group">
                        <label>Tytuł</label>
                        <input
                            type="text"
                            className="form-control"
                            value={bookFormData.title}
                            onChange={(e) =>
                                setBookFormData({ ...bookFormData, title: e.target.value })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>Autor</label>
                        <input
                            type="text"
                            className="form-control"
                            value={bookFormData.author}
                            onChange={(e) =>
                                setBookFormData({ ...bookFormData, author: e.target.value })
                            }
                        />
                    </div>

                    {/* Wybór kategorii */}
                    <div className="form-group">
                        <label>Kategorie</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                            {categories.map((category) => (
                                <label
                                    key={category.id}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        backgroundColor: bookFormData.categoryIds.includes(category.id)
                                            ? "#d4a574"
                                            : "var(--bg-primary)",
                                        border: "1px solid var(--border-color)",
                                        color: bookFormData.categoryIds.includes(category.id)
                                            ? "#1a1a12"
                                            : "var(--text-primary)",
                                        fontWeight: bookFormData.categoryIds.includes(category.id) ? "bold" : "normal",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={bookFormData.categoryIds.includes(category.id)}
                                        onChange={() => toggleCategory(category.id)}
                                        style={{ display: "none" }}
                                    />
                                    {category.name}
                                </label>
                            ))}
                            {categories.length === 0 && (
                                <span style={{ color: "#999", fontStyle: "italic" }}>
                                    Brak dostępnych kategorii. Dodaj kategorie poniżej.
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                        <button
                            className="btn btn-primary"
                            onClick={editingBookId ? handleUpdateBook : handleAddBook}
                        >
                            {editingBookId ? "Zapisz zmiany" : "Dodaj"}
                        </button>
                        <button className="btn btn-secondary" onClick={cancelBookForm}>
                            Anuluj
                        </button>
                    </div>
                </div>
            )}

            <button
                className="btn btn-primary"
                onClick={() => setIsAddingBook(true)}
                style={{ marginBottom: "1rem" }}
                disabled={isAddingBook || editingBookId !== null}
            >
                + Dodaj nową książkę
            </button>

            {/* Lista książek */}
            {loading ? (
                <p>Ładowanie książek...</p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                        <tr
                            style={{
                                backgroundColor: "var(--bg-secondary)",
                                borderBottom: "2px solid var(--border-color)",
                            }}
                        >
                            <th style={{ padding: "0.75rem", textAlign: "left" }}>ID</th>
                            <th style={{ padding: "0.75rem", textAlign: "left" }}>Tytuł</th>
                            <th style={{ padding: "0.75rem", textAlign: "left" }}>Autor</th>
                            <th style={{ padding: "0.75rem", textAlign: "left" }}>Kategorie</th>
                            <th style={{ padding: "0.75rem", textAlign: "left" }}>Liczba egzemplarzy</th>
                            <th style={{ padding: "0.75rem", textAlign: "center" }}>Akcje</th>
                        </tr>
                        </thead>
                        <tbody>
                        {books.map((book) => (
                            <tr
                                key={book.id}
                                style={{
                                    borderBottom: "1px solid var(--border-color)",
                                }}
                            >
                                <td style={{ padding: "0.75rem" }}>{book.id}</td>
                                <td style={{ padding: "0.75rem" }}>{book.title}</td>
                                <td style={{ padding: "0.75rem" }}>{book.author}</td>
                                <td style={{ padding: "0.75rem" }}>
                                    {book.categories && book.categories.length > 0 ? (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                                            {book.categories.map((category) => (
                                                <span
                                                    key={category.id}
                                                    style={{
                                                        padding: "0.2rem 0.5rem",
                                                        borderRadius: "4px",
                                                        backgroundColor: "#d4a574",
                                                        color: "#1a1a12",
                                                        fontSize: "0.8rem",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {category.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: "#999", fontStyle: "italic" }}>Brak</span>
                                    )}
                                </td>
                                <td style={{ padding: "0.75rem" }}>{book.count}</td>
                                <td style={{ padding: "0.75rem", textAlign: "center" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "0.5rem",
                                            justifyContent: "center",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => showBookItems(book.id)}
                                            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                                        >
                                            Egzemplarze
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => startEditBook(book)}
                                            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                                        >
                                            Edytuj
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => setDeleteConfirmBook(book.id)}
                                            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
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
            )}

            {/* Potwierdzenie usunięcia książki */}
            {deleteConfirmBook !== null && (
                <div
                    style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        backgroundColor: "#2a2a1f",
                        border: "1px solid #d4a574",
                        borderRadius: "4px",
                    }}
                >
                    <p>Czy na pewno chcesz usunąć książkę o ID {deleteConfirmBook}?</p>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteBook(deleteConfirmBook)}
                        >
                            Usuń
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setDeleteConfirmBook(null)}
                        >
                            Anuluj
                        </button>
                    </div>
                </div>
            )}

            {/* Sekcja egzemplarzy */}
            {selectedBookId !== null && (
                <div
                    style={{
                        marginTop: "2rem",
                        padding: "1rem",
                        backgroundColor: "var(--bg-secondary)",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                        }}
                    >
                        <h4 style={{ margin: 0 }}>
                            Egzemplarze książki:{" "}
                            {books.find((b) => b.id === selectedBookId)?.title}
                        </h4>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setSelectedBookId(null);
                                setBookItems([]);
                                setIsAddingItem(false);
                                setEditingItemId(null);
                            }}
                            style={{ padding: "0.5rem 1rem" }}
                        >
                            Zamknij
                        </button>
                    </div>

                    {/* Formularz dodawania/edycji egzemplarza */}
                    {(isAddingItem || editingItemId) && (
                        <div
                            style={{
                                marginBottom: "1rem",
                                padding: "1rem",
                                backgroundColor: "var(--bg-primary)",
                                borderRadius: "4px",
                                border: "1px solid var(--border-color)",
                            }}
                        >
                            <h5>
                                {editingItemId ? "Edytuj egzemplarz" : "Dodaj egzemplarz"}
                            </h5>
                            {itemFormError && (
                                <div style={{ color: "#ff6b6b", marginBottom: "0.5rem" }}>
                                    {itemFormError}
                                </div>
                            )}
                            <div className="form-group">
                                <label>ISBN</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={itemFormData.isbn}
                                    onChange={(e) =>
                                        setItemFormData({ ...itemFormData, isbn: e.target.value })
                                    }
                                    placeholder="np. 978-3-16-148410-0"
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: "flex", alignItems: "center" }}>
                                    <input
                                        type="checkbox"
                                        checked={itemFormData.isAvailable}
                                        onChange={(e) =>
                                            setItemFormData({
                                                ...itemFormData,
                                                isAvailable: e.target.checked,
                                            })
                                        }
                                        style={{ marginRight: "0.5rem" }}
                                    />
                                    Dostępny
                                </label>
                            </div>
                            <div
                                style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}
                            >
                                <button
                                    className="btn btn-primary"
                                    onClick={
                                        editingItemId ? handleUpdateBookItem : handleAddBookItem
                                    }
                                >
                                    {editingItemId ? "Zapisz zmiany" : "Dodaj"}
                                </button>
                                <button className="btn btn-secondary" onClick={cancelItemForm}>
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={() => setIsAddingItem(true)}
                        style={{ marginBottom: "1rem" }}
                        disabled={isAddingItem || editingItemId !== null}
                    >
                        + Dodaj egzemplarz
                    </button>

                    {loadingItems ? (
                        <p>Ładowanie egzemplarzy...</p>
                    ) : bookItems.length === 0 ? (
                        <p style={{ color: "#999", fontStyle: "italic" }}>
                            Brak egzemplarzy dla tej książki
                        </p>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                <tr
                                    style={{
                                        backgroundColor: "var(--bg-primary)",
                                        borderBottom: "2px solid var(--border-color)",
                                    }}
                                >
                                    <th style={{ padding: "0.75rem", textAlign: "left" }}>ID</th>
                                    <th style={{ padding: "0.75rem", textAlign: "left" }}>ISBN</th>
                                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Status</th>
                                    <th style={{ padding: "0.75rem", textAlign: "center" }}>Akcje</th>
                                </tr>
                                </thead>
                                <tbody>
                                {bookItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        style={{
                                            borderBottom: "1px solid var(--border-color)",
                                        }}
                                    >
                                        <td style={{ padding: "0.75rem" }}>{item.id}</td>
                                        <td style={{ padding: "0.75rem" }}>{item.isbn}</td>
                                        <td style={{ padding: "0.75rem" }}>
                                            <span
                                                style={{
                                                    padding: "0.25rem 0.75rem",
                                                    borderRadius: "4px",
                                                    backgroundColor: item.isAvailable
                                                        ? "#28a745"
                                                        : "#dc3545",
                                                    color: "white",
                                                    fontSize: "0.85rem",
                                                }}
                                            >
                                                {item.isAvailable ? "Dostępny" : "Wypożyczony"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "0.75rem", textAlign: "center" }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "0.5rem",
                                                    justifyContent: "center",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => startEditItem(item)}
                                                    style={{
                                                        padding: "0.5rem 1rem",
                                                        fontSize: "0.85rem",
                                                    }}
                                                >
                                                    Edytuj
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => setDeleteConfirmItem(item.id)}
                                                    style={{
                                                        padding: "0.5rem 1rem",
                                                        fontSize: "0.85rem",
                                                    }}
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
                    )}

                    {/* Potwierdzenie usunięcia egzemplarza */}
                    {deleteConfirmItem !== null && (
                        <div
                            style={{
                                marginTop: "1rem",
                                padding: "1rem",
                                backgroundColor: "#2a2a1f",
                                border: "1px solid #d4a574",
                                borderRadius: "4px",
                            }}
                        >
                            <p>
                                Czy na pewno chcesz usunąć egzemplarz o ID {deleteConfirmItem}?
                            </p>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleDeleteBookItem(deleteConfirmItem)}
                                >
                                    Usuń
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setDeleteConfirmItem(null)}
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sekcja zarządzania kategoriami */}
            <div
                style={{
                    marginTop: "2rem",
                    padding: "1rem",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "4px",
                    border: "1px solid var(--border-color)",
                }}
            >
                <h3>Zarządzanie Kategoriami</h3>

                {/* Formularz dodawania/edycji kategorii */}
                {(isAddingCategory || editingCategoryId) && (
                    <div
                        style={{
                            marginBottom: "2rem",
                            padding: "1rem",
                            backgroundColor: "var(--bg-primary)",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                        }}
                    >
                        <h4>{editingCategoryId ? "Edytuj kategorię" : "Dodaj kategorię"}</h4>
                        {categoryFormError && (
                            <div style={{ color: "#ff6b6b", marginBottom: "0.5rem" }}>
                                {categoryFormError}
                            </div>
                        )}
                        <div className="form-group">
                            <label>Nazwa kategorii</label>
                            <input
                                type="text"
                                className="form-control"
                                value={categoryFormData.name}
                                onChange={(e) =>
                                    setCategoryFormData({ ...categoryFormData, name: e.target.value })
                                }
                                placeholder="np. Fantastyka"
                            />
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                            <button
                                className="btn btn-primary"
                                onClick={editingCategoryId ? handleUpdateCategory : handleAddCategory}
                            >
                                {editingCategoryId ? "Zapisz zmiany" : "Dodaj"}
                            </button>
                            <button className="btn btn-secondary" onClick={cancelCategoryForm}>
                                Anuluj
                            </button>
                        </div>
                    </div>
                )}

                <button
                    className="btn btn-primary"
                    onClick={() => setIsAddingCategory(true)}
                    style={{ marginBottom: "1rem" }}
                    disabled={isAddingCategory || editingCategoryId !== null}
                >
                    + Dodaj nową kategorię
                </button>

                {/* Lista kategorii */}
                {categories.length === 0 ? (
                    <p style={{ color: "#999", fontStyle: "italic" }}>
                        Brak kategorii. Dodaj pierwszą kategorię.
                    </p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                            <tr
                                style={{
                                    backgroundColor: "var(--bg-primary)",
                                    borderBottom: "2px solid var(--border-color)",
                                }}
                            >
                                <th style={{ padding: "0.75rem", textAlign: "left" }}>ID</th>
                                <th style={{ padding: "0.75rem", textAlign: "left" }}>Nazwa</th>
                                <th style={{ padding: "0.75rem", textAlign: "center" }}>Akcje</th>
                            </tr>
                            </thead>
                            <tbody>
                            {categories.map((category) => (
                                <tr
                                    key={category.id}
                                    style={{
                                        borderBottom: "1px solid var(--border-color)",
                                    }}
                                >
                                    <td style={{ padding: "0.75rem" }}>{category.id}</td>
                                    <td style={{ padding: "0.75rem" }}>{category.name}</td>
                                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "0.5rem",
                                                justifyContent: "center",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => startEditCategory(category)}
                                                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                                            >
                                                Edytuj
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => setDeleteConfirmCategory(category.id)}
                                                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
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
                )}

                {/* Potwierdzenie usunięcia kategorii */}
                {deleteConfirmCategory !== null && (
                    <div
                        style={{
                            marginTop: "1rem",
                            padding: "1rem",
                            backgroundColor: "#2a2a1f",
                            border: "1px solid #d4a574",
                            borderRadius: "4px",
                        }}
                    >
                        <p>Czy na pewno chcesz usunąć kategorię o ID {deleteConfirmCategory}?</p>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteCategory(deleteConfirmCategory)}
                            >
                                Usuń
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setDeleteConfirmCategory(null)}
                            >
                                Anuluj
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}