import React, { useCallback, useState, useEffect, useContext } from "react";
import axios from "axios";
import { message, Spin, Button, Card as AntCard, Select, Typography, Divider, Space, Row, Col } from "antd";
import { AuthContext } from "../../provider/authContext";
import { GlobalContext } from "../../provider/globalContext";
import API_BASE_URL from "../../config/api";
import "./Positions.css";

const { Title, Text } = Typography;
const { Option } = Select;

const POSITIONS = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'TE', 'FLEX', 'PK', 'DEF'];

const Positions: React.FC = () => {
    const [submitting, setSubmitting] = useState(false);

    const [messageApi, contextHolder] = message.useMessage();

    const { setCurrent, admin } = useContext(AuthContext);
    const { 
        availablePlayers: globalAvailablePlayers, 
        userLineup: globalUserLineup,
        editsAllowed: globalEditsAllowed,
        setUserLineup: setGlobalUserLineup,
        publicDataLoading
    } = useContext(GlobalContext);

    const [lineup, setLineup] = useState<{ [key: string]: string }>(publicDataLoading ? {} : globalUserLineup);
    const [editsAllowed, setEditsAllowed] = useState(globalEditsAllowed);
    const [loading, setLoading] = useState(true);

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
        
        // Update local state when global state changes
        setLineup(globalUserLineup);
        setEditsAllowed(globalEditsAllowed);
        
        // Mark as loaded if public data is available
        if (!publicDataLoading) {
            setLoading(false);
        }
    }, [setCurrent, globalUserLineup, globalEditsAllowed, publicDataLoading]);


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
            setGlobalUserLineup(lineup);
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
                                    {(globalAvailablePlayers[position] || []).map((player) => (
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
                        {editsAllowed && (
                            <Col>
                                <Button type="primary" onClick={submitLineup} loading={submitting}>
                                    Submit Lineup
                                </Button>
                            </Col>
                        )}
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
