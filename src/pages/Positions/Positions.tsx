import React from "react";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { message, Spin, Button, Card as AntCard, Input, Select, Typography, Divider, Space, Row, Col } from "antd";
import { AuthContext } from "../../provider/authContext";
import API_BASE_URL from "../../config/api";
import "./Positions.css";

const { Title, Text } = Typography;
const { Option } = Select;

type Player = {
    id: string;
    name: string;
};

const POSITIONS = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'TE', 'FLEX', 'K', 'DEF'];
const POSITION_TO_API_TYPE: { [key: string]: string } = {
    'QB': 'QB',
    'RB1': 'RB',
    'RB2': 'RB',
    'WR1': 'WR',
    'WR2': 'WR',
    'TE': 'TE',
    'FLEX': 'FLEX',
    'K': 'K',
    'DEF': 'DEF'
};

const Positions: React.FC = () => {
    const [lineup, setLineup] = useState<{ [key: string]: string }>({});
    const [availablePlayers, setAvailablePlayers] = useState<{ [key: string]: Player[] }>({});
    const [searchTerm, setSearchTerm] = useState<{ [key: string]: string }>({});
    const [fetchingPlayers, setFetchingPlayers] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentWeek, setCurrentWeek] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const [messageApi, contextHolder] = message.useMessage();

    const { setCurrent } = useContext(AuthContext);

    const success = (msg: string) => {
        messageApi.open({
            type: 'success',
            content: msg,
            duration: 10,
        });
    };

    const error = (msg: string) => {
        messageApi.open({
            type: 'error',
            content: msg,
            duration: 10,
        });
    };

    useEffect(() => {
        setCurrent('pos');
        
        // Fetch current week from server
        const fetchCurrentWeek = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/information/getInfo`);
                setCurrentWeek(response.data.information.currentWeek);
                setLoading(false);
            } catch {
                error('Failed to fetch current week');
                setLoading(false);
            }
        };
        
        fetchCurrentWeek();
    }, []);

    const fetchAvailablePlayers = async (position: string) => {
        setFetchingPlayers(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/fantasy/availablePlayers`, {
                params: {
                    Position: POSITION_TO_API_TYPE[position],
                    weekNumber: currentWeek
                }
            });
            setAvailablePlayers(prev => ({
                ...prev,
                [position]: response.data.players || []
            }));
        } catch {
            error(`Failed to fetch players for ${position}`);
        } finally {
            setFetchingPlayers(false);
        }
    };

    const handlePositionSelect = (position: string, playerId: string) => {
        setLineup(prev => ({
            ...prev,
            [position]: playerId
        }));
    };

    const handleSearchChange = (position: string, value: string) => {
        setSearchTerm(prev => ({
            ...prev,
            [position]: value
        }));
    };

    const getFilteredPlayers = (position: string): Player[] => {
        const players = availablePlayers[position] || [];
        const search = searchTerm[position] || '';
        if (!search) return players;
        return players.filter(player => 
            player.name.toLowerCase().includes(search.toLowerCase())
        );
    };

    const submitLineup = async () => {
        // Check if all positions are filled
        const missingPositions = POSITIONS.filter(pos => !lineup[pos]);
        if (missingPositions.length > 0) {
            error(`Please fill all positions. Missing: ${missingPositions.join(', ')}`);
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${API_BASE_URL}/api/fantasy/submitLineup`, {
                weekNumber: currentWeek,
                lineup: lineup
            });
            success('Lineup submitted successfully!');
        } catch {
            error('Failed to submit lineup. Please ensure you are logged in.');
        } finally {
            setSubmitting(false);
        }
    };

    return loading || fetchingPlayers ? (
        <div className="spin-container">
            <Spin size="large" />
        </div>
    ) : (
        <>
            {contextHolder}
            <div className="positions-container">
                <AntCard className="form-card" bordered={false}>
                    <Title level={2} className="form-title">
                        Fantasy Lineup - Week {currentWeek}
                    </Title>
                    <Divider />
                    <Space direction="vertical" size="large" style={{ width: "100%" }}>
                        {POSITIONS.map((position) => (
                            <div key={position} className="form-item">
                                <Text strong className="form-label">
                                    {position}
                                </Text>
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    <Input
                                        placeholder={`Search ${position} players...`}
                                        value={searchTerm[position] || ''}
                                        onChange={(e) => handleSearchChange(position, e.target.value)}
                                        onFocus={() => {
                                            if (!availablePlayers[position]) {
                                                fetchAvailablePlayers(position);
                                            }
                                        }}
                                    />
                                    <Select
                                        className="form-select"
                                        value={lineup[position]}
                                        onChange={(value) => handlePositionSelect(position, value)}
                                        placeholder={`Select ${position}`}
                                        onDropdownVisibleChange={(open) => {
                                            if (open && !availablePlayers[position]) {
                                                fetchAvailablePlayers(position);
                                            }
                                        }}
                                    >
                                        {getFilteredPlayers(position).map((player) => (
                                            <Option key={player.id} value={player.id}>
                                                {player.name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Space>
                            </div>
                        ))}
                    </Space>
                    <Divider />
                    <Row gutter={16} justify="end">
                        <Col>
                            <Button type="primary" onClick={submitLineup} loading={submitting}>
                                Submit Lineup
                            </Button>
                        </Col>
                    </Row>
                </AntCard>
            </div>
        </>
    );
};

export default Positions;
