import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className='bg-lights'></div>
            <p>Cargando...</p>
        </div>
    );
};

export default LoadingScreen;
