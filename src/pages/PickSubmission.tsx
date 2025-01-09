import React, { useContext } from "react";
import styles from './pickSubmission.module.css';
import axios from "axios";
import { useState, useEffect } from "react";
import { AuthContext } from "../provider/authContext";

type Pick = {
    question: string;
    type: string;
    options: Array<string>;
};

const PickSubmission: React.FC = () => {
    const [pickArray, setPickArray] = useState<Array<Pick>>([{ question: "Q1", type: "text", options: [] },
    { question: "Q2", type: "radio", options: ["Option 1", "Option 2"] },
    { question: "Q3", type: "number", options: [] }]);

    const { token } = useContext(AuthContext);

    useEffect(() => {
        const dataRes = async () =>
            await axios
                .post("http://localhost:5000/api/information/getInfo", { token: token })
                .then((res) => res.data)
                .then((data) => setPickArray(data.information.options))
                .catch((err) => console.log(err));
        dataRes();
    }, []);

    useEffect(() => {
        console.log(pickArray);
    }, [pickArray]);

    return (
        <div className={styles.container}>
            {pickArray.map((element: Pick, index: number) => {
                if (element.type === "text" || element.type === "number") {
                    return (
                        <div key={index} className={styles.inputGroup}>
                            <label className={styles.label}>{element.question}</label>
                            <input type={element.type} className={styles.input}></input>
                        </div>
                    );
                } else if (element.type === "radio") {
                    return (
                        <div key={index} className={styles.inputGroup}>
                            <label className={styles.label}>{element.question}</label>
                            <div>
                                {element.options.map((option: string, idx: number) => {
                                    return (
                                        <div key={idx} className={styles.radioGroup}>
                                            <input type="radio" value={option} name={element.question} className={styles.radio}></input>
                                            <label className={styles.radioLabel}>{option}</label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};

export default PickSubmission;