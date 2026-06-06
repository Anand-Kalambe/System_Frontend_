import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Leaderboard() {
    const [hunters, setHunters] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get('https://system-backend-60o1.onrender.com/api/hunter/leaderboard');
                setHunters(res.data);
            } catch (err) {
                console.error("Failed to load Leaderboard", err);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <div className="min-h-screen bg-system-dark text-white p-6 grid grid-cols-12 gap-6 relative">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('/scanlines.svg')] z-0"></div>

            {/* STANDARDIZED LEFT SIDEBAR */}
            <div className="col-span-2 space-y-4 z-10">
                <div className="text-system-cyan sys-font font-bold tracking-widest text-sm mb-10 border-b border-system-cyan/30 pb-2">
                    SYSTEM STATUS<br/><span className="text-[10px] text-green-500">CONNECTION STABLE</span>
                </div>
                <nav className="flex flex-col space-y-4 sys-font text-sm text-gray-400">
                    <Link to="/dashboard" className="hover:text-white transition-colors pl-3">DASHBOARD PROFILE</Link>
                    <Link to="/leaderboard" className="text-system-cyan glow-text border-l-2 border-system-cyan pl-3">RANK HUNTER</Link>
                    <Link to="/quests" className="hover:text-white transition-colors pl-3 mt-8">QUEST LOG</Link>
                </nav>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="col-span-10 z-10">
                <div className="border-b border-system-gray pb-4 mb-8">
                    <h2 className="text-xs text-system-cyan sys-font tracking-widest mb-1">GLOBAL DATABASE</h2>
                    <h1 className="text-5xl sys-font font-black uppercase tracking-widest">HALL OF FAME</h1>
                </div>

                {/* THE LEADERBOARD TABLE */}
                <div className="bg-system-panel border border-system-gray clip-corner p-6">
                    <table className="w-full text-left sys-font">
                        <thead>
                            <tr className="text-gray-500 text-xs tracking-widest border-b border-system-gray">
                                <th className="pb-4 pl-4">RANK</th>
                                <th className="pb-4">HUNTER</th>
                                <th className="pb-4 text-center">LEVEL</th>
                                <th className="pb-4 text-right pr-4">TOTAL REPS (S/P)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hunters.map((h, index) => (
                                <tr key={h._id} className="border-b border-system-gray/30 hover:bg-system-cyan/5 transition-colors">
                                    <td className="py-4 pl-4 text-2xl font-bold text-system-cyan glow-text">#{index + 1}</td>
                                    <td className="py-4 font-bold text-xl uppercase">
                                        {h.username} <span className="text-xs text-gray-500 ml-2">[{h.rank}]</span>
                                    </td>
                                    <td className="py-4 text-center text-xl">{h.level}</td>
                                    <td className="py-4 text-right pr-4 text-system-cyan">
                                        {h.totalStats.squats} / {h.totalStats.pushups}
                                    </td>
                                </tr>
                            ))}
                            {hunters.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-10 text-gray-500">NO HUNTER DATA FOUND IN ARCHIVES.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}