import React, { useState } from "react";
import axios from "axios";
import "./login.css"; // Import the CSS file

const Registration: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/users/register", { username, password });
      console.log("Registration successful:", response.data);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="login-container">
      <h2>Registration</h2>
      <form onSubmit={handleRegistration}>
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
        <button type="submit" className="login-button">Register</button>
      </form>
    </div>
  );
};

export default Registration;