import React from 'react';
import { useNavigate } from 'react-router-dom';

const SelectMode = () => {
    const navigate = useNavigate();

    const startClassicMode = () => {
        navigate('/classic-mode');
    };
    const navigateBack = () => {
        navigate('/');
    };

    return (
        <>
            <div className='bg-lights'></div>
            <button onClick={navigateBack}>Regresar</button>
            <h2>Selecciona el Modo de Juego</h2>
            <button onClick={startClassicMode}>Modo Clásico</button>
            {/* Agrega otros modos de juego según sea necesario */}
        </>
    );
};

export default SelectMode;
