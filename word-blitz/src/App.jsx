import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';
import SelectMode from './components/SelectMode.jsx';
import ClassicMode from './components/GameModes/ClassicMode.jsx';
import './styles/App.css';

const App = () => {
    return (
        <Router>
            <div className="app">
                <div className='bg-lights'></div>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/select-mode" element={<SelectMode />} />
                    <Route path="/classic-mode" element={<ClassicMode />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
