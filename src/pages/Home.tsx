import React, { useEffect, useState } from "react"
import axios from "axios";
import { Table } from "antd";

const Home: React.FC = () => {

  const [scoreData, setScoreData] = useState([]);

  useEffect(() => {
  const dataRes = async () =>
    await axios
      .get("http://localhost:5000/api/users/getTotalUserScores")
      .then((res) => res.data)
      .then((data) => setScoreData(data.userScores))
      .catch((err) => console.log(err));
  dataRes();
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
        <h1>Playoff Picks</h1>
        <Table columns={columns} dataSource={scoreData}/>
    </div>
  )
}
//        
export default Home