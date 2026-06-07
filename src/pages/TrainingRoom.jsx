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
    const [isFullscreen, setIsFullscreen] = useState(false);

    // References to control the video stream and websocket
    const videoRef = useRef(null);
    const canvasRef = useRef(null); // Used for capturing frames to send
    const overlayCanvasRef = useRef(null); // Used for drawing AI skeleton
    const wsRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const panelRef = useRef(null);
    const isProcessingRef = useRef(false);

    const SKELETON_FULL = [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
        [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
        [24, 26], [26, 28], [27, 29], [28, 30], [29, 31],
        [30, 32], [27, 31], [28, 32]
    ];

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
            const wsUrl = `wss://system-mediapipe-1.onrender.com/ws/${exercise}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setCameraStatus("ACTIVE");
                setReps(0);
                
                // 3. Start taking pictures 10 times a second and sending them
                intervalRef.current = setInterval(captureAndSendFrame, 100); 
            };

            wsRef.current.onmessage = (event) => {
                isProcessingRef.current = false; // Unlock sending next frame
                const data = JSON.parse(event.data);
                
                // Update reps if Python sends them
                if (data.reps !== undefined) {
                    setReps(data.reps);
                }
                
                if (data.landmarks && overlayCanvasRef.current && videoRef.current) {
                    drawOverlay(data);
                } else if (overlayCanvasRef.current && videoRef.current) {
                    // Clear overlay if no landmarks
                    const canvas = overlayCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        if (isProcessingRef.current) return; // Prevent WebSocket flood/lag

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Downscale image to vastly improve server AI processing speed and reduce network load
        const max_width = 480;
        const scale = Math.min(1, max_width / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        // Draw the current video frame onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the canvas to a Base64 string and send it to Python!
        const base64Image = canvas.toDataURL('image/jpeg', 0.5);
        
        isProcessingRef.current = true; // Lock until server responds
        wsRef.current.send(base64Image);
    };

    const drawOverlay = (data) => {
        const canvas = overlayCanvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const w = canvas.width;
        const h = canvas.height;
        const { landmarks, arm_color, back_color, l_color, r_color, warning } = data;

        if (landmarks && landmarks.length > 0) {
            // Draw lines
            ctx.lineWidth = 3;
            SKELETON_FULL.forEach(([s, e]) => {
                const p1 = landmarks[s];
                const p2 = landmarks[e];
                if (!p1 || !p2) return;

                let color = "#ffffff";
                if (exercise === 'pushups') {
                    if ((s === 11 || s === 13 || s === 12 || s === 14) && (e === 13 || e === 15 || e === 14 || e === 16)) {
                        color = arm_color || "#ffffff";
                    } else if ([11, 12, 23, 24, 25, 26].includes(s) && [23, 24, 25, 26, 27, 28].includes(e)) {
                        color = back_color || "#ffffff";
                    }
                } else {
                    if ((s === 23 || s === 25) && (e === 25 || e === 27)) {
                        color = l_color || "#ffffff";
                    } else if ((s === 24 || s === 26) && (e === 26 || e === 28)) {
                        color = r_color || "#ffffff";
                    } else if ((s === 11 && e === 23) || (s === 12 && e === 24) || (s === 23 && e === 24)) {
                        color = back_color || "#ffffff";
                    }
                }

                ctx.strokeStyle = color;
                ctx.beginPath();
                ctx.moveTo(p1.x * w, p1.y * h);
                ctx.lineTo(p2.x * w, p2.y * h);
                ctx.stroke();
            });

            // Draw points
            ctx.fillStyle = "#ff00ff";
            for (let i = 11; i <= 32; i++) {
                const p = landmarks[i];
                if (p) {
                    ctx.beginPath();
                    ctx.arc(p.x * w, p.y * h, 5, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }

            if (warning) {
                ctx.fillStyle = "#ff0000";
                ctx.font = "bold 30px Arial";
                ctx.fillText(warning, 30, h - 30);
            }
        }
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
        if (overlayCanvasRef.current) {
            const canvas = overlayCanvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // 4. SYNC TO NODE.JS DATABASE (Only if they actually did reps!)
        if (reps > 0) {
            try {
                const token = localStorage.getItem('system_token');
                const payload = exercise === 'pushups' 
                    ? { completedPushups: reps } 
                    : { completedSquats: reps };

                await axios.post('https://system-backend-60o1.onrender.com/api/hunter/quest/update', payload, {
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
                    {/* The raw video element (now visible!) */}
                    <video 
                        ref={videoRef} 
                        className={`transition-all duration-300 ${cameraStatus === "ACTIVE" ? 'w-full h-full' : 'opacity-0 absolute w-[1px] h-[1px]'} ${isFullscreen ? 'object-contain' : 'object-cover'}`} 
                        muted 
                        playsInline
                    ></video>
                    
                    {/* Hidden canvas for taking pictures to send to Python */}
                    <canvas ref={canvasRef} className="hidden"></canvas>

                    {/* OVERLAY CANVAS FOR DRAWING SKELETON */}
                    <canvas 
                        ref={overlayCanvasRef} 
                        className={`absolute inset-0 w-full h-full pointer-events-none transition-all duration-300 ${isFullscreen ? 'object-contain' : 'object-cover'} ${cameraStatus === "ACTIVE" ? 'opacity-100' : 'opacity-0'}`} 
                    ></canvas>

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