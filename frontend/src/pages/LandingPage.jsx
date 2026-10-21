import React from 'react'
import '../index.css'
import { Link } from 'react-router-dom'
const LandingPage = () => {
  return (
    <div className='landingpageContainer'>
     <nav>
      <div className='navHeader'>
      </div>
      <div className='navlist'>
          <p>Join as Guest</p>
          <p>Register</p>
          <div role='button'>
            <p>Login</p>
          </div>
      </div>
     </nav>
     <div className="landingMainContainer">
       <div> 
        <h1><span style={{color:"#FF9"}}>Connect</span>  with your Loved once</h1>
        <p>Cover a distance by Apna Video Call</p>
        <div role='button'>
          <Link to={'/auth'}>Get Started</Link>
        </div>
       </div>
       <div>
        <img src='./public/mobile.png' alt="" />
       </div>
     </div>
    </div>
  )
}

export default LandingPage