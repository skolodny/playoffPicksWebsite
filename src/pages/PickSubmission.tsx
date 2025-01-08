import React from "react";

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
        <div>
            {pickArray.map((element: Pick, index: number) => {
                if (element.type === "text" || element.type === "number") {
                    return (
                        <div key={index}>
                            <label>{element.question}</label>
                            <input type={element.type}></input>
                        </div>
                    );
                } else if (element.type === "radio") {
                    return (
                        <div key={index}>
                            <label>{element.question}</label>
                            <div>
                                {element.options.map((option: string, idx: number) => {
                                    return (
                                        <div key={idx}>
                                            <input type="radio" value={option} name={element.question}></input>
                                            <label>{option}</label>
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