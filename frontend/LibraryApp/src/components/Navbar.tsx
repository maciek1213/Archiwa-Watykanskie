import { useNavigate } from "react-router-dom";
import type { Dispatch, SetStateAction } from "react";
import { NotificationDropdown } from "./NotificationDropdown";

interface Props {
  token: string | null;
  setToken?: Dispatch<SetStateAction<string | null>>;
}

export function Navbar({ token, setToken }: Props) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (setToken) {
      setToken(null);
    }
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button
            className="navbar-brand"
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "inherit",
            }}
          >
            Archiwa Watykańskie
          </button>
        </div>

        <div className="navbar-right d-flex align-items-center">
          {!token ? (
            <>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/login")}
                style={{ marginRight: "0.5rem" }}
              >
                Zaloguj się
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/register")}
              >
                Zarejestruj się
              </button>
            </>
          ) : (
<>
              <NotificationDropdown token={token} />

              <button
                className="btn btn-outline"
                onClick={() => navigate("/profile")}
                style={{ marginRight: "0.5rem", color: "#e0e0e0" }}
              >
                Profil
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Wyloguj się
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
