#!/usr/bin/env python
# -*- coding: utf-8 -*-


import os
from flask import Flask, request, render_template, jsonify

# Support for gomix's 'front-end' and 'back-end' UI.
app = Flask(__name__, static_folder='public', template_folder='views')

# Set the app secret key from the secret environment variables.
app.secret = os.environ.get('SECRET')

# Dream database. Store dreams in memory for now. 
from google.cloud import datastore
datastore_client = datastore.Client()

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
        print("got name + " + request.form["name"] + " + dream " + request.form["dream"])
        name = request.form["name"]
        dream = request.form["dream"]
        task_key = datastore_client.key("Dream", name)
        task = datastore.Entity(key=task_key)
        task["content"] = dream
        datastore_client.put(task)
        return("Saved " + task.key.name + ":" + task['content'])
       # Return the list of remembered dream. 
      return "BAD"
    query = datastore_client.query(kind='Dream').fetch()
    returnstring =""
    for i in query:
      returnstring = returnstring + i["content"]
    
    return returnstring
   

if __name__ == '__main__':
    app.run()