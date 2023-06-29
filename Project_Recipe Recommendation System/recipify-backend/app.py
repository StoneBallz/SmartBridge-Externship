from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import cv2
import numpy as np
from PIL import Image
import torch
from tensorflow import keras
import re
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import pandas as pd
  
# creating a Flask app
app = Flask(__name__)
cors = CORS(app)

# Home Route
@app.route('/', methods = ['GET'])
@cross_origin()
def home():  
    return jsonify({'data': "hello world"})

# Image Classification Route
# Load ML Models
meat_model = keras.models.load_model("beefy-mobilenetv2.h5")
fruit_veg_model = keras.models.load_model("FV.h5")
product_model = keras.models.load_model("product_category_model_mobilenet.h5")
yolo_model = torch.hub.load('ultralytics/yolov5', 'yolov5s')

crop_size = 224

# Classes
fruits_veg_classes = {
    0: 'apple',
    1: 'banana',
    2: 'beetroot',
    3: 'bell pepper',
    4: 'cabbage',
    5: 'capsicum',
    6: 'carrot',
    7: 'cauliflower',
    8: 'chilli pepper',
    9: 'corn',
    10: 'cucumber',
    11: 'eggplant',
    12: 'garlic',
    13: 'ginger',
    14: 'grapes',
    15: 'jalepeno',
    16: 'kiwi',
    17: 'lemon',
    18: 'lettuce',
    19: 'mango',
    20: 'onion',
    21: 'orange',
    22: 'paprika',
    23: 'pear',
    24: 'peas',
    25: 'pineapple',
    26: 'potato',
    27: 'pomegranate',
    28: 'raddish',
    29: 'soy beans',
    30: 'spinach',
    31: 'sweetcorn',
    32: 'sweetpotato',
    33: 'tomato',
    34: 'turnip',
    35: 'watermelon'
}

meat_class  = ['others','beef', 'pork']

product_class = {
    0: 'BEANS',
    1: 'CAKE',
    2: 'CANDY',
    3: 'CEREAL',
    4: 'CHIPS',
    5: 'CHOCOLATE',
    6: 'COFFEE',
    7: 'CORN',
    8: 'FISH',
    9: 'FLOUR',
    10: 'HONEY',
    11: 'JAM',
    12: 'JUICE',
    13: 'MILK',
    14: 'NUTS',
    15: 'OIL',
    16: 'PASTA',
    17: 'RICE',
    18: 'SODA',
    19: 'SPICES',
    20: 'SUGAR',
    21: 'TEA',
    22: 'TOMATO_SAUCE',
    23: 'VINEGAR',
    24: 'WATER'
}

# Image processing function
def process_image(image):
    # Convert the BGR image to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Convert the RGB image to PIL Image
    image_pil = Image.fromarray(image_rgb)

    # Perform object detection
    yolo_results = yolo_model(image_pil)

    # Get the detected objects' bounding boxes
    boxes = yolo_results.xyxy[0].numpy()[:, :4]
    confidences = yolo_results.xyxy[0].numpy()[:, 4]
    class_ids = yolo_results.xyxy[0].numpy()[:, 5]

    # Initialize tags list
    tags = []

    # Draw bounding boxes and send cropped images to ML models
    for box, confidence, class_id in zip(boxes, confidences, class_ids):
        preds = []

        # Extract box coordinates
        xmin, ymin, xmax, ymax = box.astype(int)

        # Crop the object region using NumPy array indexing
        cropped_image = image_rgb[ymin:ymax, xmin:xmax]

        # Resizing the cropped part
        resized_image = cv2.resize(cropped_image, (224, 224))
        resized_image = resized_image.reshape(1, 224, 224, 3)

        # Fruit and veggie segment
        outputs = fruit_veg_model.predict(resized_image)
        predicted_idx = np.argmax(outputs)
        predicted_label = fruits_veg_classes[predicted_idx]
        confidence = outputs[0][predicted_idx]
        preds.append([predicted_label, confidence])

        # Meat Segment
        outputs = meat_model.predict(resized_image)
        predicted_idx = np.argmax(outputs)
        predicted_label = meat_class[predicted_idx]
        confidence = outputs[0][predicted_idx]
        preds.append([predicted_label, confidence])

        # Product Segment
        outputs = product_model.predict(resized_image)
        predicted_idx = np.argmax(outputs)
        predicted_label = product_class[predicted_idx]
        confidence = outputs[0][predicted_idx]
        preds.append([predicted_label, confidence])

        max_confidence_idx = np.argmax([confidence[1] for confidence in preds])
        predicted_label, max_confidence = preds[max_confidence_idx]

        tags.append(predicted_label.lower())

    return list(set(tags))

@app.route('/upload', methods=['POST'])
@cross_origin()
def uploader():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})

    file = request.files['file']

    # Check if the file is empty
    if file.filename == '':
        return jsonify({'error': 'Empty file uploaded'})

    # Read the image file
    image_data = file.read()

    # Convert the image data to a numpy array
    nparr = np.frombuffer(image_data, np.uint8)

    # Decode the numpy array to an image
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Process the image
    tags = process_image(image)

    return jsonify({'tags': tags})

# Recipe Generation Route
secondary="healthy,seasonal,north-american,very-low-carbs,european,italian,vegetarian,asian,indian,english,portugeuse,mexican,japanese,korean"
time="1-day-or-more,60-minutes-or-less,4-hours-or-less,30-minutes-or-less,15-minutes-or-less"
difficulty="easy,for-1-or-2,3-steps-or-less,brown-bag,finger-food,toddler-friendly,one-dish-meal"
cooking_style="barbecue,slow-cooker,tex-mex,refrigerator,flat-shapes,pizza,comfort-food"
course_type="frozen-dessrts,beverages,dinner-party,meat,breakfast,brown-bag,holiday-event,soups,shake"

model_folder_path="checkpoint-9000"

all_ingredients=pd.read_csv("ingredients.csv")

def load_models(path):
  model = AutoModelForSeq2SeqLM.from_pretrained(path)
  tokenizer = AutoTokenizer.from_pretrained(path)
  return model, tokenizer

def checkIngredients(input_list, all_ingredients):
  ingredients=[]
  for ing in input_list:
    result = all_ingredients[all_ingredients['name'] == ing]
    if not result.empty:
        ingredients.append(ing)
  return ingredients

def string_builder(ings, sec, time, dif, cook, cour):
  ing_str="[SEP]".join(ings)
  out="[START]"+ing_str+"[SEP]"+time+"[SEP]"+dif+"[SEP]"+cook+"[SEP]"+cour+"[EOS]"
  return out

def get_recipe(model, tokenizer, tags):
  inputs = tokenizer.encode(tags, max_length=750, truncation=True)
  outputs = model.generate(torch.tensor(inputs).view(1,-1), max_length=750)
  prediction_scores = outputs[0]
  out = tokenizer.decode(prediction_scores)
  return out

def outputStringOptimizer(string):
   cleaned_text = re.sub(r'<[^>]+>', ' ', string)
   cleaned_text = re.sub(r'\[[^\]]+\]', ' ', cleaned_text)
   cleaned_text = re.sub(r'\[START\]|\[SEP\]|\[EOS\]', '.', cleaned_text)
   cleaned_text = cleaned_text.strip()
   return cleaned_text

def main(data):
    # Load models
    model, tokenizer = load_models(model_folder_path)

    # Filter ingredients based on availability in ing_list
    available_ingredients = checkIngredients(data['tags'], all_ingredients)

    if len(available_ingredients) == 0:
        return "No matching ingredients found."

    # Enter user input for tags
    secondary_input = data['secondary']
    time_input = data['time']
    difficulty_input = data['difficulty']
    cooking_style_input = data['style']
    course_type_input = data['type']

    # Build tags string
    tags_string = string_builder(
        available_ingredients, secondary_input, time_input, difficulty_input, cooking_style_input, course_type_input
    )

    # Get recipe
    recipe = get_recipe(model, tokenizer, tags_string)
    return outputStringOptimizer(recipe)

@app.route('/generate', methods=['POST'])
@cross_origin()
def generator():
    data = request.get_json()
    return jsonify({"output": main(data)})

# Run server
if __name__ == "__main__":
    app.run()