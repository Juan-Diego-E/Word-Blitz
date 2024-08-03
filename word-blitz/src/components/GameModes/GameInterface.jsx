import React, { useState } from 'react';
import './GameInterface.css';
import LogoImage from '../../assets/images/logo_v1_1024x1024.png'

const GameInterface = ({ players, timer, wordLimit }) => {
    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [showCategory, setShowCategory] = useState(false);
    const [category, setCategory] = useState('');
    const [timeLeft, setTimeLeft] = useState(timer);

    const categories = ['Fruta', 'Mamifero', 'País', 'Color', 'Deporte', 'Animal Acuatico', 'Ave']; // Ejemplo de categorías

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
                <div className="left">
                    <span>
                        {players[currentPlayer].charAt(0)}
                    </span>
                </div>
                <div className="center">
                    <span>
                        {timeLeft}s
                    </span>
                </div>
                <div className="right">
                    <button className="settings-button">
                        <i className="bi bi-gear-fill"></i>
                    </button>
                </div>
            </header>
            <div className="body">
                <div className="player-name">{players[currentPlayer]}</div>
                <div className="card" onClick={revealCategory}>
                    {showCategory ? (
                        <div className="category">{category}</div>
                    ) : (
                        <div className="card-back">
                            <div className="watermark">Toca para voltear</div>
                            <div className="logo"><img src={LogoImage} /></div>
                            <div className="watermark">Toca para voltear</div>
                        </div>
                    )}
                </div>
            </div>
            <footer>
                {/* Ranking temporal o botones de "check" y "x" según el estado del juego */}
                {!showCategory ? (
                    <ul>
                        <h2>Ranking</h2>
                        {players.map((player, index) => (
                            <li key={index}>{index+1}: {player}</li>
                        ))}
                    </ul>
                ) : (
                    <div className="judgement-buttons">
                        <button className="yes-button"><i className="bi bi-check"></i></button>
                        <button className="no-button"><i className="bi bi-x"></i></button>
                    </div>
                )}
            </footer>
        </div>
    );
};

export default GameInterface;
