import React, { useState } from 'react'
import { useRef } from 'react'
import style from '../styles/VideoMeet.css'
const server_url='http://localhost:8000'
var connections={}
const peerConfigConnections={
  'iceServers':[
    {'urls':'stun:stun.l.google.com:19302'}
  ]
}
const VideoMeet = () => {

  var socketRef=useRef();
  let socketRef=useRef();
  let localVideoRef=useRef();
  let[videoAvailable,setVideoAvailable]=useState(true)
  let[audioAvailable,setAudioAvailable]=useState(true)
  let[video,setVideo]=useState()
  let[audio,setAudio]=useState()
  let[screen,setScreen]=useState()
  let[showModel,setShowModel]=useState()
  let[screenAvailable,setScreenAvailable]=useState()
  let[messages,setMessages]=useState([])
  let[message,setMessage]=useState('')
  let[newMessage,setNewMesage]=useState(0)
  let[askForUsername,setAskForUsername]=useState(true)
  let[username,setUsername]=useState('')
  const videoRef=useRef([])
  let[videoS,setVideos]=useState([])


  return (
    <div>
      {askForUsername==true?
      <div>
        </div>:<></>
      }
    </div>
  )
}

export default VideoMeet