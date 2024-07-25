import React, { useState } from 'react'
import './styles/index.css'
import Login from './components/Auth/Login.jsx'
import Register from './components/Auth/Register.jsx'

function App() {
  return (
    <>
      <div className='bg-lights'></div>
    <ClassicMode />
      <Login />
      <Register />
    </>
  )
}

export default App
