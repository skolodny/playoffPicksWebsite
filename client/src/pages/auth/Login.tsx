import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../../provider/authContext";
import { GlobalContext } from "../../provider/globalContext";
import { Navigate } from "react-router-dom";
import { Input, Spin, message, Typography, Card } from "antd";
import API_BASE_URL from "../../config/api";
import "./login.css"; // Import the CSS file

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { token, setToken, setCurrent } = useContext(AuthContext);
  const { fetchAuthData } = useContext(GlobalContext);
  const [messageApi, contextHolder] = message.useMessage();
  const{Title, Text} = Typography;

  useEffect(() => {
    setCurrent('l');
  }, [setCurrent]);

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
    await axios.post(`${API_BASE_URL}/api/users/login`, { username, password }).then((response) => {
      const { token, admin } = response.data;
      setToken(token, admin);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Fetch authenticated data once user logs in
      fetchAuthData();
    }).catch(() => {
      setLoading(false);
      error();
    });
  };

  return (
    <>
      {contextHolder}
      {
        token ? <Navigate to="/pickSubmission" /> :
          (loading ?
            <div className="spin-container">
              <Spin size="large" />
            </div> :
            <>
            <div className="pick-submission-container">
            <Card className="form-card" bordered={false}>
                <Title style={{ textAlign: 'center'}} level={2}>Login</Title>
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <Text>Username:</Text>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <Text>Password:</Text>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Input type="submit" className="login-button" value="Submit" />
                </form>
                </Card>
              </div>
            </>
          )}
    </>
  );
};

export default Login;
