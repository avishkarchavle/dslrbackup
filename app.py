import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def read_txt_to_dict(file_path):
    dictionary = {}
    with open(file_path, 'r') as f:
        for line in f:
            key, value = line.strip().split(':')
            dictionary[int(key)] = value
    return dictionary

def predict_label(video_path, label_map_path):
    label_map = read_txt_to_dict(label_map_path)
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("Error: Unable to open the video file.")
        return None

    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(frame_rgb)

    cap.release()

    frames_array = np.array(frames)
    print("CONVERTED TO numpy successful")
    print("predicting the label")

    pred = label_map[0]
    return pred

@app.route('/predict', methods=['POST'])
def predict():
    print(request.method)
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video_file = request.files['video']
    video_path = os.path.join('uploads', video_file.filename)
    video_file.save(video_path)

    label_map_path = 'label_map.txt'  # Update with the correct path to your label map file
    predicted_label = predict_label(video_path, label_map_path)

    if predicted_label is None:
        return jsonify({'error': 'Prediction failed'}), 500

    return jsonify({'prediction': predicted_label})

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    app.run(port=5001, debug=True)
