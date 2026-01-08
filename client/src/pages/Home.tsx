import React, { useEffect, useState, useContext } from "react"
import axios from "axios";
import { Table, Spin, Select, Typography } from "antd";
import API_BASE_URL from "../config/api";
import { AuthContext } from "../provider/authContext";

const { Option } = Select;

const Home: React.FC = () => {

  const [scoreData, setScoreData] = useState([]);
  const [pickData, setPickData] = useState([]);
  const [fantasyData, setFantasyData] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState("leaderboard");
  const { setCurrent } = useContext(AuthContext);
  const { Title } = Typography;

  useEffect(() => {
    setCurrent('h');
    const abortController = new AbortController();
    
    const loadData = async () => {
      try {
        // Fetch all endpoints in parallel with abort signal
        const [scoresResponse, responsesResponse, fantasyResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/users/getTotalUserScores`, {
            signal: abortController.signal
          }),
          axios.get(`${API_BASE_URL}/api/information/getAllResponses`, {
            signal: abortController.signal
          }),
          axios.get(`${API_BASE_URL}/api/fantasy/leaderboard`, {
            signal: abortController.signal
          })
        ]);

        setScoreData(scoresResponse.data.userScores);
        setPickData(responsesResponse.data.responses);
        setQuestions(responsesResponse.data.questions);
        setFantasyData(fantasyResponse.data.leaderboard || []);
        setLoading(false);
      } catch (err) {
        if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
          // Request was cancelled, no need to handle
          return;
        }
        console.log(err);
        setLoading(false);
      }
    };
    
    loadData();
    
    // Cleanup function to abort requests if component unmounts
    return () => {
      abortController.abort();
    };
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
            <Table columns={fantasyColumns} dataSource={fantasyData} />
          </>
        )}
      </div>
  )
}

export default Home