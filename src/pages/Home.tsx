import React, { useEffect, useState } from "react"
import axios from "axios";
import { Table, Spin, Select, Typography } from "antd";

const { Option } = Select;

const Home: React.FC = () => {

  const [scoreData, setScoreData] = useState([]);
  const [pickData, setPickData] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState("leaderboard");
  const { Title } = Typography;

  useEffect(() => {
    const dataRes = async () =>
      await axios
        .get("https://my-node-app-ua0d.onrender.com/api/users/getTotalUserScores")
        .then((res) => res.data)
        .then((data) => {
          setScoreData(data.userScores)
          setLoading(false);
        })
        .catch((err) => console.log(err));
    dataRes();
    const dataRes1 = async () =>
      await axios
        .get("https://my-node-app-ua0d.onrender.com/api/information/getAllResponses")
        .then((res) => res.data)
        .then((data) => {
          setPickData(data.responses);
          setQuestions(data.questions);
          setLoading(false);
        })
        .catch((err) => console.log(err));
    dataRes1();
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
        </Select>
        {selectedTable === "leaderboard" ? (
          <>
            <Table columns={columns} dataSource={scoreData} />
          </>
        ) : (
          <>
            <Table columns={questions} dataSource={pickData} />
          </>
        )}
      </div>
  )
}

export default Home