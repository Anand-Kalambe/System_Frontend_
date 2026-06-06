import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Zap } from 'lucide-react';
import axios from 'axios';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleConnect = async (e) => {
        e.preventDefault();
        
        try {
            // 1. Hit your REAL Node.js login endpoint
            const res = await axios.post('https://system-backend-60o1.onrender.com/api/auth/login', { 
                email: email, 
                password: password 
            });
            
            // 2. Save the REAL JWT token provided by the database
            localStorage.setItem('system_token', res.data.token);
            
            // 3. Jump to the Dashboard
            navigate('/dashboard');
            
        } catch (err) {
            // If wrong password or email, show the error from the backend
            setError(err.response?.data?.msg || 'SYSTEM CONNECTION FAILED');
        }
    };

    return (
        <div className="min-h-screen bg-system-dark flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-10 pointer-events-none z-0"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-system-cyan shadow-[0_0_20px_#00ffcc] z-0"></div>

            {/* Header */}
            <div className="z-10 text-center mb-8">
                <h1 className="sys-font text-5xl font-black tracking-widest text-white glow-text mb-2">
                    PLAYER AUTHENTICATION
                </h1>
                <p className="sys-font text-system-cyan tracking-[0.3em] text-sm">
                    - INITIALIZE NEURAL LINK -
                </p>
            </div>

            {/* Login Box */}
            <div className="z-10 bg-system-panel/90 border border-system-gray p-8 w-[450px] clip-corner shadow-2xl relative">
                
                {/* Decorative Square top right */}
                <div className="absolute top-2 right-2 w-3 h-3 border border-system-cyan"></div>

                <form onSubmit={handleConnect} className="space-y-6">
                    
                    {/* Identity Input */}
                    <div>
                        <label className="sys-font text-[10px] text-gray-400 tracking-widest block mb-2">
                            IDENTITY_HASH
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-system-dark border border-system-gray text-white px-4 py-3 focus:outline-none focus:border-system-cyan font-mono transition-colors"
                                placeholder="hunter@system.net"
                            />
                            <User className="absolute right-3 top-3 text-gray-500" size={18} />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="sys-font text-[10px] text-gray-400 tracking-widest block mb-2">
                            ACCESS_KEY
                        </label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-system-dark border border-system-gray text-white px-4 py-3 focus:outline-none focus:border-system-cyan font-mono transition-colors"
                                placeholder="••••••••••••"
                            />
                            <Lock className="absolute right-3 top-3 text-gray-500" size={18} />
                        </div>
                    </div>

               
                    

                    {/* Connect Button */}
                    <button 
                        type="submit"
                        className="w-full bg-system-cyan/10 border border-system-cyan text-system-cyan sys-font font-bold tracking-widest py-4 hover:bg-system-cyan hover:text-black transition-all glow-border flex justify-center items-center gap-2"
                    >
                        CONNECT <Zap size={18} />
                    </button>
                </form>

                {/* Legacy Auth */}
                <div className="mt-8 text-center">
                    <p className="sys-font text-[10px] text-gray-500 tracking-widest mb-4">LEGACY AUTH</p>
                    
                </div>

            </div>

            {/* Footer Registration Link */}
            <div className="z-10 mt-6 sys-font text-xs tracking-widest">
                <span className="text-gray-500">NEW PLAYER DETECTED? </span>
              <Link to="/register" className="text-system-cyan hover:text-white transition-colors cursor-pointer border-b border-system-cyan pb-1">
                    COMMENCE ONBOARDING
                </Link>
            </div>
        </div>
    );
}