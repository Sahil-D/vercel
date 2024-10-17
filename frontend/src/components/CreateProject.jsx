import './CreateProject.css';
import { useState } from 'react';
import axios from 'axios';
import config from '../config';
import { useNavigate } from 'react-router-dom';

export function CreateProject() {
  const [projectName, setProjectName] = useState('');
  const [projectGitUrl, setProjectGitUrl] = useState('');
  const [environmentVariables, setEnvironmentVariables] = useState([]);
  const navigate = useNavigate();

  const addEnvironmentVariable = () => {
    setEnvironmentVariables([...environmentVariables, { key: '', value: '' }]);
  };

  const handleEnvironmentVariableChange = (index, event) => {
    const { name, value } = event.target;
    const newKeyValuePairs = [...environmentVariables];
    newKeyValuePairs[index][name] = value; // Update the key or value based on the input name
    setEnvironmentVariables(newKeyValuePairs); // Update the state with the new key-value pairs
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Project Name:', projectName);
    console.log('Project Git URL:', projectGitUrl);

    const formattedEnvironmentVariables = environmentVariables.map((pair) => {
      return { [pair.key]: pair.value };
    });

    try {
      const res = await axios.post(config.BASE_PATH + '/project', {
        name: projectName,
        gitURL: projectGitUrl,
        environmentVariables: formattedEnvironmentVariables,
      });
      console.log(res);
      alert(
        'Project created with name : ' + res.data?.data?.project?.subDomain
      );
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form">
        <label>
          Project name:
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
          />
        </label>
        <label>
          Project Git URL:
          <input
            type="text"
            value={projectGitUrl}
            onChange={(e) => setProjectGitUrl(e.target.value)}
            placeholder="Project git url"
          />
        </label>

        <label>Environment Variables:-</label>
        {environmentVariables.map((pair, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              marginBottom: '10px',
              justifyContent: 'center',
            }}
          >
            <input
              type="text"
              name="key"
              value={pair.key}
              onChange={(event) =>
                handleEnvironmentVariableChange(index, event)
              }
              placeholder="Key"
              style={{ marginRight: '10px' }}
            />
            <input
              type="text"
              name="value"
              value={pair.value}
              onChange={(event) =>
                handleEnvironmentVariableChange(index, event)
              }
              placeholder="Value"
            />
          </div>
        ))}
        <button type="button" onClick={addEnvironmentVariable}>
          + Add Environment Variable
        </button>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
}
export default CreateProject;
