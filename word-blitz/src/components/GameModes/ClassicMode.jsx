import React, { useState } from 'react';
import GameInterface from './GameInterface';
import './ClassicMode.css';

const ClassicMode = () => {
    const [players, setPlayers] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [timer, setTimer] = useState(30);
    const [wordLimit, setWordLimit] = useState(null);
    const [isGameStarted, setIsGameStarted] = useState(false);

    const addPlayer = () => {
        if (playerName) {
            setPlayers([...players, playerName]);
            setPlayerName('');
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
            <h2>Configuración de Juego Clásico</h2>
            <div className="config-section">
                <label>Agregar Nombre:</label>
                <input 
                    type="text" 
                    value={playerName} 
                    onChange={(e) => setPlayerName(e.target.value)} 
                />
                <button onClick={addPlayer}>Agregar</button>
            </div>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>
                        {player} 
                        <button onClick={() => removePlayer(index)}>Eliminar</button>
                    </li>
                ))}
            </ul>
            <div className="config-section">
                <label>Temporizador (segundos):</label>
                <input 
                    type="number" 
                    value={timer} 
                    onChange={(e) => setTimer(e.target.value)} 
                    min="5" 
                    max="60" 
                />
            </div>
            <div className="config-section">
                <label>Límite de Palabras (opcional):</label>
                <input 
                    type="number" 
                    value={wordLimit || ''} 
                    onChange={(e) => setWordLimit(e.target.value ? Number(e.target.value) : null)} 
                    min="1" 
                />
            </div>
            <button onClick={startGame}>Jugar</button>
        </div>
    );
};

export default ClassicMode;
