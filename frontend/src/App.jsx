import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from '../src/components/Home';
import ListProjects from './components/ListProjects';
import CreateProject from './components/CreateProject';
import ProjectDetails from './components/ProjectDetails';

function App() {
  return (
    <div className="rootPage">
      <Router>
        <div className="header">
          <h1>VERCEL</h1>
        </div>
        <div className="componentPart">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<ListProjects />} />
            <Route path="/project" element={<CreateProject />} />
            <Route
              path="/project/:projectSubDomain"
              element={<ProjectDetails />}
            />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
