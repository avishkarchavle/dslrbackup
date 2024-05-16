import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

const SignLanguageRecognition = () => {
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [videoInput, setVideoInput] = useState(null);
    const [prediction, setPrediction] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const videoRef = useRef(null);
    const speechSynthesisRef = useRef(window.speechSynthesis);

    const handleVideoChange = (event) => {
        const file = event.target.files[0];
        setVideoInput(file);
        console.log("Video file selected: ", file);
    };

    const handleStopWebcam = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setMediaRecorder(null);
            setIsRecording(false);

            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
    };

    const handleDataAvailable = (event) => {
        if (event.data.size > 0) {
            const videoBlob = new Blob([event.data], { type: 'video/webm' });
            setVideoInput(videoBlob);
            console.log("Video blob created: ", videoBlob);
        }
    };

    const handlePredict = async () => {
        try {
            const formData = new FormData();
            if (videoInput instanceof Blob) {
                formData.append('video', videoInput, 'video.webm');
                console.log("Video blob appended to formData");
            } else {
                alert('Please provide a video input');
                return;
            }

            console.log("Sending request to backend...");
            const response = await axios.post('http://localhost:5001/predict', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log("Response received: ", response.data);
            setPrediction(response.data.prediction);
            speakText(response.data.prediction);
        } catch (error) {
            console.error('Error predicting:', error);
        }
    };

    const speakText = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesisRef.current.speak(utterance);
    };

    useEffect(() => {
        const synth = speechSynthesisRef.current;
        return () => {
            if (isSpeaking) {
                synth.cancel();
            }
        };
    }, [isSpeaking]);

    return (
        <div className="container mt-5">
            <h2 className="display-4 mb-4">Sign Language Recognition</h2>
            <div className="mb-3">
                <label>Upload Video:</label>
                <input type="file" accept="video/*" onChange={handleVideoChange} />
            </div>
            {isRecording && (
                <div className="mb-3">
                    <button className="btn btn-danger" onClick={handleStopWebcam}>
                        Stop Webcam
                    </button>
                </div>
            )}
            <div className="mb-3">
                <button className="btn btn-success" onClick={handlePredict}>
                    Predict
                </button>
            </div>
            {prediction && (
                <div className="mt-3">
                    <p>Prediction: {prediction}</p>
                    <button
                        className={`btn ${isSpeaking ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => setIsSpeaking(!isSpeaking)}
                    >
                        {isSpeaking ? 'Stop Speaking' : 'Speak'}
                    </button>
                </div>
            )}
            {isRecording && (
                <div className="mt-3">
                    <video
                        ref={videoRef}
                        width="640"
                        height="480"
                        autoPlay
                        playsInline
                        muted={true}
                    />
                </div>
            )}
        </div>
    );
};

export default SignLanguageRecognition;
