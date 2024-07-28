import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SelectMode.css'

const SelectMode = () => {
    const navigate = useNavigate();

    const startClassicMode = () => {
        navigate('/classic-mode');
    };

    const navigateBack = () => {
        navigate('/');
    };

    return (
        <section>
            <nav>
                <button onClick={navigateBack} className="btn-return">
                    <i className="bi bi-arrow-return-left"></i>
                </button>
            </nav>
            <div className='game-modes-container'>
                <h1>Modo de Juego</h1>
                <ul className='game-modes-list'>
                    <li className="game-mode">
                        <button onClick={startClassicMode}>Clásico</button>
                    </li>
                    <li className="game-mode">
                        <button>Palabra Diaria</button>
                    </li>
                    <li className="game-mode">
                        <button>Infinito</button>
                    </li>
                    <li className="game-mode">
                        <button>Multijugador</button>
                    </li>
                    <li className="game-mode">
                        <button>Contrarreloj</button>
                    </li>
                </ul>
            </div>
        </section>
    );
};

export default SelectMode;
