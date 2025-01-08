import React from "react";
import styles from './pickSubmission.module.css';

const pickArray = [
    { question: "Q1", type: "text", options: [] },
    { question: "Q2", type: "radio", options: ["Option 1", "Option 2"] },
    { question: "Q3", type: "number", options: [] }
];

type Pick = {
    question: string;
    type: string;
    options: Array<string>;
};

const PickSubmission: React.FC = () => {
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