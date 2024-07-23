import React, { useState } from 'react';
import './Auth.css';
import LogoImage from '../../assets/images/logo_v1_1024x1024.png'

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Lógica de inicio de sesión
    };

    return (
        <div className="auth-container">
            <img src={LogoImage} alt="" />
            <h2>Iniciar Sesión</h2>
            <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Entrar</button>
            <button>Ingresar como Invitado</button>
        </div>
    );
};

export default Login;
