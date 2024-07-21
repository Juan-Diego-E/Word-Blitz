import React from "react";
import logo from '../assets/images/logo_v1_1024x1024.jpeg';
import '../styles/Header.css'

const Header = () => {
    return (
        <>
            <header className="gameboard-header">
                <img src={logo} alt="Word Blitz Logo" className="logo" />
                <div className="game-mode-selector">
                    <select>
                        <option value="classic">Clásico</option>
                        <option value="daily">Palabra Diaria</option>
                        <option value="infinite">Infinito</option>
                        <option value="timetrial">Contrarreloj</option>
                        <option value="multiplayer">Varios Jugadores</option>
                    </select>
                </div>
                <div className="user-info">
                    <span className="username">Guest</span>
                    <i class="bi bi-person-circle"></i>
                    {/* <img src="avatar_placeholder.png" alt="Avatar" className="avatar" /> */}
                </div>
            </header>
        </>
    )
}

export default Header;