import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';
import GameModeSelection from './components/GameModes/GameModeSelection.jsx';
import ClassicMode from './components/GameModes/ClassicMode.jsx';
import './styles/App.css';

const App = () => {
    return (
        <Router>
            <div className="app">
                <div className='bg-lights'></div>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/select-mode" element={<GameModeSelection />} />
                    <Route path="/classic-mode" element={<ClassicMode />} />
                    <Route path="*" element={<h1>Not found!</h1>} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
