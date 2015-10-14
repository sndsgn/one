from flask import Flask, request
 
app = Flask(__name__, static_folder='../client')      
 
@app.route('/')
def home():
  return app.send_from_directory('../client')
 
if __name__ == '__main__':
  app.run(debug=True)
