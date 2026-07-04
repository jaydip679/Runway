import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<div className="p-4 bg-white shadow rounded-lg">Welcome to Runway</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
