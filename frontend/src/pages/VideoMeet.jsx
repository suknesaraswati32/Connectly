import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Badge, IconButton, TextField, Button } from '@mui/material';

import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';

import styles from '../styles/videoMeet.module.css';

const server_url = 'http://localhost:8000';

const connections = {};

const peerConfigConnections = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

const VideoMeet = () => {
    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoRef = useRef(null);
    const videoRef = useRef([]);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);

    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [newMessages, setNewMessages] = useState(0);

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState('');

    const [videos, setVideos] = useState([]);

    useEffect(() => {
        getPermissions();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }

            Object.values(connections).forEach((connection) => {
                connection.close();
            });

            if (window.localStream) {
                window.localStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices
                .getUserMedia({ video: true })
                .catch(() => null);

            setVideoAvailable(Boolean(videoPermission));

            if (videoPermission) {
                videoPermission.getTracks().forEach((track) => track.stop());
            }

            const audioPermission = await navigator.mediaDevices
                .getUserMedia({ audio: true })
                .catch(() => null);

            setAudioAvailable(Boolean(audioPermission));

            if (audioPermission) {
                audioPermission.getTracks().forEach((track) => track.stop());
            }

            setScreenAvailable(
                typeof navigator.mediaDevices.getDisplayMedia === 'function'
            );

            const userMediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).catch(() => null);

            if (userMediaStream) {
                window.localStream = userMediaStream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = userMediaStream;
                }
            }
        } catch (error) {
            console.error('Error getting media permissions:', error);
        }
    };

    const silence = () => {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const destination = oscillator.connect(
            context.createMediaStreamDestination()
        );

        oscillator.start();
        context.resume();

        return Object.assign(destination.stream.getAudioTracks()[0], {
            enabled: false
        });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        const canvas = Object.assign(document.createElement('canvas'), {
            width,
            height
        });

        const context = canvas.getContext('2d');
        context.fillRect(0, 0, width, height);

        const stream = canvas.captureStream();

        return Object.assign(stream.getVideoTracks()[0], {
            enabled: false
        });
    };

    const getUserMediaSuccess = (stream) => {
        if (window.localStream) {
            window.localStream.getTracks().forEach((track) => track.stop());
        }

        window.localStream = stream;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        Object.keys(connections).forEach((id) => {
            if (id === socketIdRef.current) return;

            const connection = connections[id];

            connection.getSenders().forEach((sender) => {
                connection.removeTrack(sender);
            });

            stream.getTracks().forEach((track) => {
                connection.addTrack(track, stream);
            });

            connection.createOffer()
                .then((description) => connection.setLocalDescription(description))
                .then(() => {
                    socketRef.current?.emit(
                        'signal',
                        id,
                        JSON.stringify({
                            sdp: connection.localDescription
                        })
                    );
                })
                .catch((error) => console.error(error));
        });

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setVideo(false);
                setAudio(false);
            };
        });
    };

    const getUserMedia = async () => {
        if (!video && !audio) {
            if (window.localStream) {
                window.localStream.getTracks().forEach((track) => track.stop());
            }

            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: video && videoAvailable,
                audio: audio && audioAvailable
            });

            getUserMediaSuccess(stream);
        } catch (error) {
            console.error('Unable to access camera or microphone:', error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined && !askForUsername) {
            getUserMedia();
        }
    }, [video, audio]);

    const getDisplayMediaSuccess = (stream) => {
        if (window.localStream) {
            window.localStream.getTracks().forEach((track) => track.stop());
        }

        window.localStream = stream;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        Object.keys(connections).forEach((id) => {
            if (id === socketIdRef.current) return;

            const connection = connections[id];

            connection.getSenders().forEach((sender) => {
                connection.removeTrack(sender);
            });

            stream.getTracks().forEach((track) => {
                connection.addTrack(track, stream);
            });

            connection.createOffer()
                .then((description) => connection.setLocalDescription(description))
                .then(() => {
                    socketRef.current?.emit(
                        'signal',
                        id,
                        JSON.stringify({
                            sdp: connection.localDescription
                        })
                    );
                })
                .catch((error) => console.error(error));
        });

        stream.getVideoTracks()[0].onended = () => {
            setScreen(false);
            getUserMedia();
        };
    };

    const getDisplayMedia = async () => {
        try {
            if (!navigator.mediaDevices.getDisplayMedia) return;

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            getDisplayMediaSuccess(stream);
        } catch (error) {
            console.error('Unable to share screen:', error);
            setScreen(false);
        }
    };

    useEffect(() => {
        if (screen && !askForUsername) {
            getDisplayMedia();
        } else if (!screen && !askForUsername) {
            getUserMedia();
        }
    }, [screen]);

    const gotMessageFromServer = (fromId, messageData) => {
        try {
            const signal = JSON.parse(messageData);
            const connection = connections[fromId];

            if (!connection || fromId === socketIdRef.current) return;

            if (signal.sdp) {
                connection.setRemoteDescription(
                    new RTCSessionDescription(signal.sdp)
                ).then(async () => {
                    if (signal.sdp.type === 'offer') {
                        const description = await connection.createAnswer();
                        await connection.setLocalDescription(description);

                        socketRef.current?.emit(
                            'signal',
                            fromId,
                            JSON.stringify({
                                sdp: connection.localDescription
                            })
                        );
                    }
                }).catch((error) => console.error(error));
            }

            if (signal.ice) {
                connection.addIceCandidate(
                    new RTCIceCandidate(signal.ice)
                ).catch((error) => console.error(error));
            }
        } catch (error) {
            console.error('Error processing signal:', error);
        }
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((previousMessages) => [
            ...previousMessages,
            { sender, data }
        ]);

        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((previousCount) => previousCount + 1);
        }
    };

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, {
            secure: false
        });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketIdRef.current = socketRef.current.id;

            socketRef.current.emit('join-call', window.location.href);

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos((previousVideos) => {
                    const updatedVideos = previousVideos.filter(
                        (item) => item.socketId !== id
                    );

                    videoRef.current = updatedVideos;
                    return updatedVideos;
                });

                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    if (connections[socketListId]) return;

                    const connection = new RTCPeerConnection(
                        peerConfigConnections
                    );

                    connections[socketListId] = connection;

                    connection.onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current?.emit(
                                'signal',
                                socketListId,
                                JSON.stringify({
                                    ice: event.candidate
                                })
                            );
                        }
                    };

                    connection.ontrack = (event) => {
                        const remoteStream = event.streams[0];

                        setVideos((previousVideos) => {
                            const exists = previousVideos.some(
                                (item) => item.socketId === socketListId
                            );

                            const updatedVideos = exists
                                ? previousVideos.map((item) =>
                                    item.socketId === socketListId
                                        ? { ...item, stream: remoteStream }
                                        : item
                                )
                                : [
                                    ...previousVideos,
                                    {
                                        socketId: socketListId,
                                        stream: remoteStream
                                    }
                                ];

                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    };

                    if (window.localStream) {
                        window.localStream.getTracks().forEach((track) => {
                            connection.addTrack(track, window.localStream);
                        });
                    }

                    if (
                        socketListId === id &&
                        id === socketIdRef.current
                    ) {
                        Object.keys(connections).forEach((otherId) => {
                            if (
                                otherId === socketIdRef.current ||
                                otherId === socketListId
                            ) {
                                return;
                            }

                            const otherConnection = connections[otherId];

                            if (window.localStream) {
                                window.localStream.getTracks().forEach((track) => {
                                    otherConnection.addTrack(
                                        track,
                                        window.localStream
                                    );
                                });
                            }

                            otherConnection.createOffer()
                                .then((description) =>
                                    otherConnection.setLocalDescription(description)
                                )
                                .then(() => {
                                    socketRef.current?.emit(
                                        'signal',
                                        otherId,
                                        JSON.stringify({
                                            sdp: otherConnection.localDescription
                                        })
                                    );
                                })
                                .catch((error) => console.error(error));
                        });
                    }
                });
            });
        });
    };

    const getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const connect = () => {
        if (!username.trim()) {
            alert('Please enter your username.');
            return;
        }

        setAskForUsername(false);
        getMedia();
    };

    const handleVideo = () => {
        setVideo((previousVideo) => !previousVideo);
    };

    const handleAudio = () => {
        setAudio((previousAudio) => !previousAudio);
    };

    const handleScreen = () => {
        setScreen((previousScreen) => !previousScreen);
    };

    const handleEndCall = () => {
        if (window.localStream) {
            window.localStream.getTracks().forEach((track) => track.stop());
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        Object.values(connections).forEach((connection) => {
            connection.close();
        });

        window.location.href = '/';
    };

    const sendMessage = () => {
        if (!message.trim() || !socketRef.current) return;

        socketRef.current.emit('chat-message', message, username);
        setMessage('');
    };

    const openChat = () => {
        setShowModal(true);
        setNewMessages(0);
    };

    return (
        <div>
            {askForUsername ? (
                <div>
                    <h2>Enter into Lobby</h2>

                    <TextField
                        id="outlined-basic"
                        label="Username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        variant="outlined"
                    />

                    <Button variant="contained" onClick={connect}>
                        Connect
                    </Button>

                    <div>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                        />
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>

                                <div className={styles.chattingDisplay}>
                                    {messages.length > 0 ? (
                                        messages.map((item, index) => (
                                            <div
                                                style={{ marginBottom: '20px' }}
                                                key={index}
                                            >
                                                <p style={{ fontWeight: 'bold' }}>
                                                    {item.sender}
                                                </p>
                                                <p>{item.data}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No Messages Yet</p>
                                    )}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField
                                        value={message}
                                        onChange={(event) =>
                                            setMessage(event.target.value)
                                        }
                                        label="Enter Your Chat"
                                        variant="outlined"
                                    />

                                    <Button
                                        variant="contained"
                                        onClick={sendMessage}
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttonContainers}>
                        <IconButton
                            onClick={handleVideo}
                            style={{ color: 'white' }}
                        >
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton
                            onClick={handleEndCall}
                            style={{ color: 'red' }}
                        >
                            <CallEndIcon />
                        </IconButton>

                        <IconButton
                            onClick={handleAudio}
                            style={{ color: 'white' }}
                        >
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable && (
                            <IconButton
                                onClick={handleScreen}
                                style={{ color: 'white' }}
                            >
                                {screen
                                    ? <StopScreenShareIcon />
                                    : <ScreenShareIcon />}
                            </IconButton>
                        )}

                        <Badge
                            badgeContent={newMessages}
                            max={999}
                            color="secondary"
                        >
                            <IconButton
                                onClick={openChat}
                                style={{ color: 'white' }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                        {showModal && (
                            <Button
                                onClick={() => setShowModal(false)}
                                color="inherit"
                            >
                                Close Chat
                            </Button>
                        )}
                    </div>

                    <video
                        className={styles.meetUserVideo}
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                    />

                    <div className={styles.conferenceView}>
                        {videos.map((item) => (
                            <div key={item.socketId}>
                                <video
                                    data-socket={item.socketId}
                                    ref={(ref) => {
                                        if (ref && item.stream) {
                                            ref.srcObject = item.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoMeet;