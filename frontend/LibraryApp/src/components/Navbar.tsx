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
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Lewa strona - logo */}
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
                        >
                            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg">
                                <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className="text-white text-xl font-serif font-bold tracking-wide">
                Archiwa Watykańskie
              </span>
                        </button>
                    </div>

                    {/* Prawa strona - nawigacja */}
                    <div className="flex items-center space-x-4">
                        {!token ? (
                            <>
                                <button
                                    className="px-5 py-2 text-white font-medium hover:text-amber-100 transition-colors"
                                    onClick={() => navigate("/login")}
                                >
                                    Zaloguj się
                                </button>
                                <button
                                    className="px-6 py-2.5 bg-white text-amber-800 font-semibold rounded-lg hover:bg-amber-50 transition-colors shadow"
                                    onClick={() => navigate("/register")}
                                >
                                    Zarejestruj się
                                </button>
                            </>
                        ) : (
                            <>
                                <NotificationDropdown token={token} />

                                <button
                                    className="px-5 py-2 text-white font-medium hover:text-amber-100 transition-colors flex items-center gap-2"
                                    onClick={() => navigate("/profile")}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Profil
                                </button>
                                <button
                                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-colors shadow flex items-center gap-2"
                                    onClick={handleLogout}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Wyloguj się
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}