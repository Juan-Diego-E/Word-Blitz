import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameInterface from './GameInterface';
import './ClassicMode.css';

const ClassicMode = () => {
    const navigate = useNavigate();
    const navigateBack = () => {
        navigate('/select-mode');
    };

    const [players, setPlayers] = useState([]);
    const [playerName, setPlayerName] = useState('Jugador');
    const [timer, setTimer] = useState(30);
    const [wordLimit, setWordLimit] = useState(10);
    const [isGameStarted, setIsGameStarted] = useState(false);

    const addPlayer = () => {
        if (playerName) {
            setPlayers([...players, playerName]);
            setPlayerName('Jugador');
        }
    };

    const removePlayer = (index) => {
        setPlayers(players.filter((_, i) => i !== index));
    };

    const startGame = () => {
        setIsGameStarted(true);
    };

    if (isGameStarted) {
        return <GameInterface players={players} timer={timer} wordLimit={wordLimit} />;
    }

    return (
        <div className="classic-mode">
            <nav>
                <button onClick={navigateBack} className="btn-return">
                    <i className="bi bi-arrow-left-short"></i>
                </button>
            </nav>
            <h2>Configuración de Juego Clásico</h2>
            <div className="classic-game-mode-container">
                <div className="config-section">
                    <label>Temporizador:</label>
                    <div className="player-add-section">
                        <input
                            type="number"
                            value={timer}
                            onChange={(e) => setTimer(e.target.value)}
                            min="1"
                            max="44"
                        />
                        <button >+</button>
                    </div>
                </div>
                <div className="config-section">
                    <label>Letras:</label>
                    <div className="player-add-section">
                        <input
                            type="number"
                            value={wordLimit || ''}
                            onChange={(e) => setWordLimit(e.target.value ? Number(e.target.value) : null)}
                            min="1"
                        />
                        <button >+</button>
                    </div>
                </div>
                <div className="config-section">
                    <label>Agregar Nombre:</label>
                    <div className="player-add-section">
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                        />
                        <button className="" onClick={addPlayer}>+</button>
                    </div>
                </div>
                <button onClick={startGame}>Jugar</button>
                <ul>
                    {players.map((player, index) => (
                        <li key={index}>
                            {player}
                            <button onClick={() => removePlayer(index)}>
                                <i className="bi bi-trash3"></i>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ClassicMode;
