import React, { useState } from 'react';
import axios from 'axios';
import { CloudArrowUpIcon } from "@heroicons/react/24/solid"; // Cloud upload icon
import './ResumeValidator.css';
import { Toaster, toast } from 'react-hot-toast';


function ResumeValidator() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedJob, setSelectedJob] = useState('');
    const [validationResult, setValidationResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const jobDescriptions: Record<string, { responsibilities: string; requirements: string }> = {
        'Software Engineer (Entry Level)': {
            responsibilities: `Develop and maintain web applications.\n Design and implement databases.\n Participate in code reviews.`,
            requirements: `Bachelor's degree in Computer Science or related field.\n 3+ years of experience in software development.\n Proficient in Python and Django.\n Experience with database design.`,
        },
        'Data Scientist (Mid Level)': {
            responsibilities: `Analyze data using statistical techniques.\n Build machine learning models.\n Present findings to stakeholders.`,
            requirements: `Master's degree in Data Science or related field.\n 5+ years of experience in data analysis.\n Proficiency in Python and R.`,
        },
        'Project Manager (Senior)': {
            responsibilities: `Plan and execute projects.\n Manage project budgets and timelines.\n Communicate with stakeholders.`,
            requirements: `Bachelor's degree in Business Administration or related field.\n 10+ years of project management experience.\n PMP certification.`,
        },
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.size <= 10 * 1024 * 1024) {
            setSelectedFile(file);
            setError(null);
        } else {
            setSelectedFile(null);
            setError('File size must be 10MB or less.');
        }
    };

    const handleJobChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedJob(event.target.value);
    };

    const showToast = (type: "success" | "error", message: string) => {
        toast[type](message, {
            style: {
                background: type === "success" ? "#4CAF50" : "#FF4C4C",
                color: "#fff",
                fontWeight: "bold",
                padding: "12px",
                borderRadius: "8px",
                fontFamily: "inherit",
                fontSize: "12px"
            },
            iconTheme: {
                primary: "#fff",
                secondary: type === "success" ? "#4CAF50" : "#FF4C4C",
            },
        });
    };

    const handleSubmit = async () => {
        if (!selectedFile || !selectedJob) {
            showToast("error", 'Please select a job and upload a resume to proceed.');
            return;
        }
        setLoading(true);

        const formData = new FormData();
        formData.append('pdf_path', selectedFile);
        formData.append('job_description', `${jobDescriptions[selectedJob].responsibilities}\n${jobDescriptions[selectedJob].requirements}`);

        try {
            const response = await axios.post('http://127.0.0.1:5000/validate_resume', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setValidationResult(response.data);
            setError(null);
            showToast("success", 'Resume successfully validated! Review the feedback to enhance your application.');
        } catch (err: any) {
            showToast("error", 'Failed to validate resume at this moment. Try again after sometime.');
            setValidationResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <Toaster position="top-right" />
            <div className="resume-box">
                <span className="title">Resume Validator</span>

                <div className="input-group">
                    <label htmlFor="jobSelect">Select Job</label>
                    <select id="jobSelect" value={selectedJob} onChange={handleJobChange} className="custom-select">
                        <option value="">Select Job</option>
                        {Object.keys(jobDescriptions).map((job) => (
                            <option key={job} value={job}>{job}</option>
                        ))}
                    </select>
                </div>

                {selectedJob && (
                    <div className="job-description">
                        <div className="bold-text">Responsibilities:</div>
                        <ul>
                            {jobDescriptions[selectedJob].responsibilities.split('\n').map((line, index) => (
                                <li key={index}>{line}</li>
                            ))}
                        </ul>

                        <div className="bold-text">Requirements:</div>
                        <ul>
                            {jobDescriptions[selectedJob].requirements.split('\n').map((line, index) => (
                                <li key={index}>{line}</li>
                            ))}
                        </ul>
                    </div>

                )}

                {/* File Upload Section */}
                <div className="file-upload-container" onClick={() => document.getElementById("fileInput")?.click()}>
                    <CloudArrowUpIcon className="upload-icon" />
                    <span>Drag and drop file or upload your resume</span>
                    <input id="fileInput" type="file" accept=".pdf" onChange={handleFileChange} hidden />
                    <button className="upload-btn">Upload PDF</button>
                    {selectedFile && <span className="file-name"> {selectedFile.name}</span>}
                    <span className="support-text">Supported formats: PDF</span>
                </div>

                <div className="button-container">
                    <button onClick={handleSubmit} className="custom-button" disabled={loading}>
                        {loading ? 'Loading, please wait...' : 'Validate Resume'}
                    </button>

                </div>

                {error && <p className="error-message">{error}</p>}

                {validationResult && (
                    <div className="result-box">
                        <h3>Validation Result</h3>
                        <p><strong>Rating:</strong> {validationResult.rating}</p>
                        {/* <p><strong>Missing Skills:</strong> {validationResult.missing_skills}</p> */}
                        <div>
                        <p><strong>Explanation:</strong></p>
                            <ul>
                                {validationResult.explanation.split("\n").map((point: string, index: number) => {
                                    const cleanPoint = point.replace(/^- /, "").trim();
                                    return cleanPoint ? <li key={index}>{cleanPoint}</li> : null;
                                })}
                            </ul>
                        </div>

                        {validationResult?.suggestions && validationResult.suggestions.length > 0 && (
                            <div>
                                <h4>Suggestions:</h4>
                                <ul>
                                    {validationResult.suggestions.map((suggestion: string, index: number) => (
                                        <li key={index}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>

    );
}

export default ResumeValidator;
