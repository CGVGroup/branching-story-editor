import os.path
import sys
import yaml
import json
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
logging.basicConfig(level=logging.DEBUG)

from langchain.chat_models import init_chat_model
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

app = Flask(__name__)
CORS(app)

CONFIG_PATH = "./configs"
PROMPT_PATH = "./prompts"
DEFAULT_CONFIG_NAME = "default"
DEFAULT_PROMPT_NAME = "default"
SCENE_ENUMS_PATH = "./enums.yaml"
TAXONOMIES_PATH = "./taxonomies.json"
DB_PATH = "./db.json"
DB = None

def initial_check() -> None:
    assert os.path.isdir(CONFIG_PATH), f"{CONFIG_PATH} is not a directory"
    assert os.path.isdir(PROMPT_PATH), f"{PROMPT_PATH} is not a directory"
    assert any(os.walk(CONFIG_PATH)), f"{CONFIG_PATH} contains no files"
    assert any(os.walk(PROMPT_PATH)), f"{PROMPT_PATH} contains no files"
    assert os.path.isfile(f"{CONFIG_PATH}/{DEFAULT_CONFIG_NAME}.yaml"), f"No file with name {DEFAULT_CONFIG_NAME}.yaml exist in config folder {CONFIG_PATH}"
    assert os.path.isfile(f"{PROMPT_PATH}/{DEFAULT_PROMPT_NAME}.yaml"), f"No file with name {DEFAULT_PROMPT_NAME}.yaml exist in prompt folder {PROMPT_PATH}"
    assert os.path.isfile(SCENE_ENUMS_PATH), f"{SCENE_ENUMS_PATH} is not a file"
    assert os.path.isfile(TAXONOMIES_PATH), f"{TAXONOMIES_PATH} is not a file"
    assert os.path.isfile(DB_PATH), f"{DB_PATH} is not a file"

def read_config(config_name: str) -> dict:
    """If it exists, loads the Model configuration file with the given name, else loads default."""
    if not os.path.exists(f"{CONFIG_PATH}/{config_name}.yaml"):
        print(f"Configuration file '{config_name}' was not found, defaulting to '{DEFAULT_CONFIG_NAME}'", file=sys.stderr)
        config_name = DEFAULT_CONFIG_NAME
    with open(f"{CONFIG_PATH}/{config_name}.yaml", "r") as fp:
        config = yaml.safe_load(fp)
    return config

def read_prompt(prompt_name: str) -> dict:
    """If it exists, loads the Prompt file with the given name, else loads default."""
    if not os.path.exists(f"{PROMPT_PATH}/{prompt_name}.yaml"):
        print(f"Prompt file '{prompt_name}' was not found, defaulting to '{DEFAULT_PROMPT_NAME}'", file=sys.stderr)
        prompt_name = DEFAULT_PROMPT_NAME
    with open(f"{PROMPT_PATH}/{prompt_name}.yaml", "r") as fp:
        prompt = yaml.safe_load(fp)
    return prompt

def read_secret(file_path: str) -> str:
    if os.path.exists(file_path):
        with open(file_path) as secret_fp:
            return secret_fp.readline().strip()
    else:
        raise FileNotFoundError("Secret file specified in config does not exist")
    
def get_from_folder(folder_path: str) -> list[str]:
    """Gets all yaml file from a certain folder and returns their stemmed names in a list."""
    folder = Path(folder_path)
    file_names = [file.stem for file in folder.iterdir() if file.is_file() and file.name.endswith(".yaml")]
    return file_names

def send_to_LLM(data_param: dict, config_name: str, prompt_name: str) -> str:
    """Reads config and prompt files, fills the `data` dictionary accordingly,
    initializes the chat model and invokes the LangChain `chain` with the data."""
    data = data_param
    config = read_config(config_name)

    if "api_key_file" in config:
        config["model_parameters"]["api_key"] = read_secret(config["api_key_file"])
    
    if prompt_name == "default" and "prompt_file" not in config:
        prompt_dict = read_prompt(DEFAULT_PROMPT_NAME)
    elif prompt_name == "default":
        prompt_dict = read_prompt(config["prompt_file"])
    else:
        prompt_dict = read_prompt(prompt_name)

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

# Flask Routes

@app.route('/generate/<config>/<prompt>', methods = ["POST"])
def send(config: str, prompt: str):
    try:
        response = send_to_LLM(request.get_json(), config, prompt)
        return jsonify(response)
    except Exception as err:
        return jsonify(str(err)), 500

@app.route('/generate', methods = ["POST"])
def send_default():
    return send(DEFAULT_CONFIG_NAME, DEFAULT_PROMPT_NAME)

@app.route('/models', methods = ['GET']) 
def get_models():
    return get_from_folder(CONFIG_PATH)

@app.route('/prompts', methods = ['GET']) 
def get_prompts():
    return get_from_folder(PROMPT_PATH)

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
def get_taxonomies():
    with (open(TAXONOMIES_PATH) as fp):
        taxonomies = json.load(fp)
    return taxonomies

if __name__ == '__main__':
    initial_check()
    app.run(host='0.0.0.0', port=5000, debug=True)