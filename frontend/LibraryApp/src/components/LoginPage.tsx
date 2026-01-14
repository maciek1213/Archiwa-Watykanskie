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
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo i nagłówek */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl shadow-lg mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Witamy z powrotem</h1>
                    <p className="text-gray-600">Zaloguj się do swojej bibliotecznej przestrzeni</p>
                </div>

                {/* Formularz */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-red-700 font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Nazwa użytkownika
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:bg-gray-100"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Wpisz nazwę użytkownika"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Hasło
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:bg-gray-100"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Wpisz hasło"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all transform hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logowanie...
                </span>
                            ) : (
                                "Zaloguj się"
                            )}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Nie masz konta?</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="w-full py-3 px-4 border-2 border-amber-600 text-amber-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
                            onClick={() => navigate("/register")}
                            disabled={isLoading}
                        >
                            Zarejestruj się
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            className="text-amber-700 hover:text-amber-800 font-medium flex items-center justify-center gap-2 mx-auto"
                            onClick={() => navigate("/")}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Powrót do strony głównej
                        </button>
                    </div>
                </div>

                {/* Informacje dodatkowe */}
                <div className="mt-8 text-center text-gray-600 text-sm">
                    <p>Potrzebujesz pomocy? Skontaktuj się z administracją biblioteki.</p>
                </div>
            </div>
        </div>
    );
}