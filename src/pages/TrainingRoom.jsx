import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, XCircle, Play, Camera, ShieldAlert, Maximize, Minimize } from 'lucide-react';

export default function TrainingRoom() {
    const { exercise } = useParams(); // 'pushups' or 'squats'
    const navigate = useNavigate();
    
    const [cameraStatus, setCameraStatus] = useState("OFFLINE");
    const [reps, setReps] = useState(0);
    const [errorMsg, setErrorMsg] = useState("");
    const [processedFrame, setProcessedFrame] = useState(null); // <-- NEW: Stores the AI image
    const [isFullscreen, setIsFullscreen] = useState(false);

    // References to control the video stream and websocket
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const panelRef = useRef(null);

    // Synchronize fullscreen state with browser events (e.g. if user presses Escape)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = () => {
        const elem = panelRef.current;
        if (!elem) return;

        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) { /* Safari */
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { /* IE11 */
                elem.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
    };

    // Clean up everything if the user leaves the page abruptly
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            setErrorMsg("");
            setCameraStatus("INITIALIZING...");

            // 1. Ask user for camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Important: we need to wait for the video to actually start playing
                await videoRef.current.play(); 
            }

            // 2. Connect to the Python WebSocket Server
            const wsUrl = `ws://localhost:8000/ws/${exercise}`; 
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setCameraStatus("ACTIVE");
                setReps(0);
                
                // 3. Start taking pictures 10 times a second and sending them
                intervalRef.current = setInterval(captureAndSendFrame, 100); 
            };

            wsRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                // Update reps if Python sends them
                if (data.reps !== undefined) {
                    setReps(data.reps);
                }
                
                // NEW: Update the image frame if Python sends it
                if (data.frame) {
                    setProcessedFrame(`data:image/jpeg;base64,${data.frame}`);
                }
            };

            wsRef.current.onerror = (err) => {
                setErrorMsg("SYSTEM ERROR: AI Server connection lost. Is Python running?");
                stopCamera();
            };

            wsRef.current.onclose = () => {
                if (cameraStatus === "ACTIVE") stopCamera();
            };

        } catch (err) {
            setCameraStatus("OFFLINE");
            setErrorMsg("CAMERA REJECTED: Please grant browser permissions.");
        }
    };

    const captureAndSendFrame = () => {
        if (!videoRef.current || !canvasRef.current || !wsRef.current) return;
        if (wsRef.current.readyState !== WebSocket.OPEN) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current video frame onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the canvas to a Base64 string and send it to Python!
        const base64Image = canvas.toDataURL('image/jpeg', 0.5);
        wsRef.current.send(base64Image);
    };

    const stopCamera = async () => {
        // 1. Stop the loop
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        // 2. Shut off the webcam light
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // 3. Close the WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setCameraStatus("OFFLINE");
        setProcessedFrame(null); // Clear the last AI frame

        // 4. SYNC TO NODE.JS DATABASE (Only if they actually did reps!)
        if (reps > 0) {
            try {
                const token = localStorage.getItem('system_token');
                const payload = exercise === 'pushups' 
                    ? { completedPushups: reps } 
                    : { completedSquats: reps };

                await axios.post('http://localhost:5000/api/hunter/quest/update', payload, {
                    headers: { 'x-auth-token': token }
                });

                // Clear reps after successful sync
                setReps(0); 
                alert(`System Synced: ${reps} ${exercise} logged. Check your dashboard!`);
                navigate('/dashboard');
            } catch (err) {
                setErrorMsg("DATABASE ERROR: Failed to save XP.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-system-dark text-white flex flex-col items-center justify-center relative p-6">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('/scanlines.svg')] z-0"></div>

            <div 
                ref={panelRef} 
                className={`z-10 flex flex-col items-center relative transition-all duration-300
                    ${isFullscreen 
                        ? 'w-screen h-screen bg-[#050505] p-12 justify-between overflow-hidden' 
                        : 'w-full max-w-4xl bg-system-panel border border-system-gray clip-corner p-10 shadow-2xl'
                    }`}
            >
                {/* Abort Mission Button */}
                <div className={`z-20 transition-all ${isFullscreen ? 'absolute top-6 left-8' : 'absolute top-6 left-6'}`}>
                    <Link to="/dashboard" className="text-gray-500 sys-font text-xs hover:text-system-cyan transition-colors flex items-center gap-2">
                        <span>&larr;</span> ABORT MISSION
                    </Link>
                </div>

                {/* Header Info */}
                <div className={`z-20 flex items-center gap-2 sys-font text-xs transition-all ${isFullscreen ? 'absolute top-6 right-8' : 'absolute top-6 right-6'}`}>
                    <span className={cameraStatus === "ACTIVE" ? "text-system-cyan glow-text" : "text-gray-500"}>
                        SENSOR: {cameraStatus}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${cameraStatus === "ACTIVE" ? "bg-system-cyan shadow-[0_0_8px_#00ffcc] animate-pulse" : "bg-gray-600"}`}></div>
                </div>

                {/* Title and Reps Counter */}
                <div className={`flex justify-between items-end w-full px-8 z-10 transition-all duration-300
                    ${isFullscreen 
                        ? 'absolute top-16 left-0 right-0 px-12' 
                        : 'mb-8 mt-12'
                    }`}
                >
                    <div className="text-left">
                        <h2 className="sys-font text-system-cyan tracking-[0.3em] text-sm mb-2">TRAINING ROOM</h2>
                        <h1 className={`sys-font font-black uppercase glow-text transition-all ${isFullscreen ? 'text-6xl' : 'text-5xl'}`}>{exercise}</h1>
                    </div>
                    <div className="text-right">
                        <h2 className="sys-font text-gray-500 tracking-[0.3em] text-sm mb-2">CURRENT SESSION</h2>
                        <h1 className={`sys-font font-black text-system-cyan glow-text transition-all ${isFullscreen ? 'text-7xl' : 'text-6xl'}`}>{reps}</h1>
                    </div>
                </div>

                {/* VIDEO FEED UI */}
                <div 
                    className={`bg-black border border-system-gray relative flex items-center justify-center overflow-hidden transition-all duration-300
                        ${isFullscreen 
                            ? 'absolute inset-0 w-full h-full border-none z-0' 
                            : 'w-full mb-8'
                        }`}
                    style={isFullscreen ? {} : { aspectRatio: '16/9' }}
                >
                    {/* The raw invisible video element */}
                    <video 
                        ref={videoRef} 
                        className="opacity-0 absolute w-[1px] h-[1px]" 
                        muted 
                        playsInline
                    ></video>
                    
                    {/* Hidden canvas for taking pictures */}
                    <canvas ref={canvasRef} className="hidden"></canvas>

                    {/* THE AI PROCESSED STREAM */}
                    {processedFrame && cameraStatus === "ACTIVE" && (
                        <img 
                            src={processedFrame} 
                            alt="AI Feed" 
                            className={`w-full h-full transition-all duration-300 ${isFullscreen ? 'object-contain' : 'object-cover'}`} 
                        />
                    )}

                    {/* Offline Screen */}
                    {cameraStatus !== "ACTIVE" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 sys-font z-10">
                            <Camera size={48} className="mb-4 opacity-50" />
                            <p>CAMERA FEED OFFLINE</p>
                            {errorMsg && (
                                <div className="mt-4 text-red-500 bg-red-500/10 border border-red-500/30 px-4 py-2 flex items-center gap-2">
                                    <ShieldAlert size={16} /> {errorMsg}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* UI Overlay corners when Active */}
                    {cameraStatus === "ACTIVE" && (
                        <div className="absolute inset-0 pointer-events-none border-2 border-system-cyan/20 flex flex-col justify-between p-4 z-10">
                            <div className="flex justify-between">
                                <div className="w-8 h-8 border-t-2 border-l-2 border-system-cyan"></div>
                                <div className="w-8 h-8 border-t-2 border-r-2 border-system-cyan"></div>
                            </div>
                            <div className="flex justify-between">
                                <div className="w-8 h-8 border-b-2 border-l-2 border-system-cyan"></div>
                                <div className="w-8 h-8 border-b-2 border-r-2 border-system-cyan"></div>
                            </div>
                        </div>
                    )}

                    {/* Fullscreen HUD Toggle Button inside video box (bottom-right) */}
                    <button 
                        onClick={toggleFullscreen}
                        className={`absolute bottom-4 right-4 bg-black/75 hover:bg-system-cyan hover:text-black border border-system-cyan/40 text-system-cyan py-2 px-3 clip-corner transition-all z-20 flex items-center gap-2 sys-font text-[10px] tracking-wider font-bold`}
                    >
                        {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                        {isFullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN MODE"}
                    </button>
                </div>

                {/* CONTROLS */}
                <div className={`w-full transition-all duration-300 flex gap-6
                    ${isFullscreen 
                        ? 'absolute bottom-8 left-0 right-0 px-12 z-20 max-w-4xl mx-auto bg-black/60 border border-system-gray/40 p-6 clip-corner backdrop-blur-md' 
                        : ''
                    }`}
                >
                    <button 
                        onClick={startCamera}
                        disabled={cameraStatus === "ACTIVE" || cameraStatus === "INITIALIZING..."}
                        className={`flex-1 py-4 sys-font font-bold tracking-widest text-lg flex justify-center items-center gap-2 transition-all border clip-corner
                            ${cameraStatus === "ACTIVE" || cameraStatus === "INITIALIZING..."
                                ? 'bg-system-dark border-gray-600 text-gray-600 cursor-not-allowed' 
                                : 'border-system-cyan text-system-cyan hover:bg-system-cyan hover:text-black glow-border'}`}
                    >
                        <Play size={20} /> START TRACKING
                    </button>

                    <button 
                        onClick={stopCamera}
                        disabled={cameraStatus === "OFFLINE"}
                        className={`flex-1 py-4 sys-font font-bold tracking-widest text-lg flex justify-center items-center gap-2 transition-all border clip-corner
                            ${cameraStatus === "OFFLINE" 
                                ? 'bg-system-dark border-gray-600 text-gray-600 cursor-not-allowed' 
                                : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black shadow-[0_0_15px_rgba(255,0,0,0.4)]'}`}
                    >
                        <XCircle size={20} /> END SESSION & SYNC
                    </button>
                </div>
            </div>
        </div>
    );
}