
(function(port){
	//create the websocket server and start running.
	var WebSocketServer = require('ws').Server;
	var wss = new WebSocketServer({port: port});

	//include filesystem now, used later
	var fs=require('fs');
	var shell = require('child_process');
	
	//initialize client id, counter
	var client=0; 

	var folderName=function(i){
		return 'client_'+('0000000'+i).slice(-7);
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
		
		var clientMode=['command'];
		var clientConfig=[{}];
			
		var mode=function(){
			return clientMode[clientMode.length-1];
		};
		var config=function(){
			return clientConfig[clientConfig.length-1];
		};
		
		var emptyHandler=function(data){
			//discard
		};
		
		var dataHandler=emptyHandler;
		
		var cid=client; //this is the current connections id.
		client++; //increment for other connections
		
		var clientsfolder=folderName(cid);
		
		fs.mkdir(clientsfolder);
		
		console.log('Connected Client: '+(cid)+', with folder: '+clientsfolder+'. mode: '+mode());
		
		
		var process=function(data, flags){
			if(flags){
				if(flags.binary){  
					
					dataHandler(data);

				}else{
					console.log((cid)+": "+data);
					
					if(mode()==='command'){
						
						//basically want to support a number of data stream types, 
						//for html5 it is not possible(?) to stream encoded video data, so support
						//for image frames is necessary
						
						if(data.indexOf('begin captureimageframes')===0){
							
							//arguments should be parsed from data, eg data might be: 'begin captureimageframes -fps 10 -mime png'
							
							clientMode.push('captureimageframes');
							clientConfig.push({
								ext:"png",
								fps:10
							});
							dataHandler=(function(){ 
								var i=1;
								return function(data){
									var opts=config();
									fs.writeFile(clientsfolder+'/f_'+('000000'+(i++)).slice(-6)+'.'+opts.ext, data, function (err) {
										if (err) throw err;
									});	
								}; 
							})();
							
							console.log((cid)+': mode: '+mode());
							
						}else if(data.indexOf('export')===0){
													
							var out=clientsfolder+'/out.mp4';
							var cmd='ffmpeg -framerate 10 -i '+clientsfolder+'/f_%06d.png -c:v libx264 -r 30 -pix_fmt yuv420p '+out;
							
							shell.exec(cmd, function (error, stdout, stderr) {
							    console.log('shell.exec: '+cmd+' >> ');
							    console.log('stdout: '+stdout);
							    console.log('stderr: '+stderr);
							    if (error !== null) {
							      console.log('exec error: ' + error);
							    }
							    
							    
							   fs.exists(out, function(exists){
							    	if(exists){
							    		
							    		fs.readFile(out, function (err, data) {
							    			
							    			  if (err) {
							    				  throw err;
							    			  }
							    			  ws.send(data, function(){
							    				  
							    				  fs.readdir(clientsfolder,function(err, files){
							  						if(err){
							  							console.log('Error reading dir: '+clientsfolder);
							  						}else{
							  							files.forEach(function(f){
							  								fs.unlink(clientsfolder+'/'+f,function(err){
							  									if(err){
							  										throw err;
							  									}else{
							  										//console.log('Deleted: '+folder+'/'+f);
							  										//too much logging...
							  									}
							  								});
							  							});
							  						}
							    				  });
							    				  
							    				  
							    			  });
							    			});
							    		
							    		
							    	}
							    });
	
							    
							    	
							});
							
						}
						
						
					}else{
						
						if(data==='stop'){
							
							clientMode.pop();
							clientConfig.pop();
							dataHandler=emptyHandler;
							
							console.log((cid)+': mode: '+mode());
							
						}
						
					}
					
					
					
				}

			}else{
				
				console.log(data);
			}
		};


		ws.on('message', process);
		
		ws.on('close',function(code, message){
			
			console.log('Closed Connection: '+cid+':'+code+' '+message);
			cleanup(cid);
		});
	});

})(process.argv.length&&(!isNaN(process.argv[0]))?process.argv[0]:8080);
