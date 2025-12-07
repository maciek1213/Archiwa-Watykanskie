import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {LoginPage} from "./components/LoginPage.tsx";
import {RegisterPage} from "./components/RegisterPage.tsx";
import {HomePage} from "./components/HomePage.tsx";
import {useEffect, useState} from "react";

function App() {
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        if (savedToken) {
            setToken(savedToken);
        }
    }, []);

    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        }
    }, [token]);

  return (
    <>
      <Router>
          <Routes>
              <Route path={"/"} element={<HomePage/>}/>
              <Route path={"/login"} element={<LoginPage onLogin={setToken}/>}/>
              <Route path={"/register"} element={<RegisterPage onLogin={setToken}/>}/>
          </Routes>
      </Router>
    </>
  )
}

export default App
