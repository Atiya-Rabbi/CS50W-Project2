//when DOM is loaded
document.addEventListener('DOMContentLoaded', ()=>{
	
	var c = document.querySelector('#createChannel');
	var x = document.querySelector('#outerdiv');
	var topnav = document.querySelector('#topnav');
	var result = document.querySelector('#result');
	//saybye only when the user deletes itself
	var saybye = document.querySelector('#goodbye');
	saybye.style.display = "none";
	var oldElement;
	//indicates whether to load the home page or not
	var flag=0;
	var home_page;

	// Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    socket.on('connect', ()=>{
    	//load home page
		home_page = flag =>{
			if(flag===0){
				saybye.style.display = "none";
				//do not show login form
				document.querySelector('#popup').remove();
				x.style.display = "block";
				document.querySelector('#typemsg').focus();
				const username = localStorage.getItem('name');
				//greet the user
				greet_user(username);
				//active the user with green dot
				socket.emit('login', {'username': username, 'logColor': "#0dff0d"});
				//get the last activated channel
				let activeChannel = localStorage.getItem('activeChannel');
				//activate the channel you last left 
				activate_channel(activeChannel);
				
				}
		};
    	//if the user is not registred, do not display all content
		if(!localStorage.getItem('name')){
			x.style.display = "none";

			//disable the submit button of form0 until no name is entered
			disable_button(document.querySelector('#submitName'),document.querySelector('#displayName'));
			
			//display the all content of index.html after form0 is submitted
			document.querySelector('#form0').onsubmit= ()=>{
				const name = document.querySelector('#displayName').value;
				//store username
				localStorage.setItem('name', name);

				//store the date of registration ie. date of # general creation
				var r_date = get_date();
				localStorage.setItem('r_date', r_date);
				//activate # general by default on first visit of user
				activate_channel('general');
				
				socket.emit('register user', {'username': name})
				
				//do not load new page after submitting form0
				return false;
			};
			
		}
		//if user already registered
		else{
			flag=0;
			home_page(flag);
		}

		//When add channel form  is submitted
    	document.querySelector('#form1').onsubmit = ()=>{
			let channel_value = document.querySelector('#channelName').value;
			document.querySelector('#channelName').value = '';
			//after values are fetched from form1, close the form
			c.style.display = "none";
			//return to orignal colors
			orignal_colors();
			//store the date when channel created
			var channel_date = get_date();
			socket.emit('add channel', {'channel_name': channel_value , 'channel_date': channel_date});
			return false;
		};

		//send message when enter key is hit
		document.querySelector('#typemsg').addEventListener("keydown", event=>{
			if (event.key == "Enter"){
				if(document.querySelector('#typemsg').value.length>0){
					let currentdate = new Date();
					let time = currentdate.getHours() + ":"  + currentdate.getMinutes();
					let msg = document.querySelector('#typemsg').value;
					let activeChannel = localStorage.getItem('activeChannel');
					const user = localStorage.getItem('name');
					socket.emit('send message', {'user': user, 'msg': msg, 'time': time, 'activeChannel': activeChannel});
					document.querySelector('#typemsg').value = '';
				}
			}
		});
		//when a user clicks offline change the green dot to grey
		document.querySelector('#offline').onclick = ()=>{
			const username = localStorage.getItem('name');
			socket.emit('login', {'username': username, 'logColor': "grey"});
		}
    });
    //add the user to active user list
    socket.on('logged', data=>{
    	for(var key in data){
    		if(data.hasOwnProperty(key)){
    			var value = data[key];
    			document.querySelectorAll('.online').forEach(span =>{
		    		if(span.id === key)
		    			document.querySelector(`#${key}`).style.backgroundColor = `${value}`;
		    	});
    		}
    	}
    	
    });
    //add the channel name to dropdown
    socket.on('channel added', data =>{
		const a = document.createElement('a');
		a.className = "dropdown-item";
		a.innerHTML = `# ${data[0]}`;
		a.dataset.channel = data[0];
		a.dataset.date = data[1];
		document.querySelector('.dropdown-menu').append(a);
		a.onclick = () =>{
			activate_channel(a.dataset.channel);
		}
		return false;
		
	});
    //everytime a new message is recieved display it pink
    socket.on('display msg', data=>{
    	document.querySelectorAll('.dropdown-item').forEach(link =>{
    		if((link.dataset.channel === data[0])&&(link.id === "active")){
    			try{
    				oldElement.style.backgroundColor = "#d8c7eb";
    			}
    			catch(err){
    				console.log("exception caught");
    			}
    			const detail = `<${data[3]} ${data[1]}>: ${data[2]}`;
    			const element = create_append('tr','#yourChat',detail);
    			element.style.backgroundColor = "pink";
    			//keep the scroll to bottom by default
    			updateScroll();
    			oldElement = element;
    		}
    	});
    });
    //if user already exist change the saybye inner html to try again
    socket.on('user exists',data=>{
    	if(data === "user already exists"){
    		flag =1;
    		localStorage.removeItem("name");
    		localStorage.removeItem("r_date");
    		localStorage.removeItem("activeChannel");
    		x.style.display = "none";
    		saybye.style.display = "block";
    		saybye.innerHTML = `${data} ,try again`;
    		document.querySelector('#displayName').value = "";
    	}
    	else{
    		flag=0;
    		home_page(flag);
    	}
    	
    });
    //raise alert
    socket.on('raise alert', data =>{
    	alert(`${data}`);
	});
    
	//toggle the channels dropdown
	document.querySelector('#dropdown').onclick = ()=>{
		var d = document.querySelector('.dropdown-menu');
		if(d.style.display === "none")
			d.style.display = "block";
		else
			d.style.display = "none";
	};

	
	//when + add channel button is clicked, display the create channel form1
	document.querySelector('#addChannel').onclick = ()=>{
		c.style.display = "block";
		document.querySelector('#channelName').focus();
		//fadeout the colors of header, body and sidebar
		document.body.style.backgroundColor = "#9790a0c4";
		topnav.style.backgroundColor= "#676669";
		result.style.backgroundColor= "#6c6a6f";

		//disable the submit form button until channel name is entered
		disable_button(document.querySelector('#submitChannel'),document.querySelector('#channelName'))
	};

	//close form1 and fill in the colors back
	document.querySelector('#closebtn').onclick = ()=>{
		c.style.display = "none";
		orignal_colors();
	};
	//toggle between channels
	document.querySelectorAll('.dropdown-item').forEach(link =>{
		link.onclick = () =>{
			if(link.dataset.channel === "general"){
				activate_channel('general');
			}
			else{
				activate_channel(link.dataset.channel);
			}
			return false;
		};
	});

	//delete the username from users list and tell it goodbye
	document.querySelector('#deluser').onclick = ()=>{
		x.style.display = "none";
		saybye.style.display= "block";
		const user = localStorage.getItem('name');
		console.log(user);
		const request = new XMLHttpRequest();
		request.open('GET', `/deluser/${user}`);
		//clear the local storage
		request.onload = ()=>{
			const response = request.responseText;
			saybye.innerHTML = response;
			localStorage.removeItem("name");
			localStorage.removeItem("r_date");
			localStorage.removeItem("activeChannel");
		};
		request.send();
	};
		
});


//load chat of a particular channel
function load_page(channel){
	//remove the table from DOM to remove previously loaded chats 
	document.querySelector('#yourChat').remove();
	document.querySelector('#typemsg').focus();
	//create a new table
	const t = document.createElement('table');
	t.id = 'yourChat';
	document.querySelector('#appendit').append(t);

	const request = new XMLHttpRequest();
	request.open('GET', `/channels/${channel}`);
	request.onload = () =>{
		const response = JSON.parse(request.responseText);
		for(var i=0; i<response.length; i++){
			for(var key in response[i]){
				if(response[i].hasOwnProperty(key)){
					var value = response[i][key];
					const data = `<${value[0]} ${value[1]}>: ${key}`;
					//append rows to the newly created table
					const element = create_append('tr','#yourChat', data);
					try{
						if(lastuser === value[1])
							element.style.backgroundColor = "#cdbdde";
					}
					catch(err){
						console.log("exception caught");
					}
				}
				lastuser = value[1];
			}
		}
		updateScroll();
	};
	request.send();
}

//fetch current date
function get_date(){
	var currentdate = new Date();
	var cur_date = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " at "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes();
    return cur_date;
}

//return to orignal colors
function orignal_colors(){
	document.body.style.backgroundColor="#d8c7eb";
	topnav.style.backgroundColor= "#4f13a9";
	result.style.backgroundColor= "#6e23de";
}

//greet the user
function greet_user(name){
	const data = `Hello ${name}!`;
	const element = create_append('h5','#greet',data);
}

//activate channels 
function activate_channel(activeChannel){
	//deactivate all channels
	document.querySelectorAll('.dropdown-item').forEach(link =>{
		link.id = "inactive";
		//activate the desired channel
		if(link.dataset.channel === activeChannel){
			link.id = 'active';
			localStorage.setItem('activeChannel',activeChannel);
			if(activeChannel === "general"){
				const date = localStorage.getItem('r_date');
				document.querySelector('#onChannel').innerHTML = `# ${activeChannel} was created on ${date}`;
			}
			else{
				document.querySelector('#onChannel').innerHTML = `# ${activeChannel} was created on ${link.dataset.date}`;
			}
		}
	});
	//load the desired channel
	load_page(activeChannel);
}

//disable submit button when no text in the text area
function disable_button(btn, txtarea){
	btn.disabled = true;
	txtarea.onkeyup = ()=>{
		if(txtarea.value.length > 0)
			btn.disabled = false;
		else
			btn.disabled = true;
	};
}

//create and append html elements
function create_append(c_element, a_element, data){
	const ele = document.createElement(`${c_element}`);
	ele.innerHTML = data;
	document.querySelector(`${a_element}`).append(ele);
	return ele;
}
//scroll to bottom
function updateScroll(){
	var ele = document.querySelector('#appendit');
	ele.scrollTop = ele.scrollHeight;
}
