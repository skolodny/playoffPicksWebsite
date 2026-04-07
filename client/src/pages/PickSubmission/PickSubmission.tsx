import React from "react";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { message, Spin, Button, Card as AntCard, Input, Select, Typography, Divider, Space, Row, Col, Switch } from "antd";
import { AuthContext } from "../../provider/authContext";
import { GlobalContext } from "../../provider/globalContext";
import API_BASE_URL from "../../config/api";
import "./PickSubmission.css"

const{Title, Text} = Typography;
const{Option} = Select

export type Pick = {
    question: string;
    type: string;
    options: Array<string>;
};

const PickSubmission: React.FC = () => {
    const [loading, setLoading] = useState(true);

    const [messageApi, contextHolder] = message.useMessage();

    const { setCurrent, admin } = useContext(AuthContext);
    const { 
        pickQuestions, 
        questionEditsAllowed: globalQuestionEditsAllowed,
        userResponses: globalUserResponses,
        setUserResponses: setGlobalUserResponses,
        setQuestionEditsAllowed: setGlobalQuestionEditsAllowed,
        publicDataLoading,
        authDataLoading
    } = useContext(GlobalContext);

    const [currentChoices, setCurrentChoices] = useState<Array<string | number | Array<string | number>>>(authDataLoading ? [] : globalUserResponses);
    const [questionEditsAllowed, setQuestionEditsAllowed] = useState<Array<boolean>>(globalQuestionEditsAllowed);
    const [adminMode, setAdminMode] = useState<'personal' | 'correct-answers'>('personal'); // Admin mode toggle

    const success = (message: string) => {
        messageApi.open({
            type: 'success',
            content: message,
            duration: 10,
        });
    };

    const error = (message: string) => {
        messageApi.open({
            type: 'error',
            content: message,
            duration: 10,
        });
    };

    useEffect(() => {
        setCurrent('p');
        
        // Update local state when global state changes
        setCurrentChoices(globalUserResponses);
        setQuestionEditsAllowed(globalQuestionEditsAllowed);
        
        // Wait for public data to load, then mark as ready
        if (!publicDataLoading) {
            setLoading(false);
        }
    }, [setCurrent, globalUserResponses, globalQuestionEditsAllowed, publicDataLoading, authDataLoading]);
    
    const loadCorrectAnswers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/information/getInfo`);
            const information = response.data.information;
            if (information && information.correctAnswers) {
                setCurrentChoices(information.correctAnswers);
            }
        } catch {
            error('Failed to load correct answers');
        }
    };
    
    // Load correct answers when switching to correct-answers mode
    useEffect(() => {
        if (admin && adminMode === 'correct-answers') {
            loadCorrectAnswers();
        } else if (admin && adminMode === 'personal') {
            // Switch back to personal responses
            setCurrentChoices(globalUserResponses);
        }
        // We intentionally omit loadCorrectAnswers and error from dependencies
        // because they are stable functions that don't need to trigger re-runs.
        // Including them would cause unnecessary effect executions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminMode, admin, globalUserResponses]);
    
    const handleChange = (index: number, value: number | string | Array<string | number>) => {
        // Create a copy of the array to avoid mutating state directly
        const newArray = [...currentChoices];
        newArray[index] = value;
        setCurrentChoices(newArray);
    };
    
    // Helper function to get display value for text inputs
    const getDisplayValue = (choice: string | number | Array<string | number> | undefined): string => {
        if (Array.isArray(choice)) {
            return choice.join(', ');
        }
        return choice?.toString() || '';
    };

    const updateData = async () => {
        // Prevent saving multiple answers as personal picks
        if (adminMode === 'correct-answers') {
            error('You are in "Set Correct Answers" mode. Switch to "Personal Picks" mode to save your personal picks.');
            return;
        }
        
        // Runtime check to ensure no arrays in personal picks mode
        const hasArrayValues = currentChoices.some(choice => Array.isArray(choice));
        if (hasArrayValues) {
            error('Cannot submit multiple answers. Please select only one answer per question.');
            return;
        }
        
        await axios
            .post(`${API_BASE_URL}/api/information/submitResponse`, { choices: currentChoices })
            .then(() => {
                success('Saved successfully');
                // Safe to cast since we've verified no arrays above
                setGlobalUserResponses(currentChoices as Array<string | number>);
            })
            .catch((err) => {
                const errorMsg = err.response?.data?.message || 'Failed to save. Ensure you are logged in and that the editing period has not expired';
                error(errorMsg);
            });
    }

    const setCorrectAnswers = async () => {
        if (adminMode !== 'correct-answers') {
            error('Please switch to "Set Correct Answers" mode first.');
            return;
        }
        
        await axios
            .post(`${API_BASE_URL}/api/admin/setCorrectAnswers`, { correctAnswers: currentChoices })
            .then(() => success('Saved as correct answers'))
            .catch(() => error('Failed to save as correct answers. Ensure you are logged in and have proper permissions'));
    }

    const toggleQuestionEditStatus = async (questionIndex: number) => {
        // Guard against out-of-bounds access in case questionEditsAllowed is not yet fully initialized
        if (questionIndex < 0 || questionIndex >= questionEditsAllowed.length) {
            error('Invalid question index. Please refresh the page and try again.');
            return;
        }
        const newStatus = !questionEditsAllowed[questionIndex];
        await axios
            .post(`${API_BASE_URL}/api/admin/setQuestionEditStatus`, { 
                questionIndex, 
                editsAllowed: newStatus 
            })
            .then(() => {
                success(`Question ${questionIndex + 1} editing ${newStatus ? 'enabled' : 'disabled'}`);
                const updatedStatus = [...questionEditsAllowed];
                updatedStatus[questionIndex] = newStatus;
                setQuestionEditsAllowed(updatedStatus);
                setGlobalQuestionEditsAllowed(updatedStatus);
            })
            .catch(() => error('Failed to update question edit status. Ensure you are logged in and have proper permissions'));
    }

    const calculateScores = async () => {
        await axios
            .post(`${API_BASE_URL}/api/admin/calculateScores`)
            .then(() => 
                {
                    success('Scores calculated. Check the leaderboard to see the updated scores');
                })
            .catch(() => error('Failed to calculate scores. Ensure you are logged in and have proper permissions'));
    }

    return loading ? (
        <div className="spin-container">
            <Spin size="large" />
        </div>
    ) : (
        <>
            {contextHolder}
            <div className="pick-submission-container">
                <AntCard className="form-card" bordered={false}>
                    <Title level={2} className="form-title">
                        Pick Submission Form
                    </Title>
                    {admin && (
                        <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f2f5', borderRadius: '4px' }}>
                            <Text strong style={{ marginRight: '12px' }}>Admin Mode:</Text>
                            <Select
                                value={adminMode}
                                onChange={(value) => setAdminMode(value)}
                                style={{ width: '200px' }}
                            >
                                <Option value="personal">Personal Picks</Option>
                                <Option value="correct-answers">Set Correct Answers</Option>
                            </Select>
                            {adminMode === 'correct-answers' && (
                                <Text type="secondary" style={{ marginLeft: '12px', fontSize: '12px' }}>
                                    (Multi-select enabled for dropdowns)
                                </Text>
                            )}
                        </div>
                    )}
                    <Divider />
                    <Space direction="vertical" size="large" style={{ width: "100%" }}>
                        {pickQuestions.map((element: Pick, index: number) => (
                            <div key={index} className="form-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <Text strong className="form-label">
                                        {element.question}
                                    </Text>
                                    {admin && adminMode === 'personal' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {questionEditsAllowed[index] ? 'Edits Enabled' : 'Edits Disabled'}
                                            </Text>
                                            <Switch
                                                checked={questionEditsAllowed[index]}
                                                onChange={() => toggleQuestionEditStatus(index)}
                                                checkedChildren="ON"
                                                unCheckedChildren="OFF"
                                            />
                                        </div>
                                    )}
                                </div>
                                {element.type === "text" || element.type === "number" ? (
                                    <Input
                                        className="form-input"
                                        value={getDisplayValue(currentChoices[index])}
                                        onChange={(e: { target: { value: string | number; }; }) =>
                                            handleChange(index, e.target.value)
                                        }
                                        disabled={adminMode === 'personal' && !questionEditsAllowed[index] && !admin}
                                        type={element.type}
                                    />
                                ) : element.type === "dropdown" ? (
                                    <Select
                                        className="form-select"
                                        mode={admin && adminMode === 'correct-answers' ? 'multiple' : undefined}
                                        value={currentChoices[index]}
                                        onChange={(value: string | number | Array<string | number>) => handleChange(index, value)}
                                        disabled={adminMode === 'personal' && !questionEditsAllowed[index] && !admin}
                                    >
                                        {element?.options.map((option, optIndex) => (
                                            <Option key={`${index}-${optIndex}`} value={option}>
                                                {option}
                                            </Option>
                                        ))}
                                    </Select>
                                ) : null}
                            </div>
                        ))}
                    </Space>
                    <Divider />
                    <Row gutter={16} justify="end">
                        {adminMode === 'personal' && (questionEditsAllowed.some(allowed => allowed)) && (
                            <Col>
                                <Button type="primary" onClick={updateData}>
                                    Save Personal Picks
                                </Button>
                            </Col>
                        )}
                        {admin && adminMode === 'correct-answers' && (
                            <>
                                <Col>
                                    <Button type="primary" onClick={setCorrectAnswers}>
                                        Save as Correct Answers
                                    </Button>
                                </Col>
                                <Col>
                                    <Button type="dashed" onClick={calculateScores}>
                                        Calculate Scores
                                    </Button>
                                </Col>
                            </>
                        )}
                    </Row>
                </AntCard>
            </div>
        </>
    );
};
export default PickSubmission;