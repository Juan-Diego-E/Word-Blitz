import React, { useState } from 'react'
import './styles/App.css'
import './styles/index.css'
import Header from './components/Header.jsx'
import GameBoard from './components/GameBoard.jsx'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <div className='bg-lights'></div>
      <Header />
      <GameBoard />
    </>
  )
}

export default App
