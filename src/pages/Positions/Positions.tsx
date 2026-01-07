import React from "react";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
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
    const [fetchingPlayers, setFetchingPlayers] = useState<{ [key: string]: boolean }>({});
    const [submitting, setSubmitting] = useState(false);

    const [messageApi, contextHolder] = message.useMessage();

    const { setCurrent, admin } = useContext(AuthContext);

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
    }, [setCurrent]);

    const fetchAvailablePlayers = async (position: string) => {
        const apiType = POSITION_TO_API_TYPE[position];
        
        // For FLEX, combine WR, RB, and TE players
        if (position === 'FLEX') {
            setFetchingPlayers(prev => ({ ...prev, [position]: true }));
            try {
                // Fetch WR, RB, and TE if not already fetched
                const fetchPromises = [];
                
                if (!availablePlayers['WR1'] && !availablePlayers['WR2']) {
                    fetchPromises.push(
                        axios.get(`${API_BASE_URL}/api/fantasy/availablePlayers`, {
                            params: { position: 'WR' }
                        }).then(res => ({ type: 'WR', players: res.data.availablePlayers || [] }))
                    );
                }
                
                if (!availablePlayers['RB1'] && !availablePlayers['RB2']) {
                    fetchPromises.push(
                        axios.get(`${API_BASE_URL}/api/fantasy/availablePlayers`, {
                            params: { position: 'RB' }
                        }).then(res => ({ type: 'RB', players: res.data.availablePlayers || [] }))
                    );
                }
                
                if (!availablePlayers['TE']) {
                    fetchPromises.push(
                        axios.get(`${API_BASE_URL}/api/fantasy/availablePlayers`, {
                            params: { position: 'TE' }
                        }).then(res => ({ type: 'TE', players: res.data.availablePlayers || [] }))
                    );
                }
                
                const results = await Promise.all(fetchPromises);
                
                // Update state with fetched data
                setAvailablePlayers(prev => {
                    const updated = { ...prev };
                    results.forEach(result => {
                        if (result.type === 'WR') {
                            updated['WR1'] = result.players;
                            updated['WR2'] = result.players;
                        } else if (result.type === 'RB') {
                            updated['RB1'] = result.players;
                            updated['RB2'] = result.players;
                        } else if (result.type === 'TE') {
                            updated['TE'] = result.players;
                        }
                    });
                    return updated;
                });
                
                // Combine all players for FLEX
                const wrPlayers = availablePlayers['WR1'] || availablePlayers['WR2'] || [];
                const rbPlayers = availablePlayers['RB1'] || availablePlayers['RB2'] || [];
                const tePlayers = availablePlayers['TE'] || [];
                
                const flexPlayers = [...wrPlayers, ...rbPlayers, ...tePlayers];
                
                setAvailablePlayers(prev => ({
                    ...prev,
                    ['FLEX']: flexPlayers
                }));
            } catch {
                error(`Failed to fetch players for ${position}`);
            } finally {
                setFetchingPlayers(prev => ({ ...prev, [position]: false }));
            }
            return;
        }
        
        // For RB1/RB2, check if we already have RB data
        if (position === 'RB1' || position === 'RB2') {
            const otherRBPosition = position === 'RB1' ? 'RB2' : 'RB1';
            if (availablePlayers[otherRBPosition]) {
                // Reuse data from the other RB position
                setAvailablePlayers(prev => ({
                    ...prev,
                    [position]: prev[otherRBPosition]
                }));
                return;
            }
        }
        
        // For WR1/WR2, check if we already have WR data
        if (position === 'WR1' || position === 'WR2') {
            const otherWRPosition = position === 'WR1' ? 'WR2' : 'WR1';
            if (availablePlayers[otherWRPosition]) {
                // Reuse data from the other WR position
                setAvailablePlayers(prev => ({
                    ...prev,
                    [position]: prev[otherWRPosition]
                }));
                return;
            }
        }
        
        // Standard fetch for other positions or first RB/WR fetch
        setFetchingPlayers(prev => ({ ...prev, [position]: true }));
        try {
            const response = await axios.get(`${API_BASE_URL}/api/fantasy/availablePlayers`, {
                params: {
                    position: apiType
                }
            });
            const players = response.data.availablePlayers || [];
            
            setAvailablePlayers(prev => {
                const updated = { ...prev, [position]: players };
                
                // If fetching RB, also set for the other RB position
                if (position === 'RB1') {
                    updated['RB2'] = players;
                } else if (position === 'RB2') {
                    updated['RB1'] = players;
                }
                
                // If fetching WR, also set for the other WR position
                if (position === 'WR1') {
                    updated['WR2'] = players;
                } else if (position === 'WR2') {
                    updated['WR1'] = players;
                }
                
                return updated;
            });
        } catch {
            error(`Failed to fetch players for ${position}`);
        } finally {
            setFetchingPlayers(prev => ({ ...prev, [position]: false }));
        }
    };

    const handlePositionSelect = (position: string, playerId: string) => {
        setLineup(prev => {
            // Prevent selecting the same player in multiple positions
            const isDuplicate = Object.entries(prev).some(
                ([pos, id]) => pos !== position && id === playerId
            );

            if (isDuplicate) {
                error("This player is already selected in another position.");
                return prev;
            }

            return {
                ...prev,
                [position]: playerId
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
        } catch {
            error('Failed to submit lineup. Please ensure you are logged in.');
        } finally {
            setSubmitting(false);
        }
    };

    const calculateFantasyScores = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/admin/fantasy/calculateScores`);
            success('Fantasy scores calculated successfully!');
        } catch {
            error('Failed to calculate fantasy scores. Ensure you are logged in and have proper permissions');
        }
    };

    const isAnyPositionLoading = Object.values(fetchingPlayers).some(loading => loading);

    return isAnyPositionLoading ? (
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
                                    optionFilterProp="children"
                                    filterOption={(input, option) => {
                                        const label = option?.label || option?.children;
                                        if (typeof label === 'string') {
                                            return label.toLowerCase().includes(input.toLowerCase());
                                        }
                                        return false;
                                    }}
                                    onDropdownVisibleChange={(open) => {
                                        if (open && !availablePlayers[position]) {
                                            fetchAvailablePlayers(position);
                                        }
                                    }}
                                    loading={fetchingPlayers[position]}
                                >
                                    {(availablePlayers[position] || []).map((player) => (
                                        <Option key={player.id} value={player.id}>
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
                            <Button type="primary" onClick={submitLineup} loading={submitting}>
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
