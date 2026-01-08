import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
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

export function HomePage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [categories, setCategories] = useState<Category[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBooks();
        fetchCategories();
    }, []);

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

    return (
        <div className="home-container" style={{padding: "2rem"}}>
            <div className="home-card">
                <h1>Biblioteka Archiwów Watykańskich</h1>
                <p>Przeglądaj naszą kolekcję książek i wypożyczaj interesujące pozycje.</p>
            </div>

            {/* Filtr i wyszukiwarka */}
            <div className="profile-card" style={{marginTop: "2rem"}}>
                <div style={{display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem"}}>
                    <div style={{flex: 1, minWidth: "300px"}}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Wyszukaj książkę lub autora..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{width: "100%"}}
                        />
                    </div>
                    <div style={{minWidth: "200px"}}>
                        <select
                            className="form-control"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{width: "100%"}}
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

                <p style={{color: "var(--text-secondary)"}}>
                    Znaleziono {filteredBooks.length} książek
                </p>
            </div>

            {/* Lista książek */}
            {loading ? (
                <div className="profile-card" style={{marginTop: "1rem", textAlign: "center"}}>
                    <p>Ładowanie książek...</p>
                </div>
            ) : error ? (
                <div className="profile-card" style={{marginTop: "1rem"}}>
                    <p style={{color: "#ff6b6b"}}>{error}</p>
                    <button
                        className="btn btn-primary"
                        onClick={fetchBooks}
                        style={{marginTop: "1rem"}}
                    >
                        Spróbuj ponownie
                    </button>
                </div>
            ) : (
                <div className="home-menu" style={{marginTop: "2rem"}}>
                    {filteredBooks.length === 0 ? (
                        <div className="profile-card">
                            <p>Brak książek spełniających kryteria wyszukiwania</p>
                        </div>
                    ) : (
                        filteredBooks.map((book) => (
                            <div
                                key={book.id}
                                className="menu-item"
                                onClick={() => handleBookClick(book.id)}
                                style={{cursor: "pointer"}}
                            >
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start"
                                }}>
                                    <div>
                                        <h3>{book.title}</h3>
                                        <p style={{color: "var(--text-secondary)", marginBottom: "0.5rem"}}>
                                            {book.author}
                                        </p>
                                    </div>
                                    <span
                                        style={{
                                            padding: "0.25rem 0.75rem",
                                            backgroundColor: book.count > 0 ? "#28a745" : "#dc3545",
                                            color: "white",
                                            borderRadius: "4px",
                                            fontSize: "0.85rem",
                                            fontWeight: "bold",
                                        }}
                                    >
                    {book.count} dostępnych
                  </span>
                                </div>

                                {/* Kategorie */}
                                {book.categories && book.categories.length > 0 && (
                                    <div style={{marginTop: "1rem"}}>
                                        <div style={{display: "flex", flexWrap: "wrap", gap: "0.25rem"}}>
                                            {book.categories.map((category) => (
                                                <span
                                                    key={category.id}
                                                    style={{
                                                        padding: "0.2rem 0.5rem",
                                                        backgroundColor: "#d4a574",
                                                        color: "#1a1a12",
                                                        borderRadius: "4px",
                                                        fontSize: "0.8rem",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                          {category.name}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{marginTop: "1rem"}}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBookClick(book.id);
                                        }}
                                        disabled={book.count === 0}
                                    >
                                        {book.count > 0 ? "Zobacz szczegóły" : "Niedostępna"}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Informacja o logowaniu */}
            {!localStorage.getItem("token") && (
                <div className="home-card" style={{marginTop: "2rem"}}>
                    <h2>Zaloguj się, aby przeglądać książki</h2>
                    <p>Aby przeglądać naszą kolekcję książek, musisz być zalogowany.</p>
                    <div className="button-group">
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/login")}
                        >
                            Zaloguj się
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate("/register")}
                        >
                            Zarejestruj się
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
