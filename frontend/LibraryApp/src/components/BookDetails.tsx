import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import {getUserId, isAdmin} from "../utils/tokenUtils.ts";

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

export function BookDetails({token}: Props) {
    const {id} = useParams<{ id: string }>();
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

    const effectiveToken = token || localStorage.getItem("token");
    const adminUser = isAdmin(effectiveToken);

    useEffect(() => {
        fetchBookDetails();
        checkQueueStatus();
        checkActiveRental();
    }, [id]);

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

    const toggleAdminQueue = () => {
        if (!showAdminQueue) {
            fetchAdminQueue();
        }
        setShowAdminQueue(!showAdminQueue);
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

    const hasAvailableItems = bookItems.some(item => item.isAvailable);
    const allItemsUnavailable = bookItems.length > 0 && bookItems.every(item => !item.isAvailable);
    const canBorrowDirectly = !loadingQueue && ((!hasQueue || queuePosition === 1) && !isReservedForOther);

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

                {/* Książka jest zarezerwowana dla innego użytkownika */}
                {isReservedForOther && hasAvailableItems && (
                    <div
                        style={{
                            marginTop: "1.5rem",
                            padding: "1rem",
                            backgroundColor: "#fff3cd",
                            color: "#856404",
                            borderRadius: "4px",
                            border: "1px solid #ffeaa7",
                        }}
                    >
                        <h4 style={{marginTop: 0, color: "#856404"}}>Książka zarezerwowana</h4>
                        <p style={{marginBottom: 0}}>
                            Ta książka jest zarezerwowana dla użytkownika z kolejki. 
                            Nie możesz jej wypożyczyć dopóki ta osoba nie odbierze książki lub nie upłynie czas rezerwacji.
                        </p>
                    </div>
                )}

                {/* Książka dostępna ale jest kolejka */}
                {hasQueue && hasAvailableItems && queuePosition !== 1 && !isReservedForOther && (
                    <div
                        style={{
                            marginTop: "1.5rem",
                            padding: "1rem",
                            backgroundColor: "#fff3cd",
                            color: "#856404",
                            borderRadius: "4px",
                            border: "1px solid #ffeaa7",
                        }}
                    >
                        <h4 style={{marginTop: 0, color: "#856404"}}>Książka zarezerwowana</h4>
                        {queuePosition > 0 ? (
                            <p style={{marginBottom: 0}}> 
                                Będziesz mógł wypożyczyć książkę gdy będziesz pierwszy w kolejce.
                            </p>
                        ) : (
                            <p style={{marginBottom: 0}}>
                                Jest kolejka rezerwacji. Aby wypożyczyć tę książkę, musisz najpierw zarezerwować miejsce w kolejce.
                            </p>
                        )}
                    </div>
                )}

                {allItemsUnavailable && !hasActiveRental && (
                    <div
                        style={{
                            marginTop: "1.5rem",
                            padding: "1rem",
                            backgroundColor: "#fff3cd",
                            color: "#856404",
                            borderRadius: "4px",
                            border: "1px solid #ffeaa7",
                        }}
                    >
                        <h4 style={{marginTop: 0, color: "#856404"}}>Brak dostępnych egzemplarzy</h4>
                        {queuePosition > 0 ? (
                            <p style={{marginBottom: 0}}>
                                Wszystkie egzemplarze są wypożyczone.
                            </p>
                        ) : (
                            <p style={{marginBottom: 0}}>
                                Wszystkie egzemplarze są wypożyczone. Możesz zarezerwować miejsce w kolejce poniżej.
                            </p>
                        )}
                    </div>
                )}

                {/* Admin */}
                {adminUser && (showAdminQueue || adminQueueData.length > 0 || !loadingAdminQueue) && (
                    <div style={{marginTop: "2rem", border: "2px solid #d4a574", borderRadius: "8px", padding: "1rem"}}>
                        <button
                            onClick={toggleAdminQueue}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                backgroundColor: "#d4a574",
                                color: "#1a1a12",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: "1rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span>Szczegóły kolejki</span>
                            <span>{showAdminQueue ? "▲" : "▼"}</span>
                        </button>

                        {showAdminQueue && (
                            <div style={{marginTop: "1rem"}}>
                                {loadingAdminQueue ? (
                                    <p>Ładowanie kolejki...</p>
                                ) : adminQueueData.length === 0 ? (
                                    <p>Brak użytkowników w kolejce.</p>
                                ) : (
                                    <div>
                                        <p style={{fontWeight: "bold", marginBottom: "0.5rem"}}>
                                            Liczba osób w kolejce: {adminQueueData.length}
                                        </p>
                                        <ol style={{marginLeft: "1.5rem", paddingLeft: 0}}>
                                            {adminQueueData.map((item) => (
                                                <li key={item.id} style={{marginBottom: "0.5rem"}}>
                                                    <strong>{item.user.firstName} {item.user.lastName}</strong> ({item.user.email})
                                                    {item.status === "NOTIFIED" && (
                                                        <span
                                                            style={{
                                                                marginLeft: "0.5rem",
                                                                padding: "0.25rem 0.5rem",
                                                                backgroundColor: "#ffc107",
                                                                color: "#000",
                                                                borderRadius: "4px",
                                                                fontSize: "0.8rem",
                                                                fontWeight: "bold",
                                                            }}
                                                        >
                                                            POWIADOMIONY
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}


                {!hasActiveRental && (
                    <div style={{marginTop: "2rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap"}}>
                        {hasAvailableItems ? (
                            canBorrowDirectly ? (
                            <>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleBorrowBook}
                                    disabled={loadingQueue}
                                    style={{padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: "bold"}}
                                >
                                    {loadingQueue ? "Sprawdzanie..." : "Wypożycz książkę"}
                                </button>
                                {queuePosition === 1 && (
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={handleLeaveQueue}
                                        disabled={loadingQueue}
                                        style={{padding: "0.75rem 2rem", fontSize: "1rem"}}
                                    >
                                        Zrezygnuj z rezerwacji
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleReserveBook}
                                    disabled={queuePosition > 0 || loadingQueue}
                                    style={{padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: "bold"}}
                                >
                                    {loadingQueue ? "Sprawdzanie..." : (queuePosition > 0 ? `W kolejce (${queuePosition})` : "📋 Zarezerwuj miejsce")}
                                </button>
                                {queuePosition > 0 && (
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={handleLeaveQueue}
                                        disabled={loadingQueue}
                                        style={{padding: "0.75rem 2rem", fontSize: "1rem"}}
                                    >
                                        Opuść kolejkę
                                    </button>
                                )}
                            </>
                        )
                        ) : (
                            <>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleReserveBook}
                                    disabled={queuePosition > 0 || loadingQueue}
                                    style={{padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: "bold"}}
                                >
                                    {loadingQueue ? "Sprawdzanie..." : (queuePosition > 0 ? `W kolejce (${queuePosition})` : "📋 Zarezerwuj miejsce w kolejce")}
                                </button>
                                {queuePosition > 0 && (
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={handleLeaveQueue}
                                        disabled={loadingQueue}
                                        style={{padding: "0.75rem 2rem", fontSize: "1rem"}}
                                    >
                                        Opuść kolejkę
                                    </button>
                                )}
                            </>
                        )}
                        {hasAvailableItems && (
                            <span style={{color: "var(--text-secondary)", fontSize: "0.9rem"}}>
                                System automatycznie wybierze dostępny egzemplarz
                            </span>
                        )}
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
                                    <th style={{padding: "0.75rem", textAlign: "center"}}>Status</th>
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
                                        <td style={{padding: "0.75rem", textAlign: "center"}}>
                        <span
                            style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: "4px",
                                backgroundColor: item.isAvailable
                                    ? "#28a745"
                                    : "#dc3545",
                                color: "white",
                                fontSize: "0.85rem",
                                fontWeight: "bold"
                            }}
                        >
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