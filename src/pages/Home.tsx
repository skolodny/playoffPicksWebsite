import React, { useEffect, useState } from "react"
import axios from "axios";
import { Table, Spin, Select, Typography } from "antd";
import API_BASE_URL from "../config/api";

const { Option } = Select;

const Home: React.FC = () => {

  const [scoreData, setScoreData] = useState([]);
  const [pickData, setPickData] = useState([]);
  const [fantasyData, setFantasyData] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState("leaderboard");
  const { Title } = Typography;

  useEffect(() => {
    const dataRes = async () =>
      await axios
        .get(`${API_BASE_URL}/api/users/getTotalUserScores`)
        .then((res) => res.data)
        .then((data) => {
          setScoreData(data.userScores)
          setLoading(false);
        })
        .catch((err) => console.log(err));
    dataRes();
    const dataRes1 = async () =>
      await axios
        .get(`${API_BASE_URL}/api/information/getAllResponses`)
        .then((res) => res.data)
        .then((data) => {
          setPickData(data.responses);
          setQuestions(data.questions);
          setLoading(false);
        })
        .catch((err) => console.log(err));
    dataRes1();
    const dataRes2 = async () =>
      await axios
        .get(`${API_BASE_URL}/fantasy/leaderboard`)
        .then((res) => res.data)
        .then((data) => {
          setFantasyData(data.lineup || []);
          setLoading(false);
        })
        .catch((err) => console.log(err));
    dataRes2();
  }, []);

  const handleChange = (value: string) => {
    setSelectedTable(value);
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
    }
  ]

  return (
    loading ? 
    <div className="spin-container">
      <Spin size="large" />
    </div> :
      <div>
        <Title style={{ textAlign: "center" }} level={1}>Playoff Picks</Title>
        <Select defaultValue="leaderboard" style={{ width: 200 }} onChange={handleChange}>
          <Option value="leaderboard">Leaderboard</Option>
          <Option value="picks">Picks</Option>
          <Option value="fantasy">Fantasy</Option>
        </Select>
        {selectedTable === "leaderboard" ? (
          <>
            <Table columns={columns} dataSource={scoreData} />
          </>
        ) : selectedTable === "picks" ? (
          <>
            <Table columns={questions} dataSource={pickData} />
          </>
        ) : (
          <>
            <Table dataSource={fantasyData} scroll={{ x: true }} />
          </>
        )}
      </div>
  )
}

export default Home