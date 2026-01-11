import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import axios from "axios";

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
}

interface Props {
    token: string | null;
}

export function BookDetails({token}: Props) {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [book, setBook] = useState<Book | null>(null);
    const [bookItems, setBookItems] = useState<BookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingItems, setLoadingItems] = useState(false);

    const effectiveToken = token || localStorage.getItem("token");

    useEffect(() => {
        fetchBookDetails();
    }, [id]);

    const fetchBookDetails = async () => {
        try {
            setLoading(true);

            // Fetch book details
            const bookResponse = await axios.get<Book>(
                `http://localhost:8080/book/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );
            setBook(bookResponse.data);

            // Fetch book items
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

    const handleBorrowBook = async (itemId: number) => {
        try {
            await axios.post(
                `http://localhost:8080/book/items/${itemId}/borrow`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${effectiveToken}`,
                    },
                }
            );

            alert("Książka została wypożyczona!");
            fetchBookDetails(); // Refresh data
        } catch (err: any) {
            const errorMessage = err.response?.data || "Nie udało się wypożyczyć książki";
            alert(errorMessage);
        }
    };

    if (loading) {
        return (
            <div style={{padding: "2rem", textAlign: "center"}}>
                <p>Ładowanie szczegółów książki...</p>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div style={{padding: "2rem"}}>
                <div className="profile-card">
                    <h3>Błąd</h3>
                    <p>{error || "Książka nie została znaleziona"}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate("/")}
                        style={{marginTop: "1rem"}}
                    >
                        Powrót do listy książek
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{padding: "2rem", maxWidth: "1200px", margin: "0 auto"}}>
            <button
                className="btn btn-secondary"
                onClick={() => navigate("/")}
                style={{marginBottom: "1rem"}}
            >
                ← Powrót do listy książek
            </button>

            <div className="profile-card">
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
                    <div>
                        <h2>{book.title}</h2>
                        <h3 style={{color: "var(--text-secondary)", marginTop: "0.5rem"}}>
                            {book.author}
                        </h3>
                    </div>
                    <div style={{display: "flex", gap: "0.5rem", alignItems: "center"}}>
            <span
                style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: book.count > 0 ? "#28a745" : "#dc3545",
                    color: "white",
                    borderRadius: "4px",
                    fontWeight: "bold",
                }}
            >
              {book.count} dostępnych
            </span>
                    </div>
                </div>

                {/* Kategorie */}
                {book.categories && book.categories.length > 0 && (
                    <div style={{marginTop: "1rem"}}>
                        <p style={{marginBottom: "0.5rem", fontWeight: "bold"}}>Kategorie:</p>
                        <div style={{display: "flex", flexWrap: "wrap", gap: "0.5rem"}}>
                            {book.categories.map((category) => (
                                <span
                                    key={category.id}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        backgroundColor: "#d4a574",
                                        color: "#1a1a12",
                                        borderRadius: "4px",
                                        fontWeight: "bold",
                                        fontSize: "0.9rem",
                                    }}
                                >
                  {category.name}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dostępne egzemplarze */}
                <div style={{marginTop: "2rem"}}>
                    <h3>Dostępne egzemplarze</h3>

                    {loadingItems ? (
                        <p>Ładowanie egzemplarzy...</p>
                    ) : bookItems.length === 0 ? (
                        <p style={{color: "#999", fontStyle: "italic"}}>
                            Brak dostępnych egzemplarzy tej książki
                        </p>
                    ) : (
                        <div style={{overflowX: "auto", marginTop: "1rem"}}>
                            <table style={{width: "100%", borderCollapse: "collapse"}}>
                                <thead>
                                <tr
                                    style={{
                                        backgroundColor: "var(--bg-primary)",
                                        borderBottom: "2px solid var(--border-color)",
                                    }}
                                >
                                    <th style={{padding: "0.75rem", textAlign: "left"}}>ID</th>
                                    <th style={{padding: "0.75rem", textAlign: "left"}}>ISBN</th>
                                    <th style={{padding: "0.75rem", textAlign: "left"}}>Status</th>
                                    <th style={{padding: "0.75rem", textAlign: "center"}}>Akcja</th>
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
                                        <td style={{padding: "0.75rem"}}>{item.id}</td>
                                        <td style={{padding: "0.75rem"}}>{item.isbn}</td>
                                        <td style={{padding: "0.75rem"}}>
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
                                        <td style={{padding: "0.75rem", textAlign: "center"}}>
                                            {item.isAvailable ? (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleBorrowBook(item.id)}
                                                    style={{padding: "0.5rem 1rem", fontSize: "0.85rem"}}
                                                >
                                                    Wypożycz
                                                </button>
                                            ) : (
                                                <span style={{color: "#999", fontStyle: "italic"}}>
                            Niedostępny
                          </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Informacje dla użytkownika */}
                <div
                    style={{
                        marginTop: "2rem",
                        padding: "1rem",
                        backgroundColor: "var(--bg-primary)",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                    }}
                >
                    <h4>Informacje o wypożyczeniu</h4>
                    <ul style={{marginTop: "0.5rem", paddingLeft: "1.5rem"}}>
                        <li>Maksymalny okres wypożyczenia: 30 dni</li>
                        <li>Możliwość przedłużenia wypożyczenia: 1 raz</li>
                        <li>Kara za przetrzymanie: 1 zł za każdy dzień</li>
                        <li>Rezerwacja książki możliwa na 7 dni</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}