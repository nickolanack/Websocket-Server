
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
	//this does not work for non-empty folders
	var cleanup=function(){
		
		var i=0, recurse=false;
		if(arguments.length){
			i=arguments[0];
		}else{
			recurse=true;
		}
		
		var folder=folderName(i);
		
		fs.exists(folder, (function(folder){ 
			return function (exists) {
				if(exists){
					fs.readdir(folder,function(err, files){
						if(err){
							console.log('Error reading dir: '+folder);
						}else{
							files.forEach(function(f){
								fs.unlink(folder+'/'+f,function(err){
									if(err){
										throw err;
									}else{
										//console.log('Deleted: '+folder+'/'+f);
										//too much logging...
									}
								});
							});
							
							fs.rmdir(folder,function(err){
								if(err){
									throw err;
								}else{
									console.log('Deleted: '+folder+'/');
								}
							});
							if(recurse===true){
								cleanup(i+1);
							}
						}
					});
					
				}
			}; 
		})(folder));
		
	};
	cleanup(); //need to empty folders
	
	

	wss.on('connection', function(ws) {
		var i=1; 
		var clientMode=['command'];
		var clientConfig=[{}];
		
		console.log("Connected Client: "+cid);
		
		var mode=function(){
			return clientMode[clientMode.length-1];
		};
		var config=function(){
			return clientConfig[clientConfig.length-1];
		};
		
		var cid=client; //this is the current connections id.
		client++; //increment for other connections
		
		var clientsfolder=folderName(cid);
		
		fs.mkdir(clientsfolder);
		
		console.log("Connected Client: "+cid+', with folder: '+clientsfolder);
		
		
		var process=function(data, flags){
			if(flags){
				if(flags.binary){  
					fs.writeFile(clientsfolder+"/f_"+('000000'+(i++)).slice(-6)+".png", data, function (err) {
						if (err) throw err;
					});

				}

			}else{
				if(mode()==="command"){
					
				}else{
					
				}
				console.log(data);
			}
		};


		ws.on('message', process);
		ws.send('hello ws');
		ws.on('close',function(code, message){
			
			console.log('Closed Connection: '+cid+':'+code+' '+message);
			cleanup(cid);
		});
	});

})(process.argv.length&&(!isNaN(process.argv[0]))?process.argv[0]:8080);
