import React, { useEffect, useState } from "react"
import axios from "axios";
import { Table } from "antd";

const Home: React.FC = () => {

  const [scoreData, setScoreData] = useState([]);
  const [pickData, setPickData] = useState([]);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
  const dataRes = async () =>
    await axios
      .get("http://localhost:5000/api/users/getTotalUserScores")
      .then((res) => res.data)
      .then((data) => setScoreData(data.userScores))
      .catch((err) => console.log(err));
  dataRes();
  const dataRes1 = async () =>
    await axios
      .get("http://localhost:5000/api/information/getAllResponses")
      .then((res) => res.data)
      .then((data) => {
        setPickData(data.responses);
        setQuestions(data.questions);
      })
      .catch((err) => console.log(err));
  dataRes1();
}, []);

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
    <div>
        <h1 style={{ textAlign: "center" }}>Playoff Picks</h1>
        <h2>Leaderboard</h2>
        <Table columns={columns} dataSource={scoreData}/>
        <h2>Picks</h2>
        <Table columns={questions} dataSource={pickData}/>
    </div>
  )
}
//        
export default Home