import { useEffect, useState } from "react";

interface NotificationDto {
  id: number;
  title: string;
  message: string;
}

interface Props {
  token: string | null;
}

export function NotificationsPage({ token }: Props) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:8080/notifications", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Błąd:", err));
  }, [token]);

  return (
    <div className="container mt-5 pt-5">
      <div className="card bg-dark text-white border-secondary">
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h3>Historia powiadomień</h3>
          <span className="badge bg-secondary">{notifications.length} łącznie</span>
        </div>
        <div className="card-body">
          {notifications.length === 0 ? (
            <p className="text-muted">Brak powiadomień do wyświetlenia.</p>
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((n) => (
                <div key={n.id} className="list-group-item bg-dark text-white border-secondary py-3">
                  <h5 className="mb-1">{n.title}</h5>
                  <p className="mb-1 opacity-75">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}