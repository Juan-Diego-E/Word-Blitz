import React, { useState } from 'react';
import './GameInterface.css';

const GameInterface = ({ players, timer, wordLimit }) => {
    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [showCategory, setShowCategory] = useState(false);
    const [category, setCategory] = useState('');
    const [timeLeft, setTimeLeft] = useState(timer);

    const categories = ['Frutas', 'Animales', 'Países', 'Colores']; // Ejemplo de categorías

    const nextPlayer = () => {
        setCurrentPlayer((prev) => (prev + 1) % players.length);
        setShowCategory(false);
        setTimeLeft(timer);
    };

    const revealCategory = () => {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        setCategory(randomCategory);
        setShowCategory(true);
        startTimer();
    };

    const startTimer = () => {
        let time = timer;
        const countdown = setInterval(() => {
            if (time > 0) {
                time -= 1;
                setTimeLeft(time);
            } else {
                clearInterval(countdown);
                nextPlayer();
            }
        }, 1000);
    };

    return (
        <div className="game-interface">
            <header>
                <div className="left">{players[currentPlayer].charAt(0)}</div>
                <div className="center">{timeLeft}s</div>
                <div className="right">
                    <button className="settings-button">⚙️</button>
                </div>
            </header>
            <div className="body">
                <div className="player-name">{players[currentPlayer]}</div>
                <div className="card" onClick={revealCategory}>
                    {showCategory ? (
                        <div className="category">{category}</div>
                    ) : (
                        <div className="card-back">
                            <div className="logo">Word Blitz</div>
                            <div className="watermark">Toca para voltear</div>
                        </div>
                    )}
                </div>
            </div>
            <footer>
                {/* Ranking temporal o botones de "SI" y "NO" según el estado del juego */}
                {!showCategory ? (
                    <ul>
                        {players.map((player, index) => (
                            <li key={index}>{player}</li>
                        ))}
                    </ul>
                ) : (
                    <div className="judgement-buttons">
                        <button className="yes-button">SI</button>
                        <button className="no-button">NO</button>
                    </div>
                )}
            </footer>
        </div>
    );
};

export default GameInterface;
