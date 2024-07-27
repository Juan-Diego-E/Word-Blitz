import React from 'react';
import { Link } from 'react-router-dom';
import './GameModes.css';

const GameModeSelection = () => {
    return (
        <div className="game-mode-selection">
            <h2>Selecciona el Modo de Juego</h2>
            <Link to="/classic-mode">
                <button className="mode-button">Clásico</button>
            </Link>
            {/* Agrega más botones para otros modos de juego aquí */}
        </div>
    );
};

export default GameModeSelection;
