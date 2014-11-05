
(function(){
	var WebSocketServer = require('ws').Server;
	var wss = new WebSocketServer({port: 8080});
	
	var fs=require('fs');


	var client=0;

	wss.on('connection', function(ws) {
	var i=1;
	var cid=client; client++;
	var cfolder='client_'+("0000000"+cid).slice(-7);
	fs.mkdir(cfolder);
 	var process=function(data, flags){
                if(flags){
                        if(flags.binary){
                                var l=data.length;
                                fs.writeFile(cfolder+"/f_"+('000000'+(i++)).slice(-6)+".png", data, function (err) {
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

})();
