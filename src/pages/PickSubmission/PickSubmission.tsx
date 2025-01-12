import React from "react";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { message, Spin, Button, Card as AntCard, Input, Select, Typography, Divider, Space, Row, Col } from "antd";
import { AuthContext } from "../../provider/authContext";
import "./PickSubmission.css"

const{Title, Text} = Typography;
const{Option} = Select

export type Pick = {
    question: string;
    type: string;
    options: Array<string>;
};

const PickSubmission: React.FC = () => {
    const [pickArray, setPickArray] = useState<Array<Pick>>([{ question: "Q1", type: "text", options: [] },
    { question: "Q2", type: "radio", options: ["Option 1", "Option 2"] },
    { question: "Q3", type: "number", options: [] }]);

    const [currentChoices, setCurrentChoices] = useState<Array<string | number>>([]);
    const [loading, setLoading] = useState(true);
    const [editsAllowed, setEditsAllowed] = useState(false);

    const [messageApi, contextHolder] = message.useMessage();

    const { setCurrent, setToken, admin } = useContext(AuthContext);

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
        const dataRes1 = async () =>
            await axios
                .post("https://my-node-app-ua0d.onrender.com/api/information/findResponse")
                .then((res) => res.data)
                .then((data) => {
                    setCurrentChoices(data.response);
                    setLoading(false);
                })
                .catch(() => {
                    setCurrent('l');
                    setToken(null, false);
                });
        dataRes1();
        const dataRes = async () =>
            await axios
                .get("https://my-node-app-ua0d.onrender.com/api/information/getInfo")
                .then((res) => res.data)
                .then((data: { information: { options: Array<Pick>, editsAllowed: boolean } }) => {
                    setPickArray(data.information.options);
                    setEditsAllowed(data.information.editsAllowed);
                    setLoading(false);
                })
                .catch((err) => console.log(err));
        dataRes();
    }, []);

    useEffect(() => {
        setCurrent('p');
    }, []);

    const handleChange = (index: number, value: number | string) => {
        // Create a copy of the array to avoid mutating state directly
        const newArray = [...currentChoices];
        newArray[index] = value;
        setCurrentChoices(newArray);
    };

    const updateData = async () => {
        await axios
            .post("https://my-node-app-ua0d.onrender.com/api/information/submitResponse", { choices: currentChoices })
            .then(() => success('Saved successfully'))
            .catch(() => error('Failed to save. Ensure you are logged in and that the editing period has not expired'));
    }

    const setCorrectAnswers = async () => {
        await axios
            .post("https://my-node-app-ua0d.onrender.com/api/admin/setCorrectAnswers", { correctAnswers: currentChoices })
            .then(() => success('Saved as correct answers'))
            .catch(() => error('Failed to save as correct answers. Ensure you are logged in and have proper permissions'));
    }

    const setEditStatus = async () => {
        await axios
            .post("https://my-node-app-ua0d.onrender.com/api/admin/setEditStatus", { editsAllowed: !editsAllowed })
            .then(() => 
                {
                    success(editsAllowed ? 'Editing disabled' : 'Editing enabled');
                    setEditsAllowed(!editsAllowed);
                })
            .catch(() => error(editsAllowed ? 'Failed to disable editing' : 'Failed to enable editing. Ensure you are logged in and have proper permissions'));
    }

    const calculateScores = async () => {
        await axios
            .post("https://my-node-app-ua0d.onrender.com/api/admin/calculateScores")
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
                        {pickArray.map((element: Pick, index: number) => (
                            <div key={index} className="form-item">
                                <Text strong className="form-label">
                                    {element.question}
                                </Text>
                                {element.type === "text" || element.type === "number" ? (
                                    <Input
                                        className="form-input"
                                        value={currentChoices[index] || ""}
                                        onChange={(e: { target: { value: string | number; }; }) =>
                                            handleChange(index, e.target.value)
                                        }
                                        disabled={!editsAllowed && !admin}
                                        type={element.type}
                                    />
                                ) : element.type === "dropdown" ? (
                                    <Select
                                        className="form-select"
                                        value={currentChoices[index]}
                                        onChange={(value: string | number) => handleChange(index, value)}
                                        disabled={!editsAllowed && !admin}
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
                        {editsAllowed && (
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
                                    <Button type="dashed" onClick={setEditStatus}>
                                        {editsAllowed ? "Disable Editing" : "Enable Editing"}
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