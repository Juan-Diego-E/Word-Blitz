import React from 'react';
import '../styles/GameBoard.css';
import logo from '../assets/images/logo_v1_1024x1024.jpeg';

const GameBoard = () => {
    return (
        <div className="gameboard-container">
            <main className="main-gameboard">
                <div className="game-info">
                    <div className="category-difficulty">
                        <span className="category">Categoría: Animales</span>
                        <span className="difficulty">Dificultad: Fácil</span>
                    </div>
                    <div className="timer">Tiempo: 60s</div>
                </div>
                <div className="word-grid">
                    {/* Aquí va la lógica para generar la cuadrícula de letras */}
                </div>
                <div className="input-area">
                    <input type="text" placeholder="Ingresa tu palabra" />
                    <button className="submit-button">Enviar</button>
                </div>
            </main>
            <aside className="sidebar">
                <div className="scoreboard">
                    <span>Puntuación: 0</span>
                </div>
                <button className="hint-button">Pista</button>
                <button className="leaderboard-button">Ranking</button>
                <button className="settings-button">Configuración</button>
            </aside>
            <footer className="footer">
                <button className="nav-button">Inicio</button>
                <button className="nav-button">Salir</button>
                <div className="status-bar">
                    <span>Estado: Jugando...</span>
                </div>
            </footer>
        </div>
    );
};

export default GameBoard;
