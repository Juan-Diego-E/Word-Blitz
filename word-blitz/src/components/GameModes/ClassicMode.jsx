import React from 'react';
import Timer from '../Timer/Timer';
import Board from '../Board/Board';
import './ClassicMode.css';

const ClassicMode = () => {
    return (
        <div className="classic-mode">
            <Timer />
            <Board />
        </div>
    );
}

export default ClassicMode;
