import { Button, Input, Select, Typography, Col, Divider, Space, Card, Modal, message } from "antd";
import React, { useState } from "react";
import './CreateQuestions.css'
import axios from "axios";
import API_BASE_URL from "../../config/api";

const { Option } = Select
const { Title, Text } = Typography;


// Define the structure for a game
interface Game {
    id: string;
    homeTeam: {
        name: string;
    };
    awayTeam: {
        name: string;
    };
}

// Define the structure for a field
interface Field {
    question: string;
    type: string;
    options?: string[]; // For dropdown options
    typeInfo?: string; // For additional type information (e.g., gamePick, typeInfo specifics)
    gameId?: string; // For storing selected game ID
    overUnderValue?: number; // For storing over/under value if applicable
    statistic?: string; // For playerPick statistic
    apiConfig?: Object; // For playerPick API configuration
}

export const CreateQuestions: React.FC = () => {
    const [fields, setFields] = useState<Field[]>([]);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [messageApi, contextHolder] = message.useMessage();
    const [games, setGames] = useState<Game[]>([]);
    const [loadingGames, setLoadingGames] = useState(false);

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

    // Fetch games for gamePick type
    const fetchGames = async () => {
        setLoadingGames(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/nfl/games?week=1`);
            if (response.data && response.data.games) {
                setGames(response.data.games);
            }
        } catch {
            error('Failed to fetch games');
        } finally {
            setLoadingGames(false);
        }
    };

    // Add a new field
    const addField = () => {
        setFields([
            ...fields,
            { question: "", type: "text", options: [], typeInfo: "winner" },
        ]);
    };

    // Handle type change and fetch games if needed
    const handleTypeChange = (index: number, value: string) => {
        updateField(index, "type", value);
        if (value === "gamePick" && games.length === 0) {
            fetchGames();
        }
    };

    // Update a specific field
    const updateField = (
        index: number,
        key: keyof Field,
        value: string | boolean | string[] | number
    ) => {
        setFields(
            fields.map((field, idx) =>
                idx === index ? { ...field, typeInfo: (key === 'type' ? (value === 'playerPick' ? 'overUnder' : (value === 'gamePick' ? 'winner' : field.typeInfo)) : field.typeInfo), [key]: value } : field
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

    // Helper function to update question/options based on game and typeInfo
    const updateQuestionForGame = (
        typeInfo: string,
        selectedGame: Game,
        fieldExtras?: Partial<Field>
    ): Partial<Field> => {
        const updates: Partial<Field> = {};
        const away = selectedGame.awayTeam.name;
        const home = selectedGame.homeTeam.name;

        switch (typeInfo) {
            case 'winner':
                updates.question = `Who will win: ${away} or ${home}?`;
                updates.options = [away, home];
                break;
            case 'overUnder': {
                const stat = fieldExtras?.statistic ? ` ${fieldExtras.statistic}` : '';
                const value =
                    typeof fieldExtras?.overUnderValue === 'number' && !isNaN(fieldExtras.overUnderValue)
                        ? ` ${fieldExtras.overUnderValue}`
                        : '';
                updates.question = `Over/Under${value}${stat === ' score' ? ' Total Score' : stat} for ${away} @ ${home}?`;
                updates.options = ['Over', 'Under'];
                break;
            }
            case 'gameEvent':
                updates.question = `Game event for ${away} @ ${home}?`;
                updates.options = undefined;
                break;
            case 'playerComparison':
                updates.question = `Player comparison in ${away} @ ${home}`;
                updates.options = undefined;
                break;
            case 'teamComparison':
                updates.question = `Which team will have more in ${away} @ ${home}?`;
                updates.options = [away, home];
                break;
            default:
                break;
        }
        return updates;
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
                        {field.type === "dropdown" || field.type === "gamePick" ? (
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
                                {field.type !== 'gamePick' && field.type !== 'playerPick' && 
                                <Input
                                    type="text"
                                    placeholder="Field Question"
                                    value={field.question}
                                    onChange={(e) =>
                                        updateField(index, "question", e.target.value)
                                    }
                                />
                                }
                                <Select
                                    style={{ minWidth: "120px" }}
                                    value={field.type}
                                    onChange={(value) => handleTypeChange(index, value)}
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="dropdown">Dropdown</option>
                                    <option value="gamePick">Game Pick</option>
                                    <option value="playerPick">Player Pick</option>
                                </Select>

                                {/* Game Selection Dropdown */}
                                {field.type === "gamePick" && (
                                    <div style={{ marginTop: "10px" }}>
                                        <Text>Select Game:</Text>
                                        <Select
                                            style={{ width: "100%", marginTop: "5px" }}
                                            placeholder="Select a game"
                                            value={field.gameId}
                                            loading={loadingGames}
                                            onChange={(value) => {
                                                const selectedGame = games.find(g => g.id === value);
                                                if (selectedGame) {
                                                    setFields(fields.map((f, idx) => {
                                                        if (idx === index) {
                                                            return {
                                                                ...f,
                                                                gameId: value,
                                                                ...updateQuestionForGame(f.typeInfo || 'winner', selectedGame)
                                                            };
                                                        }
                                                        return f;
                                                    }));
                                                }
                                            }}
                                        >
                                            {games.map((game) => (
                                                <Option key={game.id} value={game.id}>
                                                    {game.awayTeam.name} @ {game.homeTeam.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </div>
                                )}
                             
                                {field.type === "gamePick" && (
                                <>
                                    <Select
                                        style={{ minWidth: "120px" }}
                                        value={field.typeInfo}
                                        onChange={(value) => {
                                            const selectedGame = games.find(g => g.id === field.gameId);
                                            setFields(fields.map((f, idx) => {
                                                if (idx === index) {
                                                    return {
                                                        ...f,
                                                        typeInfo: value,
                                                        ...(selectedGame ? updateQuestionForGame(value, selectedGame) : {})
                                                    };
                                                }
                                                return f;
                                            }));
                                        }}
                                    >
                                        <option value="winner">Winner</option>
                                        <option value="overUnder">Over/Under</option>
                                        <option value="gameEvent">Game Event</option>
                                        <option value="playerComparison">Player Comparison</option>
                                        <option value="teamComparison">Team Comparison</option>
                                    </Select>
                                </>
                                )}
                                {field.type === "playerPick" && (
                                <Select
                                    style={{ minWidth: "120px" }}
                                    value={field.typeInfo}
                                    onChange={(value) => updateField(index, "typeInfo", value)}
                                >
                                    <option value="overUnder">Over/Under</option>
                                    <option value="comparison">Compare Players</option>
                                </Select>
                                )}
                                {field.typeInfo === 'overUnder' && (
                                <>
                                    <Select
                                        value={field.statistic}
                                        onChange={(value) => {
                                            const selectedGame = games.find(g => g.id === field.gameId);
                                            setFields(fields.map((f, idx) => {
                                                if (idx === index) {
                                                    return {
                                                        ...f,
                                                        statistic: value,
                                                        ...(selectedGame
                                                            ? updateQuestionForGame(f.typeInfo || 'winner', selectedGame, {
                                                                  statistic: value,
                                                                  overUnderValue: f.overUnderValue
                                                              })
                                                            : {})
                                                    };
                                                }
                                                return f;
                                            }));
                                        }}
                                    >
                                        <option value="score">Total Score</option>
                                        {/* ...add more statistics as needed... */}
                                    </Select>
                                    <Input
                                        value={field.overUnderValue}
                                        type="number"
                                        className="form-input"
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            const selectedGame = games.find(g => g.id === field.gameId);
                                            setFields(fields.map((f, idx) => {
                                                if (idx === index) {
                                                    return {
                                                        ...f,
                                                        overUnderValue: val,
                                                        ...(selectedGame
                                                            ? updateQuestionForGame(f.typeInfo || 'winner', selectedGame, {
                                                                  statistic: f.statistic,
                                                                  overUnderValue: val
                                                              })
                                                            : {})
                                                    };
                                                }
                                                return f;
                                            }));
                                        }}
                                    />
                                </>
                                )}
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