import { useEffect, useState } from 'react';
import './ProjectDetails.css';
import axios from 'axios';
import config from '../config';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

export function ProjectDetails() {
  const [deploymentId, setDeploymentId] = useState(null);
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showButton, setShowButton] = useState(true);
  const [logs, setLogs] = useState([]);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const { projectSubDomain } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { projectId } = location.state || {};

  useEffect(() => {
    const fetchProjectDetails = async () => {
      const res = await axios.get(
        config.BASE_PATH + `/deployment/${projectId}`
      );
      setIsLoading(false);
      setDeploymentId(res.data?.data?.id);
    };
    fetchProjectDetails();
  }, []);

  const handleProjectDeployment = async () => {
    setShowButton(false);
    await axios.post(config.BASE_PATH + '/deploy', {
      projectId: projectId,
    });
    alert(
      'Deployment Started, This page will be refreshed automatically. You can check logs!!!'
    );
    navigate(0);
  };

  const handleFetchProjectDetails = async () => {
    setIsLoading(true);
    const res = await axios.get(config.BASE_PATH + `/project/${projectId}`);
    setProject(res.data.data);
    setShowButton(false);
    setIsLoading(false);
  };

  const handleFetchLogs = async () => {
    setFetchingLogs(true);
    const res = await axios.get(config.BASE_PATH + `/logs/${deploymentId}`);

    setLogs(res.data?.logs);
    setFetchingLogs(false);
  };

  return (
    <div className="contianer">
      <h2>Project {projectSubDomain} Details :-</h2>
      <h2>
        {isLoading
          ? 'Loading...'
          : deploymentId
          ? 'Project already deployed at => ' +
            `http://${projectSubDomain}.${config.REVERSE_PROXY_HOST}`
          : 'Project not deployed yet'}
      </h2>
      {isLoading ? (
        ''
      ) : deploymentId ? (
        showButton ? (
          <div className="button" onClick={handleFetchProjectDetails}>
            Show Details
          </div>
        ) : (
          <>
            <span>Git URL : {project?.gitURL}</span>
            <span>
              {project?.environmentVariables.length} Environment Variables
              {project?.environmentVariables.length ? ':-' : ''}
            </span>
            {project?.environmentVariables.map((ev, idx) => {
              const ev_name = Object.keys(ev)[0];
              return (
                <span key={idx}>
                  {idx + 1}. {ev_name}
                </span>
              );
            })}
            {fetchingLogs ? (
              <span>Fetching Logs...</span>
            ) : (
              <div className="button" onClick={handleFetchLogs}>
                Fetch Latest Logs
              </div>
            )}
            <div className="scrollableRectangle">
              {logs.map((log, idx) => {
                return <div key={idx}>{log}</div>;
              })}
            </div>
          </>
        )
      ) : showButton ? (
        <div className="button" onClick={handleProjectDeployment}>
          Deploy Project
        </div>
      ) : (
        <span>Deploying...</span>
      )}
    </div>
  );
}
export default ProjectDetails;
