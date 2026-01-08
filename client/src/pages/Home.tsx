import React, { useEffect, useState, useContext } from "react"
import { Table, Spin, Select, Typography } from "antd";
import { AuthContext } from "../provider/authContext";
import { GlobalContext } from "../provider/globalContext";

const { Option } = Select;

const Home: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState("leaderboard");
  const { setCurrent } = useContext(AuthContext);
  const { 
    leaderboard, 
    allResponses, 
    questions, 
    fantasyLeaderboard, 
    publicDataLoading 
  } = useContext(GlobalContext);
  const { Title } = Typography;

  useEffect(() => {
    setCurrent('h');
  }, [setCurrent]);

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

  const fantasyColumns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Quarterback',
      dataIndex: 'QB',
      key: 'QB',
    },
    {
      title: 'Running Back 1',
      dataIndex: 'RB1',
      key: 'RB1',
    },
    {
      title: 'Running Back 2',
      dataIndex: 'RB2',
      key: 'RB2',
    },
    {
      title: 'Wide Receiver 1',
      dataIndex: 'WR1',
      key: 'WR1',
    },
    {
      title: 'Wide Receiver 2',
      dataIndex: 'WR2',
      key: 'WR2',
    },
    {
      title: 'Tight End',
      dataIndex: 'TE',
      key: 'TE',
    },
    {
      title: 'Flex',
      dataIndex: 'FLEX',
      key: 'FLEX',
    },
    {
      title: 'Kicker',
      dataIndex: 'PK',
      key: 'PK',
    },
    {
      title: 'Defense',
      dataIndex: 'DEF',
      key: 'DEF',
    }]

  return (
    publicDataLoading ? 
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
            <Table columns={columns} dataSource={leaderboard} />
          </>
        ) : selectedTable === "picks" ? (
          <>
            <Table columns={questions} dataSource={allResponses} />
          </>
        ) : (
          <>
            <Table columns={fantasyColumns} dataSource={fantasyLeaderboard} />
          </>
        )}
      </div>
  )
}

export default Home