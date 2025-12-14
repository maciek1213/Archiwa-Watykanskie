import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Props {
  onLogin: (token: string) => void;
}

export function RegisterPage({ onLogin }: Props) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    if (
      !formData.username ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName
    ) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    const { confirmPassword, ...payload } = formData;
    setLoading(true);

    try {
      await axios.post("http://localhost:8080/user/register", payload);

      try {
        const loginResponse = await axios.post(
          "http://localhost:8080/user/login",
          {
            username: formData.username,
            password: formData.password,
          }
        );

        const token = loginResponse.data;
        onLogin(token);
        navigate("/");
      } catch (loginError) {
        alert("Rejestracja udana! Zaloguj się teraz.");
        navigate("/login");
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        const errorMessage = e.response.data || "Błąd serwera";
        setError(`Rejestracja nie powiodła się: ${errorMessage}`);
      } else {
        setError("Błąd podczas rejestracji");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "2rem auto" }}>
      <div className="profile-card">
        <h2>Rejestracja</h2>

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
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nazwa użytkownika *</label>
            <input
              name="username"
              type="text"
              className="form-control"
              id="InputUsername"
              value={formData.username}
              onChange={handleChange}
              placeholder="Wpisz nazwę użytkownika"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Imię *</label>
            <input
              name="firstName"
              type="text"
              className="form-control"
              id="InputName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Wpisz imię"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Nazwisko *</label>
            <input
              name="lastName"
              type="text"
              className="form-control"
              id="InputLastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Wpisz nazwisko"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              name="email"
              type="email"
              className="form-control"
              id="InputEmail"
              value={formData.email}
              onChange={handleChange}
              placeholder="Wpisz email"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Numer telefonu *</label>
            <input
              name="phoneNumber"
              type="tel"
              className="form-control"
              id="InputPhone"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Wpisz numer telefonu"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Hasło *</label>
            <input
              name="password"
              type="password"
              className="form-control"
              id="InputPassword"
              value={formData.password}
              onChange={handleChange}
              placeholder="Wpisz hasło"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Potwierdź hasło *</label>
            <input
              name="confirmPassword"
              type="password"
              className="form-control"
              id="InputConfirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Potwierdź hasło"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Trwa rejestracja..." : "Zarejestruj się"}
          </button>

          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <p>
              Masz już konto?{" "}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "#14919b",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={() => navigate("/login")}
                disabled={loading}
              >
                Zaloguj się
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
