import React, { useContext, useState } from "react";
import axios from "axios";
import "./login.css"; // Import the CSS file
import { AuthContext } from "../../provider/authContext";
import { Navigate } from "react-router-dom";
import { Spin, message } from "antd";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { token, setToken } = useContext(AuthContext);
  const [messageApi, contextHolder] = message.useMessage();

  const error = () => {
    messageApi.open({
      type: 'error',
      content: 'Incorrect username or password',
      duration: 10,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await axios.post("https://my-node-app-ua0d.onrender.com/api/users/login", { username, password }).then((response) => {
      const { token, admin } = response.data;
      setToken(token, admin);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }).catch(() => {
      setLoading(false);
      error();
    });
  };

  return (
    <>
    {contextHolder}
    {
    token ? <Navigate to="/playoffPicksWebsite/pickSubmission" /> :
      (loading ? <Spin size="large" /> :
        <>
          <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="login-button">Login</button>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default Login;
