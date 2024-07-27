import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoImage from '../assets/images/logo_v1_1024x1024.png'

const Home = () => {
    const navigate = useNavigate();

    const handlePlayClick = () => {
        navigate('/select-mode');
    };

    return (
        <>
        <div className='menu-container'>
            <img src={LogoImage} alt="" />
            <button className="play-button" onClick={handlePlayClick}>Jugar</button>
        </div>
        </>
    );
};

export default Home;
