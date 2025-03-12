import time
import random
from flask import Flask,make_response

app = Flask(__name__)

#@app.route('/', methods = ['POST'])
#def expand():
#    return jsonify({"message": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In consequat, est non hendrerit consequat, ex eros tincidunt ipsum, sed tristique diam libero eu massa. Nullam aliquam magna sed nisi egestas imperdiet. Maecenas eget congue metus. Phasellus rutrum libero non ex tristique malesuada. Sed at dui sit amet mi venenatis tempus vitae id libero. Sed sit amet leo in diam bibendum efficitur. Praesent tincidunt velit a suscipit eleifend. Curabitur dapibus ac nulla non posuere. Duis eu quam at mauris sagittis aliquam. Cras turpis mauris, feugiat vitae ante sit amet, lacinia porttitor lorem. Duis sodales, magna id mollis viverra, nulla dolor ultricies orci, non ullamcorper velit enim sed dolor. In a diam arcu. Phasellus non diam scelerisque, congue nunc eu, porta eros. Cras tempus porttitor dui, eu semper justo dignissim a. Nulla eu pretium urna, quis hendrerit ligula."}), 200

@app.route('/')
def expand():
    time.sleep(random.randint(2, 5))
    response = make_response('Lorem ipsum dolor sit amet, consectetur adipiscing elit. In consequat, est non hendrerit consequat, ex eros tincidunt ipsum, sed tristique diam libero eu massa. Nullam aliquam magna sed nisi egestas imperdiet. Maecenas eget congue metus. Phasellus rutrum libero non ex tristique malesuada. Sed at dui sit amet mi venenatis tempus vitae id libero. Sed sit amet leo in diam bibendum efficitur. Praesent tincidunt velit a suscipit eleifend. Curabitur dapibus ac nulla non posuere. Duis eu quam at mauris sagittis aliquam. Cras turpis mauris, feugiat vitae ante sit amet, lacinia porttitor lorem. Duis sodales, magna id mollis viverra, nulla dolor ultricies orci, non ullamcorper velit enim sed dolor. In a diam arcu. Phasellus non diam scelerisque, congue nunc eu, porta eros. Cras tempus porttitor dui, eu semper justo dignissim a. Nulla eu pretium urna, quis hendrerit ligula.', 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response