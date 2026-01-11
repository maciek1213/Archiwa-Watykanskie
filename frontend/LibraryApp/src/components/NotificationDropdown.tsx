import { useEffect, useState } from "react";
import bellIcon from "../assets/bell.png";
import { useNavigate } from "react-router-dom";

interface NotificationDto {
  id: number;
  title: string;
  message: string;
}

interface Props {
  token: string;
}

export function NotificationDropdown({ token }: Props) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const response = await fetch("http://localhost:8080/notifications/new", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Błąd pobierania powiadomień:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/notifications/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Błąd przy oznaczaniu jako przeczytane:", error);
    }
  };

  return (
    <div className="dropdown" style={{ marginRight: "1rem", position: "relative" }}>
      <button
        className="btn btn-outline"
        style={{ color: "#e0e0e0", border: "1px solid #e0e0e0", position: "relative" }}
        onClick={() => setShow(!show)}
      >
        <img 
          src={bellIcon} 
          alt="Powiadomienia" 
          style={{ 
            width: "24px", 
            height: "24px", 
            filter: "invert(90%)"
          }} 
        />
        {notifications.length > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {notifications.length}
          </span>
        )}
      </button>

      {show && (
        <ul className="dropdown-menu show" style={{ 
            position: "absolute", 
            right: 0, 
            minWidth: "300px", 
            backgroundColor: "#2c2c2c", 
            border: "1px solid #444",
            maxHeight: "400px",
            overflowY: "auto"
        }}>
          <li className="dropdown-header text-white border-bottom border-secondary pb-2">Powiadomienia</li>
          {notifications.length === 0 ? (
            <li className="dropdown-item text-muted text-center py-3">Brak nowych wiadomości</li>
          ) : (
            notifications.map((n) => (
              <li key={n.id} className="dropdown-item d-flex justify-content-between align-items-start border-bottom border-secondary py-2" style={{ backgroundColor: "transparent" }}>
                <div style={{ color: "#e0e0e0", whiteSpace: "normal" }}>
                  <div className="fw-bold" style={{ fontSize: "0.9rem" }}>{n.title}</div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>{n.message}</div>
                </div>
                <button 
                  className="btn-close btn-close-white ms-2" 
                  style={{ fontSize: "0.6rem" }}
                  onClick={() => markAsRead(n.id)}
                />
              </li>
            ))
          )}
          <li className="border-top border-secondary mt-1">
            <button 
              className="dropdown-item text-center text-primary py-2"
              style={{ fontSize: "0.85rem", fontWeight: "bold" }}
              onClick={() => {
                setShow(false);
                navigate("/notifications");
              }}
            >
              Zobacz wszystkie
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}