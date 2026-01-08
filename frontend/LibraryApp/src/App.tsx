import "./App.css";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { LoginPage } from "./components/LoginPage.tsx";
import { RegisterPage } from "./components/RegisterPage.tsx";
import { HomePage } from "./components/HomePage.tsx";
import { Navbar } from "./components/Navbar.tsx";
import { ProfilePage } from "./components/ProfilePage.tsx";
import { NotificationsPage } from "./components/NotificationsPage.tsx";
import { BookDetails } from "./components/BookDetails.tsx";
import { useEffect, useState } from "react";

function ProtectedRoute({
                            token,
                            children,
                        }: {
    token: string | null;
    children: React.ReactNode;
}) {
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function AuthRoute({
                       token,
                       children,
                   }: {
    token: string | null;
    children: React.ReactNode;
}) {
    if (token) {
        return <Navigate to="/" replace />;
    }
    return children;
}

function App() {
    const [token, setToken] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        if (savedToken) {
            setToken(savedToken);
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    return (
        <Router>
            <Navbar token={token} setToken={setToken} />
            <main style={{ minHeight: "calc(100vh - 70px)" }}>
                {isInitialized ? (
                    <Routes>
                        <Route path={"/"} element={<HomePage />} />
                        <Route
                            path={"/login"}
                            element={
                                <AuthRoute token={token}>
                                    <LoginPage onLogin={setToken} />
                                </AuthRoute>
                            }
                        />
                        <Route
                            path={"/register"}
                            element={
                                <AuthRoute token={token}>
                                    <RegisterPage onLogin={setToken} />
                                </AuthRoute>
                            }
                        />
                        <Route
                            path={"/profile"}
                            element={
                                <ProtectedRoute token={token}>
                                    <ProfilePage token={token} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={"/notifications"}
                            element={
                                <ProtectedRoute token={token}>
                                    <NotificationsPage token={token} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={"/book/:id"}
                            element={
                                <ProtectedRoute token={token}>
                                    <BookDetails token={token} />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                ) : (
                    <div style={{ padding: "2rem", textAlign: "center" }}>
                        <p>Ładowanie...</p>
                    </div>
                )}
            </main>
        </Router>
    );
}

export default App;
