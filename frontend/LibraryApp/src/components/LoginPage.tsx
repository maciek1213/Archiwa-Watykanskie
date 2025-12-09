import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Props {
  onLogin: (token: string) => void;
}

export function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8080/user/login", {
        username,
        password,
      });

      const token = response.data;
      onLogin(token);
      navigate("/");
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        let errorMessage = "Login failed";

        if (e.response.data?.message) {
          errorMessage = e.response.data.message;
        } else if (e.response.data?.error) {
          errorMessage = e.response.data.error;
        } else if (typeof e.response.data === "string") {
          errorMessage = e.response.data;
        } else if (e.response.status === 401) {
          errorMessage = "Nieprawidłowa nazwa użytkownika lub hasło";
        } else if (e.response.status === 400) {
          errorMessage = "Nieprawidłowe dane logowania";
        }

        setError(errorMessage);
      } else {
        setError("Błąd połączenia z serwerem");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "2rem auto" }}>
      <div className="profile-card">
        <h2>Logowanie</h2>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: "1rem",
                marginBottom: "1rem",
                backgroundColor: "#1f0a0a",
                color: "#ff6b6b",
                borderRadius: "4px",
                border: "1px solid #ff6b6b",
              }}
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="usernameInput">Nazwa użytkownika</label>
            <input
              type="text"
              className="form-control"
              id="usernameInput"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Wpisz nazwę użytkownika"
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="passwordInput">Hasło</label>
            <input
              type="password"
              className="form-control"
              id="passwordInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wpisz hasło"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </button>

          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <p>
              Nie masz konta?{" "}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "#14919b",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={() => navigate("/register")}
                disabled={isLoading}
              >
                Zarejestruj się
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
