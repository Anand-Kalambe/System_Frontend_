import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register'; // <-- Import the new page
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import TrainingRoom from './pages/TrainingRoom';
import QuestLog from './pages/QuestLog';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} /> {/* <-- Add the route */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/quests" element={<QuestLog />} />
      <Route path="/training/:exercise" element={<TrainingRoom />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;