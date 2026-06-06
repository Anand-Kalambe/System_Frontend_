import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Target, AlertTriangle, Lock } from 'lucide-react';

export default function QuestLog() {
    const [hunter, setHunter] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('system_token');
                if (!token) {
                    navigate('/');
                    return;
                }
                const res = await axios.get('https://system-backend-60o1.onrender.com/api/hunter/profile', {
                    headers: { 'x-auth-token': token }
                });
                setHunter(res.data);
            } catch (err) {
                navigate('/');
            }
        };
        fetchProfile();
    }, [navigate]);

    if (!hunter) return <div className="flex h-screen items-center justify-center text-system-cyan glow-text sys-font text-2xl">ACCESSING QUEST ARCHIVES...</div>;

    const squatsPercent = Math.min((hunter.dailyQuests.squatsDone / hunter.dailyQuests.squatsTarget) * 100, 100);
    const pushupsPercent = Math.min((hunter.dailyQuests.pushupsDone / hunter.dailyQuests.pushupsTarget) * 100, 100);
    const isDone = hunter.dailyQuests.isQuestCompleted;

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
                    <Link to="/leaderboard" className="hover:text-white transition-colors pl-3">RANK HUNTER</Link>
                    <Link to="/quests" className="text-system-cyan glow-text border-l-2 border-system-cyan pl-3 mt-8">QUEST LOG</Link>
                </nav>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="col-span-10 flex flex-col space-y-8 z-10">
                
                <div className="border-b border-system-gray pb-4">
                    <h2 className="text-xs text-system-cyan sys-font tracking-widest mb-1">MISSION CONTROL</h2>
                    <h1 className="text-5xl sys-font font-black uppercase tracking-widest">ACTIVE DIRECTIVES</h1>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    
                    {/* DAILY QUEST (ACTIVE) */}
                    <div className={`border p-8 clip-corner relative ${isDone ? 'border-green-500 bg-green-500/5' : 'border-system-cyan bg-system-panel shadow-[0_0_15px_rgba(0,255,204,0.1)]'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <Target className={isDone ? "text-green-500" : "text-system-cyan"} size={24} />
                            <h3 className="sys-font text-2xl font-bold tracking-widest text-white">DAILY QUEST</h3>
                        </div>
                        
                        <h4 className="sys-font text-xl mb-2 text-gray-300">PREPARATION FOR GREATNESS</h4>
                        <p className="text-sm text-gray-400 mb-8 h-10">
                            {isDone ? "Training complete. Status recovery applied." : "Complete the following regimen to prove your strength and avoid the Penalty Zone."}
                        </p>

                        {/* Objectives */}
                        <div className="space-y-6">
                            {/* Pushups */}
                            <div>
                                <div className="flex justify-between sys-font text-xs mb-2">
                                    <span className="text-gray-400">PUSH-UPS</span>
                                    <span className={hunter.dailyQuests.pushupsDone >= hunter.dailyQuests.pushupsTarget ? "text-green-500" : ""}>
                                        {hunter.dailyQuests.pushupsDone} / {hunter.dailyQuests.pushupsTarget}
                                    </span>
                                </div>
                                <div className="w-full bg-system-dark h-1 border border-system-gray/50">
                                    <div className={`h-full ${hunter.dailyQuests.pushupsDone >= hunter.dailyQuests.pushupsTarget ? 'bg-green-500' : 'bg-system-cyan'}`} style={{ width: `${pushupsPercent}%` }}></div>
                                </div>
                            </div>
                            
                            {/* Squats */}
                            <div>
                                <div className="flex justify-between sys-font text-xs mb-2">
                                    <span className="text-gray-400">SQUATS</span>
                                    <span className={hunter.dailyQuests.squatsDone >= hunter.dailyQuests.squatsTarget ? "text-green-500" : ""}>
                                        {hunter.dailyQuests.squatsDone} / {hunter.dailyQuests.squatsTarget}
                                    </span>
                                </div>
                                <div className="w-full bg-system-dark h-1 border border-system-gray/50">
                                    <div className={`h-full ${hunter.dailyQuests.squatsDone >= hunter.dailyQuests.squatsTarget ? 'bg-green-500' : 'bg-system-cyan'}`} style={{ width: `${squatsPercent}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="mt-8 pt-6 border-t border-system-gray flex justify-between items-center">
                            <span className="sys-font text-xs text-gray-500 tracking-widest">
                                REWARD: FULL RECOVERY, XP GAIN
                            </span>
                            {!isDone && (
                                <Link to="/dashboard" className="border border-system-cyan text-system-cyan px-6 py-2 sys-font text-xs hover:bg-system-cyan hover:text-black transition-colors">
                                    PROCEED TO TRAINING
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* PENALTY QUEST (LOCKED) */}
                    {/* <div className="flex flex-col gap-6">
                        <div className="border border-red-900 bg-red-950/20 p-6 clip-corner relative opacity-50 grayscale pointer-events-none">
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <Lock size={40} className="text-red-500 opacity-50" />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="text-red-500" size={20} />
                                <h3 className="sys-font text-xl font-bold tracking-widest text-red-500">PENALTY QUEST</h3>
                            </div>
                            <h4 className="sys-font text-lg text-gray-400">SURVIVE THE CENTIPEDE DESERT</h4>
                            <p className="text-xs text-gray-500 mt-2">Failure to complete the Daily Quest will result in immediate teleportation to the Penalty Zone. Survive for 4 hours.</p>
                        </div> */}

                        {/* CAMPAIGN QUEST (LOCKED) */}
                        {/* <div className="border border-system-gray bg-system-panel/50 p-6 clip-corner relative opacity-50 pointer-events-none">
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <Lock size={40} className="text-gray-500 opacity-50" />
                            </div>
                            <h3 className="sys-font text-xl font-bold tracking-widest text-gray-400 mb-2">JOB CHANGE QUEST</h3>
                            <h4 className="sys-font text-lg text-gray-500">REQUIREMENT: LEVEL 40</h4>
                            <p className="text-xs text-gray-600 mt-2">Prove your worth to the System to unlock your true class.</p>
                        </div>
                    </div> */}

                </div>
            </div>
        </div>
    );
}