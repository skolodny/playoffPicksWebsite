import React, { useCallback, useState, useEffect, useContext } from "react";
import axios from "axios";
import { message, Spin, Button, Card as AntCard, Select, Typography, Divider, Space, Row, Col } from "antd";
import { AuthContext } from "../../provider/authContext";
import API_BASE_URL from "../../config/api";
import "./Positions.css";

const { Title, Text } = Typography;
const { Option } = Select;

type Player = {
    id: string;
    name: string;
};

const POSITIONS = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'TE', 'FLEX', 'PK', 'DEF'];

const Positions: React.FC = () => {
    const [lineup, setLineup] = useState<{ [key: string]: string }>({});
    const [availablePlayers, setAvailablePlayers] = useState<{ [key: string]: Player[] }>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editsAllowed, setEditsAllowed] = useState(false);

    const [messageApi, contextHolder] = message.useMessage();

    const { setCurrent, admin } = useContext(AuthContext);

    const success = (msg: string) => {
        messageApi.open({
            type: 'success',
            content: msg,
            duration: 10,
        });
    };

    const error = useCallback((msg: string) => {
        messageApi.open({
            type: 'error',
            content: msg,
            duration: 10,
        });
    }, [messageApi]);

    useEffect(() => {
        setCurrent('pos');
        const loadData = async () => {
            try {
                // Fetch all available players at once
                const playersResponse = await axios.get(`${API_BASE_URL}/api/fantasy/availablePlayers`, {
                    params: { position: 'ALL' }
                });
                
                const allPlayers = playersResponse.data.availablePlayers;
                
                // Set available players for each position
                const players: { [key: string]: Player[] } = {};
                
                // Individual positions
                players['QB'] = allPlayers.QB || [];
                players['RB1'] = allPlayers.RB || [];
                players['RB2'] = allPlayers.RB || [];
                players['WR1'] = allPlayers.WR || [];
                players['WR2'] = allPlayers.WR || [];
                players['TE'] = allPlayers.TE || [];
                players['FLEX'] = allPlayers.FLEX || [];
                players['PK'] = allPlayers.PK || [];
                players['DEF'] = allPlayers.DEF || [];
                
                setAvailablePlayers(players);
                
                // Try to fetch existing lineup
                try {
                    const lineupResponse = await axios.get(`${API_BASE_URL}/api/fantasy/lineup`);
                    if (lineupResponse.data && lineupResponse.data.lineup?.lineup) {
                        setLineup(lineupResponse.data.lineup.lineup);
                    }
                } catch (err: unknown) {
                    // 404 means user hasn't submitted a lineup yet, which is fine
                    if (axios.isAxiosError(err) && err.response?.status !== 404) {
                        console.error('Error fetching lineup:', err);
                    }
                }
            } catch (err) {
                error('Failed to load player data');
                console.error('Error loading data:', err);
            }
        };

        const fetchEditsAllowed = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/information/getInfo`);
                setEditsAllowed(res.data.information.editsAllowed);
            } catch (err) {
                console.error('Error fetching edits allowed:', err);
            }
        };

        const initializeData = async () => {
            setLoading(true);
            try {
                await Promise.all([loadData(), fetchEditsAllowed()]);
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, [setCurrent, error]);


    const handlePositionSelect = (position: string, playerValue: string) => {
        // playerValue is now the player name
        setLineup(prev => {
            // Prevent selecting the same player in multiple positions
            const isDuplicate = Object.entries(prev).some(
                ([pos, name]) => pos !== position && name === playerValue
            );

            if (isDuplicate) {
                error("This player is already selected in another position.");
                return prev;
            }

            return {
                ...prev,
                [position]: playerValue
            };
        });
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
            lineup: lineup
            });
            success('Lineup submitted successfully!');
        } catch (err) {
            const errorMessage = axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : 'Failed to submit lineup. Please ensure you are logged in.';
            error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const calculateFantasyScores = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/admin/fantasy/calculateScores`);
            success('Fantasy scores calculated successfully!');
        } catch (err) {
            console.error('Error calculating fantasy scores:', err);
            const errorMessage = axios.isAxiosError(err) && err.response?.data?.message
                ? err.response.data.message
                : 'Failed to calculate fantasy scores. Ensure you are logged in and have proper permissions';
            error(errorMessage);
        }
    };

    return loading ? (
        <div className="spin-container">
            <Spin size="large" />
        </div>
    ) : (
        <>
            {contextHolder}
            <div className="positions-container">
                <AntCard className="form-card" bordered={false}>
                    <Title level={2} className="form-title">
                        Fantasy Lineup
                    </Title>
                    <Divider />
                    <Space direction="vertical" size="large" style={{ width: "100%" }}>
                        {POSITIONS.map((position) => (
                            <div key={position} className="form-item">
                                <Text strong className="form-label">
                                    {position}
                                </Text>
                                <Select
                                    className="form-select"
                                    value={lineup[position]}
                                    onChange={(value) => handlePositionSelect(position, value)}
                                    placeholder={`Search and select ${position}`}
                                    showSearch
                                    disabled={!editsAllowed}
                                    optionFilterProp="children"
                                    filterOption={(input, option) => {
                                        const label = option?.label || option?.children;
                                        if (typeof label === 'string') {
                                            return label.toLowerCase().includes(input.toLowerCase());
                                        }
                                        return false;
                                    }}
                                >
                                    {(availablePlayers[position] || []).map((player) => (
                                        <Option key={player.id} value={player.name}>
                                            {player.name}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                        ))}
                    </Space>
                    <Divider />
                    <Row gutter={16} justify="end">
                        <Col>
                            <Button type="primary" onClick={submitLineup} loading={submitting} disabled={!editsAllowed}>
                                Submit Lineup
                            </Button>
                        </Col>
                        {admin && (
                            <Col>
                                <Button type="dashed" onClick={calculateFantasyScores}>
                                    Calculate Fantasy Scores
                                </Button>
                            </Col>
                        )}
                    </Row>
                </AntCard>
            </div>
        </>
    );
};

export default Positions;
