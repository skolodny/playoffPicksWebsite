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

    const [currentChoices, setCurrentChoices] = useState<Array<string | number>>(authDataLoading ? [] : globalUserResponses);
    const [questionEditsAllowed, setQuestionEditsAllowed] = useState<Array<boolean>>(globalQuestionEditsAllowed);

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

    const handleChange = (index: number, value: number | string) => {
        // Create a copy of the array to avoid mutating state directly
        const newArray = [...currentChoices];
        newArray[index] = value;
        setCurrentChoices(newArray);
    };

    const updateData = async () => {
        await axios
            .post(`${API_BASE_URL}/api/information/submitResponse`, { choices: currentChoices })
            .then(() => {
                success('Saved successfully');
                setGlobalUserResponses(currentChoices);
            })
            .catch(() => error('Failed to save. Ensure you are logged in and that the editing period has not expired'));
    }

    const setCorrectAnswers = async () => {
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
                    <Divider />
                    <Space direction="vertical" size="large" style={{ width: "100%" }}>
                        {pickQuestions.map((element: Pick, index: number) => (
                            <div key={index} className="form-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <Text strong className="form-label">
                                        {element.question}
                                    </Text>
                                    {admin && (
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
                                        value={currentChoices[index] || ""}
                                        onChange={(e: { target: { value: string | number; }; }) =>
                                            handleChange(index, e.target.value)
                                        }
                                        disabled={!questionEditsAllowed[index]}
                                        type={element.type}
                                    />
                                ) : element.type === "dropdown" ? (
                                    <Select
                                        className="form-select"
                                        value={currentChoices[index]}
                                        onChange={(value: string | number) => handleChange(index, value)}
                                        disabled={!questionEditsAllowed[index]}
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
                        {(questionEditsAllowed.some(allowed => allowed)) && (
                            <Col>
                                <Button type="primary" onClick={updateData}>
                                    Save
                                </Button>
                            </Col>
                        )}
                        {admin && (
                            <>
                                <Col>
                                    <Button type="dashed" onClick={setCorrectAnswers}>
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