import os.path
import yaml
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
logging.basicConfig(level=logging.DEBUG)

from langchain.chat_models import init_chat_model
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

app = Flask(__name__)
CORS(app)

CONFIG_PATH = "./configs"
DEFAULT_CONFIG_NAME = "default"
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
        data["api_key"] = read_secret(config["api_key_file"])
    
    if "prompt_file" not in config:
        raise FileNotFoundError("No prompt file was specified")
    
    prompt = read_prompt(config["prompt_file"])

    if (data["previous_scene"] != "" and "there_is_a_previous_scene_prompt" in prompt):
        data["previous_scene_prompt"] = prompt["there_is_a_previous_scene_prompt"]
    else:
        data["previous_scene_prompt"] = ""
        data["previous_scene"] = ""
    
    model = init_chat_model(config["model_name"], model_provider=config["provider"])
    model.invoke(**config["model_config"])

    #prompt_template = PromptTemplate(template=config["prompt"])
    #chain = LLMChain(llm=model, prompt=prompt_template)

@app.route('/db', methods = ['GET']) 
def get_db():
    global DB
    if DB == None:
        with open(DB_PATH) as db_fp:
            DB = json.load(db_fp)
    return jsonify(DB)

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)