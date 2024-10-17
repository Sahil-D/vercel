import { useEffect, useState } from 'react';
import './ListProjects.css';
import axios from 'axios';
import config from '../config';
import { useNavigate } from 'react-router-dom';

export function ListProjects() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      const res = await axios.get(config.BASE_PATH + '/project');
      // console.log(res.data.data);
      setIsLoading(false);
      setProjects(res.data?.data);
    };
    fetchProjects();
  }, []);

  return (
    <div className="contianer">
      <h2>Projects :-</h2>
      {isLoading ? (
        <h2> Loading... </h2>
      ) : (
        projects.map((p) => {
          return (
            <div
              key={p.subDomain}
              className="card"
              onClick={() => {
                navigate(`/project/${p.subDomain}`, {
                  state: {
                    projectId: p.id,
                  },
                });
              }}
            >
              <div>{p.subDomain}</div>
              <div>&gt;</div>
            </div>
          );
        })
      )}
    </div>
  );
}
export default ListProjects;
