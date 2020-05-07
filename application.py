import os
from flask import Flask, render_template, jsonify, url_for, session, redirect
from flask_socketio import SocketIO, emit, send
from collections import defaultdict

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels_dict = {}
users = []
messages = defaultdict(list)
private_msgs = {}
detail = {}

@socketio.on("register user")
def user(data):
	if(data["username"] in users):
		msg = "user already exists"
		emit('user exists', msg)
	else:
		msg = "new user"
		users.append(data["username"])
		emit('user exists', msg)

@app.route("/")
def index():
	return render_template("index.html", channels_dict = channels_dict, users = users)

@app.route("/channels/<channel>")
def load_chat(channel):
	try:
		for key in messages[channel]:
			for x,y in key.items():
				print("msg recieved")
	except:
		print('Exception caught')
		return('no msg')

	return jsonify(messages[channel])

@app.route("/deluser/<user>")
def deluser(user):
	users.remove(user)
	return('GoodBye!')

@socketio.on("login")
def login(data):
	detail.update({data["username"]: data["logColor"]})
	print(detail)
	emit('logged', detail, broadcast=True)


@socketio.on("add channel")
def channel(data):
	if((data["channel_name"] in channels_dict) or (data["channel_name"] == "general")):
		msg = "Channel already exist"
		emit('raise alert', msg)
	else:
		current_list = []
		current_list.append((data["channel_name"]))
		current_list.append((data["channel_date"]))
		channels_dict.update({data["channel_name"]: data["channel_date"]})
		emit('channel added', current_list, broadcast=True)


@socketio.on("send message")
def send_msg(data):
	inner_dict={}
	msg_detail = []
	msg_detail.append(data["activeChannel"])
	msg_detail.append(data["user"])
	msg_detail.append(data["msg"])
	msg_detail.append(data["time"])
	inner_dict.update({data["msg"]: [data["time"], data["user"]]})
	messages[data["activeChannel"]].append(inner_dict)
	#when msgs of a particular channel reaches 100 then remove the first msg
	if(len(messages[data["activeChannel"]])==100):
		del messages[data["activeChannel"]][0]
	emit('display msg', msg_detail, broadcast=True)
