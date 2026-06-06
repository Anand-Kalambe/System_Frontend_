import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Target, Zap } from 'lucide-react';

export default function Dashboard() {
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
                const res = await axios.get('http://localhost:5000/api/hunter/profile', {
                    headers: { 'x-auth-token': token }
                });
                setHunter(res.data);
            } catch (err) {
                console.error("Failed to load Hunter Profile:", err);
                localStorage.removeItem('system_token');
                navigate('/');
            }
        };
        fetchProfile();
    }, [navigate]);

    // ROUTE TO THE NEW TRAINING ROOM PAGE
    const executeQuest = (exerciseType) => {
        navigate(`/training/${exerciseType}`);
    };

    if (!hunter) return <div className="flex h-screen items-center justify-center text-system-cyan glow-text sys-font text-2xl">SYNCING WITH SERVER...</div>;

    return (
        <div className="min-h-screen bg-system-dark text-white p-6 grid grid-cols-12 gap-6 relative">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('/scanlines.svg')] z-0"></div>

            {/* LEFT SIDEBAR (Cleaned Up) */}
            <div className="col-span-2 space-y-4 z-10">
                <div className="text-system-cyan sys-font font-bold tracking-widest text-sm mb-10 border-b border-system-cyan/30 pb-2">
                    SYSTEM STATUS<br/><span className="text-[10px] text-green-500">CONNECTION STABLE</span>
                </div>
                <nav className="flex flex-col space-y-4 sys-font text-sm text-gray-400">
                    <Link to="/dashboard" className="text-system-cyan glow-text border-l-2 border-system-cyan pl-3">DASHBOARD PROFILE</Link>
                    <Link to="/leaderboard" className="hover:text-white transition-colors pl-3">RANK HUNTER</Link>
                   <Link to="/quests" className="hover:text-white transition-colors pl-3 mt-8">QUEST LOG</Link>
                </nav>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="col-span-7 flex flex-col space-y-8 z-10">
                {/* HEADER */}
                <div className="flex items-end justify-between border-b border-system-gray pb-4">
                    <div>
                        <h2 className="text-xs text-system-cyan sys-font tracking-widest mb-1">PLAYER STATUS</h2>
                        <h1 className="text-5xl sys-font font-black uppercase leading-none">{hunter.username}</h1>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xs text-gray-500 sys-font tracking-widest">RANK</h2>
                        <p className="text-4xl sys-font font-bold text-system-cyan glow-text uppercase">{hunter.rank}</p>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xs text-gray-500 sys-font tracking-widest">LEVEL</h2>
                        <p className="text-4xl sys-font font-bold">{hunter.level}</p>
                    </div>
                </div>

                {/* QUEST CARDS */}
                <div className="grid grid-cols-2 gap-6">
                    <QuestCard 
                        title="PUSH-UPS" 
                        type="STRENGTH TRAINING"
                        current={hunter.dailyQuests.pushupsDone} 
                        target={hunter.dailyQuests.pushupsTarget} 
                        xp="???"
                        onExecute={() => executeQuest('pushups')}
                        completed={hunter.dailyQuests.isQuestCompleted}
                    />
                    <QuestCard 
                        title="SQUATS" 
                        type="STAMINA TRAINING"
                        current={hunter.dailyQuests.squatsDone} 
                        target={hunter.dailyQuests.squatsTarget} 
                        xp="???"
                        onExecute={() => executeQuest('squats')}
                        completed={hunter.dailyQuests.isQuestCompleted}
                    />
                </div>

                {/* STAT BARS */}
                <div className="grid grid-cols-2 gap-10 mt-10">
                    <div className="space-y-6">
                        <StatBar label="XP" color="bg-system-cyan" current={hunter.currentXP} max={hunter.xpToNextLevel} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sys-font text-center text-xl">
                        <div className="bg-system-panel border border-system-gray p-4 clip-corner">
                            <span className="text-xs text-gray-500 block">TOTAL SQUATS</span>{hunter.totalStats.squats}
                        </div>
                        <div className="bg-system-panel border border-system-gray p-4 clip-corner">
                            <span className="text-xs text-gray-500 block">TOTAL PUSHUPS</span>{hunter.totalStats.pushups}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR (Only Daily Quest now) */}
            <div className="col-span-3 bg-system-panel/50 border-l border-system-gray p-6 z-10">
                <h3 className="sys-font text-system-cyan mb-6 flex items-center gap-2"><Target size={18}/> ACTIVE QUESTS</h3>
                <div className="space-y-6">
                    <div className={`border p-4 clip-corner ${hunter.dailyQuests.isQuestCompleted ? 'border-green-500 bg-green-500/10' : 'border-system-cyan glow-border bg-system-cyan/10'}`}>
                        <p className="text-[10px] text-system-cyan mb-2 tracking-widest">DAILY QUEST</p>
                        <h4 className="sys-font text-xl font-bold">{hunter.dailyQuests.isQuestCompleted ? "QUEST COMPLETE" : "PREPARATION FOR GREATNESS"}</h4>
                        <div className="w-full h-[1px] bg-system-cyan/30 my-3"></div>
                        <p className="text-sm text-gray-400">
                            {hunter.dailyQuests.isQuestCompleted 
                                ? "Daily training requirements met. System rewards have been deposited into your status." 
                                : "The System requires you to complete your physical training regimen to increase your lifetime stats and unlock higher ranks."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuestCard({ title, type, current, target, unit = "", xp, onExecute, completed }) {
    const percent = Math.min((current / target) * 100, 100);
    const isDone = current >= target;

    return (
        <div className={`bg-system-panel border p-5 flex flex-col justify-between clip-corner relative group transition-colors ${isDone ? 'border-green-500' : 'border-system-gray hover:border-system-cyan'}`}>
            <div>
                <h3 className="sys-font text-2xl font-bold">{title}</h3>
                <p className="text-[10px] text-system-cyan tracking-widest">{type}</p>
            </div>
            <div className="mt-8 mb-4">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">PROGRESS</span>
                    <span className={isDone ? 'text-green-500' : ''}>{current}/{target} {unit}</span>
                </div>
                <div className="w-full bg-system-dark h-1">
                    <div className={`h-1 ${isDone ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-system-cyan shadow-[0_0_8px_#00ffcc]'}`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
            <div className="flex justify-between items-center mt-4">
                <div className="text-system-cyan text-sm flex items-center gap-1">
                    <Zap size={14} /> {xp} XP
                </div>
                <button 
                    onClick={onExecute}
                    className="sys-font text-xs border border-system-cyan px-4 py-2 hover:bg-system-cyan hover:text-black transition-all glow-border"
                >
                    EXECUTE
                </button>
            </div>
        </div>
    );
}

function StatBar({ label, color, current, max }) {
    const percent = Math.min((current / max) * 100, 100);
    return (
        <div className="flex items-center gap-4">
            <div className="sys-font text-xl w-8 font-bold text-system-cyan">{label}</div>
            <div className="flex-1">
                <div className="w-full bg-system-panel h-6 border border-system-gray relative clip-corner">
                    <div className={`${color} h-full shadow-[0_0_10px_#00ffcc]`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
            <div className="w-32 text-right sys-font text-sm">
                {current.toLocaleString()} / {max.toLocaleString()}
            </div>
        </div>
    );
}