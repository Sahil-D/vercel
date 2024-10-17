import './Home.css';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();
  return (
    <div className="buttonCard">
      <div
        className="btn"
        onClick={() => {
          navigate('/project');
        }}
      >
        Create Project
      </div>
      <div
        className="btn"
        onClick={() => {
          navigate('/projects');
        }}
      >
        Show Projects
      </div>
    </div>
  );
}

export default Home;
