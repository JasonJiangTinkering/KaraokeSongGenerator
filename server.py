#!/usr/bin/env python
# -*- coding: utf-8 -*-


import os
from flask import Flask, request, render_template, jsonify

# Support for gomix's 'front-end' and 'back-end' UI.
app = Flask(__name__, static_folder='public', template_folder='views')

# Set the app secret key from the secret environment variables.
app.secret = os.environ.get('SECRET')

# Dream database. Store dreams in memory for now. 
DREAMS = []
@app.after_request
def apply_kr_hello(response):
    """Adds some headers to all responses."""
  
    # Made by Kenneth Reitz. 
    if 'MADE_BY' in os.environ:
        response.headers["X-Was-Here"] = os.environ.get('MADE_BY')
    
    # Powered by Flask. 
    response.headers["X-Powered-By"] = os.environ.get('POWERED_BY')
    return response


@app.route('/')
def homepage():
    """Displays the homepage."""
    return render_template('index.html')
    
@app.route('/dream', methods=['GET', 'POST'])
def dream():
    """Simple API endpoint for dream. 
    In memory, ephemeral, like real dream.
    """
  
    if request.method == "POST":
      if "name" in request.form and "dream" in request.form:
        print()
    
    # Return the list of remembered dream. 
    return jsonify(DREAM)

if __name__ == '__main__':
    app.run()