import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

interface Props {
    onLogin: (token: string) => void;
}

export function RegisterPage({ onLogin }: Props) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (formData.password != formData.confirmPassword) {
            setError("passwords do not match");
            return;
        }

        const { confirmPassword, ...payload } = formData;

        try {
            const response = await axios.post('http://localhost:8080/user/register', payload)
        } catch (e) {
            setError("An error occured during registration")
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>First name</label>
                    <input
                        name="firstName"
                        type="text"
                        className="form-control"
                        id="InputName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter first name"
                    />
                </div>
                <div className="form-group">
                    <label>Last name</label>
                    <input
                        name="lastName"
                        type="text"
                        className="form-control"
                        id="InputLastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Enter last name"
                    />
                </div>
                <div className="form-group">
                    <label>Email address</label>
                    <input
                        name="email"
                        type="email"
                        className="form-control"
                        id="InputEmail"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                    />
                </div>
                <div className="form-group">
                    <label>Phone number</label>
                    <input
                        name="phoneNumber"
                        type="text"
                        className="form-control"
                        id="InputPhone"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        className="form-control"
                        id="InputPassword"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                    />
                </div>
                <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                        name="confirmPassword"
                        type="password"
                        className="form-control"
                        id="InputConfirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm Password"
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    Register
                </button>
            </form>
        </>
    );
}
