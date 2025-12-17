import { Button, Input, Select, Typography, Col, Divider, Space, Card, Modal, message } from "antd";
import React, { useState } from "react";
import './CreateQuestions.css'
import axios from "axios";
import API_BASE_URL from "../../config/api";

const { Option } = Select
const { Title, Text } = Typography;


// Define the structure for a field
interface Field {
    question: string;
    type: string;
    options?: string[]; // For dropdown options
}

export const CreateQuestions: React.FC = () => {
    const [fields, setFields] = useState<Field[]>([]);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [messageApi, contextHolder] = message.useMessage();

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

    const submitNewQuestions = async () => {
        await axios
            .post(`${API_BASE_URL}/api/admin/createNewWeek`, { options: fields })
            .then(() => success('Questions saved successfully and new week started'))
            .catch(() => error('Failed to save. Ensure you are logged in and have proper permissions'));
    }

    // Add a new field
    const addField = () => {
        setFields([
            ...fields,
            { question: "", type: "text", options: [] },
        ]);
    };

    // Update a specific field
    const updateField = (
        index: number,
        key: keyof Field,
        value: string | boolean | string[]
    ) => {
        setFields(
            fields.map((field, idx) =>
                idx === index ? { ...field, [key]: value } : field
            )
        );
    };

    // Add an option to a dropdown field
    const addOption = (index: number) => {
        setFields(
            fields.map((field, idx) =>
                idx === index && field.type === "dropdown"
                    ? {
                        ...field,
                        options: [...(field.options || []), ""],
                    }
                    : field
            )
        );
    };

    // Update an individual dropdown option
    const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
        setFields(
            fields.map((field, idx) =>
                idx === fieldIndex && field.type === "dropdown"
                    ? {
                        ...field,
                        options: field.options?.map((option, optIdx) =>
                            optIdx === optionIndex ? value : option
                        ),
                    }
                    : field
            )
        );
    };

    // Remove a dropdown option
    const removeOption = (fieldIndex: number, optionIndex: number) => {
        setFields(
            fields.map((field, idx) =>
                idx === fieldIndex && field.type === "dropdown"
                    ? {
                        ...field,
                        options: field.options?.filter((_, optIdx) => optIdx !== optionIndex),
                    }
                    : field
            )
        );
    };

    // Remove a field
    const removeField = (index: number) => {
        setFields(fields.filter((_, idx) => idx !== index));
    };

    // Render form preview
    const renderFormPreview = () => (
        <div className="pick-submission-container">
            <Card className="form-card" bordered={false}>
                <Title level={2} className="form-title">Questions Preview</Title>
                {fields.map((field, index) => (
                    <div key={index} style={{ marginBottom: "10px" }}>
                        <Text strong className="form-label">
                            {field.question || "Field"}{" "}
                        </Text>
                        {field.type === "dropdown" ? (
                            <Select
                                onChange={(e) =>
                                    setFormData({ ...formData, [field.question]: e.target.value })
                                }
                                className="form-select"
                            >
                                {field.options?.map((option, idx) => (
                                    <Option key={idx} value={option}>
                                        {option}
                                    </Option>
                                ))}
                            </Select>
                        ) : (
                            <Input
                                type={field.type}
                                onChange={(e) =>
                                    setFormData({ ...formData, [field.question]: e.target.value })
                                }
                            />
                        )}
                    </div>
                ))}
                <Divider />
                <Button type="primary">Save</Button>
            </Card>
        </div>
    );

    return (
        <div>
            {contextHolder}
            <Title level={1} className="form-title">Create Questions</Title>
            <div className="pick-submission-container">
                <Card className="form-card" bordered={false}>
                    <Title level={2} className="form-title">Question Fields</Title>
                    <Divider />
                    <Space direction="vertical" size="large" style={{ width: "100%" }}>
                        {fields.map((field, index) => (
                            <div key={index} style={{ marginBottom: "10px" }}>
                                <Input
                                    type="text"
                                    placeholder="Field Question"
                                    value={field.question}
                                    onChange={(e) =>
                                        updateField(index, "question", e.target.value)
                                    }
                                />
                                <Select
                                    style={{ minWidth: "120px" }}
                                    value={field.type}
                                    onChange={(value) => updateField(index, "type", value)}
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="dropdown">Dropdown</option>
                                </Select>
                                <Button onClick={() => removeField(index)}>Remove</Button>

                                {/* Dropdown options editor */}
                                {field.type === "dropdown" && (
                                    <div style={{ marginTop: "10px", paddingLeft: "20px" }}>
                                        <Title level={5}>Dropdown Options</Title>
                                        {field.options?.map((option, optIdx) => (
                                            <div key={optIdx} style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                                                <Input
                                                    type="text"
                                                    placeholder={`Option ${optIdx + 1}`}
                                                    className="form-input"
                                                    value={option}
                                                    onChange={(e) =>
                                                        updateOption(index, optIdx, e.target.value)
                                                    }
                                                />
                                                <Button
                                                    onClick={() => removeOption(index, optIdx)}
                                                    style={{ marginLeft: "5px" }}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                        <Button onClick={() => addOption(index)}>Add Option</Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </Space>
                    <Divider />
                    <Col>
                        <Button onClick={addField} type="default">Add Question</Button>
                    </Col>
                    <Divider />
                    <Col>
                        <Button 
                            type="primary" 
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Are you sure?',
                                    content: 'Do you really want to submit these questions as the new questions for the week?',
                                    onOk() {
                                        submitNewQuestions();
                                    },
                                    onCancel() {
                                        error('Submission cancelled');
                                    },
                                });
                            }}
                        >
                            Start a new week and submit these questions as the new questions
                        </Button>
                    </Col>
                </Card>
            </div>
            <hr />
            <div>
                {renderFormPreview()}
            </div>
        </div>
    );
};