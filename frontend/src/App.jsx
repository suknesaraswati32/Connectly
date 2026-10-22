import React from 'react'
import './index.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import Authentication from './pages/Authentication.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import VideoMeet from './pages/VideoMeet.jsx'
const App = () => {
  return (
    <>
    <Router>
      <AuthProvider>
       <Routes>
       <Route path='/' element={<LandingPage />} />
       <Route path='/auth' element={<Authentication />} />
       <Route path='/:url' element={<VideoMeet />} />
       </Routes>
       </AuthProvider>
    </Router>
    </>
  )
}

export default App