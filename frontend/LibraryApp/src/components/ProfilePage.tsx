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
    } catch (err) {}
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
    <div className="profile-container" style={{ padding: "2rem" }}>
      {loading && (
        <div className="profile-card">
          <p>Ładowanie danych...</p>
        </div>
      )}

      {error && (
        <div className="profile-card">
          <p style={{ color: "#ff6b6b" }}>{error}</p>
        </div>
      )}

      {!loading && !error && userData && (
        <>
          <div className="profile-card">
            <h2>Mój Profil</h2>
            <>
              <p>
                Imię i nazwisko:{" "}
                <strong>
                  {userData.firstName} {userData.lastName}
                </strong>
              </p>
              <p>
                Email: <strong>{userData.email}</strong>
              </p>
              <p>
                Telefon: <strong>{userData.phoneNumber}</strong>
              </p>
              <p>Możesz przeglądać katalog i zarządzać swoimi rezerwacjami.</p>
            </>
            {!isEditing && (
              <button
                className="btn btn-primary"
                onClick={handleEditStart}
                style={{ marginTop: "1rem" }}
              >
                Edytuj profil
              </button>
            )}
          </div>

          {isEditing && (
            <div className="profile-card" style={{ marginTop: "2rem" }}>
              <h3>Edytuj swoje dane</h3>
              {editError && (
                <div
                  style={{
                    padding: "1rem",
                    marginBottom: "1rem",
                    backgroundColor: "#1f0a0a",
                    color: "#ff6b6b",
                    borderRadius: "4px",
                    border: "1px solid #ff6b6b",
                  }}
                >
                  {editError}
                </div>
              )}
              <div className="form-group">
                <label>Nazwa użytkownika</label>
                <input
                  type="text"
                  className="form-control"
                  value={editData.username}
                  onChange={(e) =>
                    setEditData({ ...editData, username: e.target.value })
                  }
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label>Imię</label>
                <input
                  type="text"
                  className="form-control"
                  value={editData.firstName}
                  onChange={(e) =>
                    setEditData({ ...editData, firstName: e.target.value })
                  }
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label>Nazwisko</label>
                <input
                  type="text"
                  className="form-control"
                  value={editData.lastName}
                  onChange={(e) =>
                    setEditData({ ...editData, lastName: e.target.value })
                  }
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  className="form-control"
                  value={editData.phoneNumber}
                  onChange={(e) =>
                    setEditData({ ...editData, phoneNumber: e.target.value })
                  }
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label>Nowe hasło (opcjonalnie)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Zostaw puste jeśli nie chcesz zmieniać hasła"
                  value={editData.password || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, password: e.target.value })
                  }
                  disabled={editLoading}
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-primary"
                  onClick={handleEditSubmit}
                  disabled={editLoading}
                >
                  {editLoading ? "Zapisywanie..." : "Zapisz zmiany"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleEditCancel}
                  disabled={editLoading}
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}

          <div className="profile-card" style={{ marginTop: "2rem" }}>
            <h3>Moje Wypożyczenia</h3>
            {loadingRentals ? (
              <p>Ładowanie wypożyczeń...</p>
            ) : rentals.length === 0 ? (
              <p>Nie masz żadnych wypożyczeń.</p>
            ) : (
              <div style={{ overflowX: "auto", marginTop: "1rem" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderBottom: "2px solid var(--border-color)",
                      }}
                    >
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Książka</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Autor</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>ISBN</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Status</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Data wypożyczenia</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Data zwrotu</th>
                      <th style={{ padding: "0.75rem", textAlign: "center" }}>Akcja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map((rental) => (
                      <tr
                        key={rental.id}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                        }}
                      >
                        <td style={{ padding: "0.75rem" }}>
                          {rental.bookItem?.book?.title || "Brak danych"}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {rental.bookItem?.book?.author || "Brak danych"}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {rental.bookItem?.isbn || "Brak danych"}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <span
                            style={{
                              padding: "0.25rem 0.75rem",
                              borderRadius: "4px",
                              backgroundColor:
                                rental.status === "ACTIVE"
                                  ? "#28a745"
                                  : rental.status === "OVERDUE"
                                  ? "#dc3545"
                                  : "#6c757d",
                              color: "white",
                              fontSize: "0.85rem",
                            }}
                          >
                            {rental.status === "ACTIVE"
                              ? "Aktywne"
                              : rental.status === "OVERDUE"
                              ? "Po terminie"
                              : rental.status === "RETURNED"
                              ? "Zwrócone"
                              : rental.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {new Date(rental.startDate).toLocaleDateString("pl-PL")}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {new Date(rental.endDate).toLocaleDateString("pl-PL")}
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center" }}>
                          {rental.status === "ACTIVE" || rental.status === "OVERDUE" ? (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleReturnBook(rental.id)}
                              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                            >
                              Zwróć
                            </button>
                          ) : (
                            <span style={{ color: "#999", fontStyle: "italic" }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="profile-card" style={{ marginTop: "2rem" }}>
            <h3>Moje Rezerwacje</h3>
            {loadingQueues ? (
              <p>Ładowanie rezerwacji...</p>
            ) : bookQueues.length === 0 ? (
              <p>Nie masz żadnych rezerwacji w kolejce.</p>
            ) : (
              <div style={{ overflowX: "auto", marginTop: "1rem" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderBottom: "2px solid var(--border-color)",
                      }}
                    >
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Książka</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Autor</th>
                      <th style={{ padding: "0.75rem", textAlign: "center" }}>Pozycja w kolejce</th>
                      <th style={{ padding: "0.75rem", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "0.75rem", textAlign: "center" }}>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookQueues.map((queue) => {
                      const position = queuePositions[queue.book.id];
                      return (
                        <tr
                          key={queue.id}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <td style={{ padding: "0.75rem" }}>
                            {queue.book.title}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            {queue.book.author}
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            <span
                              style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: "4px",
                                backgroundColor: position === 1 ? "#28a745" : "#6c757d",
                                color: "white",
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                              }}
                            >
                              {position !== undefined ? position : "..."}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            <span
                              style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: "4px",
                                backgroundColor:
                                  queue.status === "NOTIFIED" ? "#ffc107" : "#17a2b8",
                                color: queue.status === "NOTIFIED" ? "#000" : "white",
                                fontSize: "0.85rem",
                              }}
                            >
                              {queue.status === "NOTIFIED" ? "Gotowe do wypożyczenia" : "Oczekiwanie"}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                              {queue.status === "NOTIFIED" && (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => navigate(`/book/${queue.book.id}`)}
                                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                                >
                                  Przejdź do strony książki
                                </button>
                              )}
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleLeaveQueue(queue.book.id)}
                                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
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
            )}
          </div>

          {adminUser && (
            <div className="profile-card" style={{ marginTop: "2rem" }}>
              <h3>Zarządzanie Użytkownikami</h3>

              {loadingUsers ? (
                <p>Ładowanie użytkowników...</p>
              ) : (
                <div style={{ overflowX: "auto", marginTop: "1rem" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          borderBottom: "2px solid var(--border-color)",
                        }}
                      >
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>
                          ID
                        </th>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>
                          Nazwa
                        </th>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>
                          Email
                        </th>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>
                          Imię i Nazwisko
                        </th>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>
                          Telefon
                        </th>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>
                          Role
                        </th>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "center",
                          }}
                        >
                          Akcje
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user) => (
                        <tr
                          key={user.id}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <td style={{ padding: "0.75rem" }}>{user.id}</td>
                          <td style={{ padding: "0.75rem" }}>
                            {user.username}
                          </td>
                          <td style={{ padding: "0.75rem" }}>{user.email}</td>
                          <td style={{ padding: "0.75rem" }}>
                            {user.firstName} {user.lastName}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            {user.phoneNumber}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            {user.authorities && user.authorities.length > 0
                              ? user.authorities.map((r) => (
                                  <span
                                    key={r.authority}
                                    style={{
                                      display: "inline-block",
                                      padding: "0.25rem 0.75rem",
                                      backgroundColor: "#d62828",
                                      color: "white",
                                      borderRadius: "4px",
                                      marginRight: "0.5rem",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    {r.authority}
                                  </span>
                                ))
                              : "Brak ról"}
                          </td>
                          <td
                            style={{ padding: "0.75rem", textAlign: "center" }}
                          >
                            <button
                              className="btn btn-danger"
                              onClick={() => setDeleteConfirm(user.id)}
                              style={{
                                padding: "0.5rem 1rem",
                                fontSize: "0.85rem",
                              }}
                            >
                              Usuń
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {deleteConfirm !== null && (
                <div
                  style={{
                    marginTop: "2rem",
                    padding: "1rem",
                    backgroundColor: "#2a2a1f",
                    border: "1px solid #d4a574",
                    borderRadius: "4px",
                  }}
                >
                  <p>
                    Czy na pewno chcesz usunąć użytkownika o ID {deleteConfirm}?
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteUser(deleteConfirm)}
                    >
                      Usuń
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
            <div>
                {adminUser && <BookManagement token={effectiveToken} />}
            </div>
        </>
      )}
    </div>
  );
}
