import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, ShieldPlus } from 'lucide-react';
import axios from 'axios';

export default function Register() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('ESTABLISHING NEURAL LINK...');

        try {
            // Hit your REAL Node.js registration endpoint
            const res = await axios.post('http://localhost:5000/api/auth/register', { 
                username,
                email, 
                password 
            });
            
            setStatus('AWAKENING SUCCESSFUL. LOGGING IN...');
            
            // Save the JWT token provided by the database
            localStorage.setItem('system_token', res.data.token);
            
            // Jump to the Dashboard
            setTimeout(() => navigate('/dashboard'), 1000);
            
        } catch (err) {
            setStatus('');
            setError(err.response?.data?.msg || 'SYSTEM REJECTION: REGISTRATION FAILED');
        }
    };

    return (
        <div className="min-h-screen bg-system-dark flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('/scanlines.svg')] opacity-10 pointer-events-none z-0"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-system-cyan shadow-[0_0_20px_#00ffcc] z-0"></div>

            {/* Header */}
            <div className="z-10 text-center mb-8">
                <h1 className="sys-font text-5xl font-black tracking-widest text-white glow-text mb-2">
                    PLAYER AWAKENING
                </h1>
                <p className="sys-font text-system-cyan tracking-[0.3em] text-sm">
                    - COMMENCE ONBOARDING PROTOCOL -
                </p>
            </div>

            {/* Registration Box */}
            <div className="z-10 bg-system-panel/90 border border-system-gray p-8 w-[450px] clip-corner shadow-2xl relative">
                
                <div className="absolute top-2 right-2 w-3 h-3 border border-system-cyan"></div>

                <form onSubmit={handleRegister} className="space-y-6">
                    
                    {/* Username Input */}
                    <div>
                        <label className="sys-font text-[10px] text-gray-400 tracking-widest block mb-2">
                            HUNTER_ALIAS (USERNAME)
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-system-dark border border-system-gray text-white px-4 py-3 focus:outline-none focus:border-system-cyan font-mono transition-colors"
                                placeholder="SungJinWoo"
                            />
                            <User className="absolute right-3 top-3 text-gray-500" size={18} />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="sys-font text-[10px] text-gray-400 tracking-widest block mb-2">
                            CONTACT_LINK (EMAIL)
                        </label>
                        <div className="relative">
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-system-dark border border-system-gray text-white px-4 py-3 focus:outline-none focus:border-system-cyan font-mono transition-colors"
                                placeholder="hunter@system.net"
                            />
                            <Mail className="absolute right-3 top-3 text-gray-500" size={18} />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="sys-font text-[10px] text-gray-400 tracking-widest block mb-2">
                            ACCESS_KEY (PASSWORD)
                        </label>
                        <div className="relative">
                            <input 
                                type="password" 
                                required
                                minLength="6"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-system-dark border border-system-gray text-white px-4 py-3 focus:outline-none focus:border-system-cyan font-mono transition-colors"
                                placeholder="••••••••••••"
                            />
                            <Lock className="absolute right-3 top-3 text-gray-500" size={18} />
                        </div>
                    </div>

                    {/* Status & Error Messages */}
                    <div className="h-4 text-center sys-font text-xs tracking-widest">
                        {error && <span className="text-red-500 animate-pulse">{error}</span>}
                        {status && <span className="text-system-cyan animate-pulse">{status}</span>}
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit"
                        className="w-full bg-system-cyan/10 border border-system-cyan text-system-cyan sys-font font-bold tracking-widest py-4 hover:bg-system-cyan hover:text-black transition-all glow-border flex justify-center items-center gap-2"
                    >
                        AWAKEN <ShieldPlus size={18} />
                    </button>
                </form>
            </div>

            {/* Footer Back Link */}
            <div className="z-10 mt-6 sys-font text-xs tracking-widest">
                <span className="text-gray-500">ALREADY REGISTERED IN THE DATABASE? </span>
                <Link to="/" className="text-system-cyan hover:text-white transition-colors cursor-pointer border-b border-system-cyan pb-1">
                    RETURN TO AUTH
                </Link>
            </div>
        </div>
    );
}