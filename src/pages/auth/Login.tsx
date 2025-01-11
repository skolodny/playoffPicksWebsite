import React, { useContext, useState } from "react";
import axios from "axios";
import "./login.css"; // Import the CSS file
import { AuthContext } from "../../provider/authContext";
import { Navigate } from "react-router-dom";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { token, setToken } = useContext(AuthContext);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/api/users/login", { username, password }).then((response) => {
      const token: string = response.data.token;
      setToken(token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }).catch((error) => {
      console.error("Login failed:", error);
    });
  };

  return (
    token ? <Navigate to= "/playoffPicksWebsite/pickSubmission"/> :
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
  );
};

export default Login;
