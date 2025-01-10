import React from "react";
import styles from './pickSubmission.module.css';
import axios from "axios";
import { useState, useEffect } from "react";
import { message } from "antd";

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

    const [messageApi, contextHolder] = message.useMessage();

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
                .post("http://localhost:5000/api/information/findResponse")
                .then((res) => res.data)
                .then((data) => setCurrentChoices(data.response))
                .catch((err) => console.log(err));
        dataRes1();
        const dataRes = async () =>
            await axios
                .get("http://localhost:5000/api/information/getInfo")
                .then((res) => res.data)
                .then((data: { information: { options: Array<Pick> } }) => setPickArray(data.information.options))
                .catch((err) => console.log(err));
        dataRes();
    }, []);

    const handleChange = (index: number, value: number | string) => {
        // Create a copy of the array to avoid mutating state directly
        const newArray = [...currentChoices];
        newArray[index] = value;
        setCurrentChoices(newArray);
    };

    const updateData = async () => {
        await axios
            .get("http://localhost:5000/api/information/getInfo")
            .then(success)
            .catch(error);
    }

    return (
        <>
            {contextHolder}
            <div className={styles.container}>
                {pickArray.map((element: Pick, index: number) => {
                    if (element.type === "text" || element.type === "number") {
                        return (
                            <div key={index} className={styles.inputGroup}>
                                <label className={styles.label}>{element.question}</label>
                                <input value={currentChoices?.[index]} className={styles.input} onChange={(e) => handleChange(index, e.target.value)} />
                            </div>
                        );
                    } else if (element.type === "radio") {
                        return (
                            <div key={index} className={styles.inputGroup}>
                                <label className={styles.label}>{element.question}</label>
                                <select value={currentChoices?.[index]} className={styles.radioGroup} onChange={(e) => handleChange(index, e.target.value)}>
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