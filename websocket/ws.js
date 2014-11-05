
(function(port){
	//create the websocket server and start running.
	var WebSocketServer = require('ws').Server;
	var wss = new WebSocketServer({port: port});

	//include filesystem now, used later
	var fs=require('fs');
	
	//initialize client id, counter
	var client=0; 

	var folderName=function(i){
		return 'client_'+("0000000"+i).slice(-7);
	};
	

	//remove all folders that where created from any previous server instances.
	var cleanup=function(i){
		var folder=folderName(i);
		
		fs.exists(folder, (function(folder){ 
			return function (exists) {
				if(exists){
					fs.rmdir(folder);
					cleanup(i+1);
				}
			}; 
		})(folder));
		
	};
	cleanup(0);
	
	

	wss.on('connection', function(ws) {
		var i=1; 
		var cid=client; //this is the current connections id.
		client++; //increment for other connections
		
		var clientsfolder=folderName(cid);
		
		fs.mkdir(clientsfolder);
		var process=function(data, flags){
			if(flags){
				if(flags.binary){  
					fs.writeFile(clientsfolder+"/f_"+('000000'+(i++)).slice(-6)+".png", data, function (err) {
						if (err) throw err;
					});

				}

			}else{
				console.log(data);
			}
		};


		ws.on('message', process);
		ws.send('hello ws');
	});

})(process.argv.length&&(!isNaN(process.argv[0]))?process.argv[0]:8080);
