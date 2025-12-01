import React from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { Trending } from './pages/Trending';
import { Search } from './pages/Search';
import { Player } from './pages/Player';

const MainLayout = () => {
  return (
    <>
      <div className="min-h-screen bg-[#0f0f0f]">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
};

import { InstallPWA } from './components/InstallPWA';

const App: React.FC = () => {
  return (
    <Router>
      <InstallPWA />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/search" element={<Search />} />
        </Route>
        {/* Player is separate to hide bottom nav or manage layout differently */}
        <Route path="/play/:id" element={<Player />} />
      </Routes>
    </Router>
  );
};

export default App;
