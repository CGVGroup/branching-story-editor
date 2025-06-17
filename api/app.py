import os.path
import yaml
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
logging.basicConfig(level=logging.DEBUG)

from langchain.chat_models import init_chat_model
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

app = Flask(__name__)
CORS(app)

CONFIG_PATH = "./configs"
DEFAULT_CONFIG_NAME = "default"
MODEL_LIST_PATH = "./models.yaml"
SCENE_ENUMS_PATH = "./enums.yaml"
TAXONOMIES_PATH = "./taxonomies.json"
DB_PATH = "./db.json"
DB = None

def read_config(config_name: str) -> dict:
    if not os.path.exists(f"{CONFIG_PATH}/{config_name}.yaml"):
        print(f"Configuration file '{config_name}' was not found, defaulting to '{DEFAULT_CONFIG_NAME}'")
        config_name = DEFAULT_CONFIG_NAME
    with open(f"{CONFIG_PATH}/{config_name}.yaml", "r") as fp:
        config = yaml.safe_load(fp)
    return config

def read_prompt(file_path: str) -> dict:
    if os.path.exists(file_path):
        with open(file_path) as prompt_fp:
            return yaml.safe_load(prompt_fp)
    else:
        raise FileNotFoundError("Prompt file specified in config does not exist")

def read_secret(file_path: str) -> str:
    if os.path.exists(file_path):
        with open(file_path) as secret_fp:
            return secret_fp.readline().strip()
    else:
        raise FileNotFoundError("Secret file specified in config does not exist")

def send_to_LLM(data_param: dict, config_name: str) -> str:
    data = data_param
    config = read_config(config_name)

    if "api_key_file" in config:
        config["model_parameters"]["api_key"] = read_secret(config["api_key_file"])
    
    if "prompt_file" not in config:
        raise FileNotFoundError("No prompt file was specified")
    
    prompt_dict = read_prompt(config["prompt_file"])

    if (data["previous_scene"] != "" and "there_is_a_previous_scene_prompt" in prompt_dict):
        data["previous_scene_prompt"] = prompt_dict["there_is_a_previous_scene_prompt"]
    else:
        data["previous_scene_prompt"] = ""
        data["previous_scene"] = ""

    model = init_chat_model(config["model_name"], model_provider=config["provider"], **config["model_parameters"])

    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(prompt_dict["system"]),
        HumanMessagePromptTemplate.from_template(prompt_dict["user"])
    ])
    chain = prompt | model
    response = chain.invoke(data)
    
    return response.content

@app.route('/generate/<config>', methods = ["POST"])
def send(config):
    try:
        response = send_to_LLM(request.get_json(), config)
        return jsonify(response)
    except Exception as err:
        return jsonify(str(err)), 500

@app.route('/generate', methods = ["POST"])
def send_default():
    return send(DEFAULT_CONFIG_NAME)

@app.route('/models', methods = ['GET']) 
def get_models():
    with open(MODEL_LIST_PATH) as fp:
        models = yaml.safe_load(fp)
    return models

@app.route('/db', methods = ['GET']) 
def get_db():
    global DB
    if DB == None:
        with open(DB_PATH, encoding='utf-8') as db_fp:
            DB = json.load(db_fp)
    return jsonify(DB)

@app.route('/enums', methods = ['GET'])
def get_scene_enums():
    with open(SCENE_ENUMS_PATH) as fp:
        enums = yaml.safe_load(fp)
    return enums

@app.route('/taxonomies', methods = ['GET'])
def get_db_taxonomies():
    with (open(TAXONOMIES_PATH) as fp):
        taxonomies = json.load(fp)
    return taxonomies

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)