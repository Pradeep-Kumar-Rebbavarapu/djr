
import { Peer } from "peerjs";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import { useParams } from 'react-router-dom';
import { useEffect, useRef,useLayoutEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
export default function DjangoRoom() {
    const { roomID } = useParams()
    const myVideo = useRef();
    const ScreenShareBtnRef = useRef(null);
    const [screenSharing, setscreenSharing] = useState(false)
    var screenShare = false;
    const navigate = useNavigate();
    const screenShareRef = useRef();
    const peer = new Peer(undefined);
    const client = new W3CWebSocket('wss://www.pradeeps-video-conferencing.store/ws/chat/' + roomID + '/')
    let [localstream,setlocalstream] = useState(null)

    const toggleVideo = (enabled) => {
        const videoTrack = myVideo.current.srcObject.getVideoTracks()[0];
        videoTrack.enabled = enabled;
    };
    useEffect(() => {
        
        const peers = {};
        let type = localStorage.getItem('type');

        const videoGrid = document.getElementById("video-grid");
        const btnToggleAudio = document.getElementById("audio-btn");
        const btnToggleVideo = document.getElementById("video-btn");

        myVideo.current = document.createElement("video");
        myVideo.current.id = "myself";
        myVideo.current.muted = true;
        client.onopen = () => {
            
            console.log('WebSocket Client Connected');
        };
        peer.on("open", (id) => {
            client.send(JSON.stringify({
                "event": "join-room",
                "userID": id,
                "roomID": roomID
            }))
        });
        client.onmessage = (message) => {
            console.log(message)
            const data = JSON.parse(message.data)
            console.log(data)
            const event = data['event']
            
            if (event === 'user-disconnected') {
                console.log('user disconnected called')
                
                let userID = data['userID']
                console.log(userID)
                const newvideo = document.getElementById(userID);
                videoGrid.removeChild(newvideo);
                if (peers[userID]) {
                    peers[userID].close();
                }
            }
        };


        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localstream = stream;
                setlocalstream(stream)
                
                const audioTracks = stream.getAudioTracks();
                const videoTracks = stream.getVideoTracks();

                audioTracks[0].enabled = true;
                videoTracks[0].enabled = true;

                btnToggleAudio.addEventListener("click", () => {
                    audioTracks[0].enabled = !audioTracks[0].enabled;

                    if (audioTracks[0].enabled) {
                        btnToggleAudio.innerHTML = "Audio Mute";
                    } else {
                        btnToggleAudio.innerHTML = "Audio UnMute";
                    }
                });

                btnToggleVideo.addEventListener("click", () => {
                    toggleVideo(!videoTracks[0].enabled);

                    if (videoTracks[0].enabled) {
                        btnToggleVideo.innerHTML = "Video Off";
                    } else {
                        btnToggleVideo.innerHTML = "Video On";
                    }
                });

                addVideoStream(myVideo.current, stream);

                peer.on("call", (call) => {
                    console.log("video call");
                    call.answer(stream)

                    const video = document.createElement("video");
                    video.id = call.peer;
                    call.on("stream", (userVideoStream) => {
                        addVideoStream(video, userVideoStream);
                    });
                    call.on("close", () => {
                        video.style.display = "none";
                        video.style.visibility = "hidden";
                        video.remove();
                    });
                    
                });

                client.onmessage = (message) =>{
                    const data = JSON.parse(message.data)
                    const event = data['event']
                    if (event === "user-connected") {
                        let userID = data['userID']
                        if (screenShareRef.current) {
                            connectToNewUser(userID, screenShareRef.current, "screen");
                        } else {
                            console.log(localstream)
                            connectToNewUser(userID, stream, "video");
                        }
                    }
                }
            });

        

        


        function addVideoStream(video, stream) {
            video.srcObject = stream;
            video.addEventListener("loadedmetadata", () => {
                video.play();
                videoGrid.append(video);
            })
        }

        function connectToNewUser(userID, stream) {
            const call = peer.call(userID, stream);
            const video = document.createElement("video");
            video.id = userID;
            
            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });

            call.on("close", () => {
                video.style.visibility = "hidden";
                video.style.display = "none";
                video.remove();
            });
            call.on("error", () => {
                navigate("/");
            });
            peers[userID] = call;
        }

        console.log(screenShare)
        const handleScreenShare = () => {
            if (!screenShare) {
                navigator.mediaDevices
                    .getDisplayMedia({ video: true })
                    .then((screenStream) => {
                        
                        const videoTracks = screenStream.getVideoTracks();
                        const audioTracks = myVideo.current.srcObject.getAudioTracks();
                        screenShareRef.current = screenStream;
                        screenShare = true
                        setscreenSharing(true)
                        videoTracks[0].onended = () => {
                            stopScreenSharing(screenStream, audioTracks);
                        };

                        myVideo.current.srcObject = screenStream;
                        toggleVideo(true);

                        const peers = Object.values(peer.connections).flatMap(
                            (connection) => connection
                        );
                        peers.forEach((peer) => {
                            const sender = peer.peerConnection
                                .getSenders()
                                .find((sender) => sender.track.kind === "video");
                            sender.replaceTrack(videoTracks[0]);
                        });


                    })
                    .catch((error) => {
                        console.error("Error accessing screen media:", error);
                    });
            } else {
                stopScreenSharing(screenShareRef.current, myVideo.current.srcObject.getAudioTracks());
            }
        };

        const stopScreenSharing = (screenStream) => {

            screenShare = false
            setscreenSharing(false)
            // Stopping the screen stream
            screenStream.getTracks().forEach((track) => track.stop());

            // Resetting video source to the original video stream
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    const videoTrack = stream.getVideoTracks()[0];
                    videoTrack.enabled = true;
                    myVideo.current.srcObject = stream;

                    const peers = Object.values(peer.connections).flatMap((connection) => connection);
                    peers.forEach((peer) => {
                        const sender = peer.peerConnection.getSenders().find((sender) => sender.track.kind === "video");
                        sender.replaceTrack(videoTrack);

                    });
                })
                .catch((error) => {
                    console.error("Error accessing media devices:", error);
                });

            toggleVideo(true);
        };

        ScreenShareBtnRef.current.addEventListener("click", handleScreenShare);

    }, [])
    return (
        <div>
            <div>
                <div id="video-grid"></div>
                <div id="buttons">
                    <button id="audio-btn">Audio Mute</button>
                    <button id="video-btn">Video Off</button>
                    <button id="screen-share-btn" ref={ScreenShareBtnRef}>
                        {screenSharing ? "Stop Screen Share" : "Start Screen Share"}
                    </button>
                </div>
            </div>
        </div>
    )
}
