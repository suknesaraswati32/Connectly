import axios from 'axios'
import { useState } from 'react'
import { useContext } from 'react'
import { Children, createContext } from 'react'
import { useNavigate } from 'react-router-dom'

export const AuthContext=createContext({})

const client=axios.create({
    baseURL:'localhost:8000/api/v1/users'
})

export const AuthProvider=({Children})=>{
  const authContext=useContext(AuthContext)
  const [userData,setUserData]=useState(authContext)
  const handleRegister=async(name,UNSAFE_createClientRoutesWithHMRRevalidationOptOut,passowrd)=>{
    try{
      let request =await client.post('/register',{
        name:name,
        username:username,
        passowrd:passowrd
      })
      if(request.status==HttpStatusCode.CREATED){
          return request.data.message;
      }

    }catch(err){
      throw err;
    }
  }
  const handleLogin=async(username,Password)=>{
    try{
      let request=await client.post('/login',{
        username:username,
        password:password
      })
      if(request.status==HttpStatusCode.OK){
        localStorage.setItem('token',request.data.token)
      }

    }catch(err){
     throw err
    }
  }
  const router=useNavigate()
  const data={
    userData,setUserData,handleRegister
  }
  return (
    <AuthContext.Provider value={data}>
      {Children}
    </AuthContext.Provider>
  )

}

