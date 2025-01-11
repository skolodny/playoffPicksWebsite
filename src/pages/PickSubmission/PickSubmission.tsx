import React from "react";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { message, Spin } from "antd";
import { AuthContext } from "../../provider/authContext";

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

    const [messageApi, contextHolder] = message.useMessage();

    const { setCurrent, setToken } = useContext(AuthContext);

    const success = () => {
        messageApi.open({
            type: 'success',
            content: 'Saved successfully',
            duration: 10,
        });
    };

    const error = () => {
        messageApi.open({
            type: 'error',
            content: 'Data failed to save. Ensure you are logged in',
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
                    setToken(null);
                });
        dataRes1();
        const dataRes = async () =>
            await axios
                .get("https://my-node-app-ua0d.onrender.com/api/information/getInfo")
                .then((res) => res.data)
                .then((data: { information: { options: Array<Pick> } }) => {
                    setPickArray(data.information.options)
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
            .then(success)
            .catch(error);
    }

    return (
        loading ? <Spin size="large"/> :
        <>
            {contextHolder}
            <div id="form">
                {pickArray.map((element: Pick, index: number) => {
                    if (element.type === "text" || element.type === "number") {
                        return (
                            <div key={index}>
                                <label>{element.question}</label>
                                <input value={currentChoices?.[index]} onChange={(e) => handleChange(index, e.target.value)} />
                            </div>
                        );
                    } else if (element.type === "radio") {
                        return (
                            <div key={index}>
                                <label>{element.question}</label>
                                <select value={currentChoices?.[index]} onChange={(e) => handleChange(index, e.target.value)}>
                                    {element.options.map((option: string) => {
                                        return (
                                            <option value={option}>{option}</option>
                                        );
                                    })}
                                </select>
                            </div>
                        );
                    }
                })}
                <button onClick={() => updateData()}>Save</button>
            </div>
        </>

    );
};

export default PickSubmission;