var async=require('async');

exports.serve_file=serve_file;

const express = require('express');
const app = express();
app.set('json spaces', 4);
var port=process.env.PORT||3289;

var dat_storage_path=process.env.DFS_STORAGE_PATH||(__dirname+'/../.dats');
create_directory_if_needed(dat_storage_path);

const DatLibrarian = require('dat-librarian')
const LIBRARIAN = new DatLibrarian({ dir: dat_storage_path, dat: {sparse:true} })

app.get('/api/add/:key',function(req,res) {
	var params=req.params;
	console.log (`Adding dat with key=${params.key}`)
	LIBRARIAN.add(params.key)
	.then(
		(dat) => {
			console.log (`Successfully added dat with key=${params.key}`)
			res.json({ success: true, message:`Added dat with key=${params.key}` });
		},(err)=> {
			console.error(`Problem adding dat with key=${params.key}: ${err.message}`)
			res.json({ success:false, error:err.message })
		}
	);
});

app.get('/api/remove/:key',function(req,res) {
	var params=req.params;
	console.log (`Removing dat with key=${params.key}`)
	LIBRARIAN.remove(params.key)
	.then(
		(dat) => {
			console.log (`Successfully removed dat with key=${params.key}`)
			res.json({ success: true, message:`Removed dat with key=${params.key}` });
		},(err)=> {
			console.error(`Problem removing dat with key=${params.key}: ${err.message}`)
			res.json({ success:false, error:err.message })
		}
	);
});

app.get('/api/list',function(req,res) {
	var keys=LIBRARIAN.list();
	res.json({success:true,keys:keys});
});

app.get('/api/readdir/:key/:directory',function(req,res) {
	var params=req.params;
	handle_readdir(params.key,params.directory,req,res);
});

app.get('/api/readdir/:key/',function(req,res) {
	var params=req.params;
	handle_readdir(params.key,'',req,res);
});
	
function handle_readdir(key,directory,req,res) {
	LIBRARIAN.get(key)
	.then(
		(dat) => {
			dat.archive.readdir(directory,function(err,list) {
				if (err) {
					res.json({success:false,error:err.message});
					return;
				}
				var files=[],dirs=[];
				async.forEach(list,function(item,cb) {
					if ((item=='.')||(item=='..')) {
						cb();
						return;
					}
					dat.archive.stat(require('path').join(directory,item),function(err0,stat0) {
						if (err0) {
							res.json({success:false,error:`Error in stat of file ${item}: ${err0.message}`});
							return;
						}
						if (stat0.isFile()) {
							files.push({
								name:item,
								size:stat0.size
							});
						}
						else if (stat0.isDirectory()) {
							dirs.push({
								name:item
							});
						}
						cb();
					});
				},function() {
					res.json({success:true,files:files,dirs:dirs});	
				});
			});
		},(err)=> {
			res.json({success:false,error:'Error retrieving dat: '+err.message});
		}
	);
}

app.get('/download/:key/:filename',function(req,res) {
	var params=req.params;
	LIBRARIAN.get(params.key)
	.then(
		(dat) => {
			serve_file(dat,params.filename,req,res,function(err) {
				if (err) {
					console.error('Problem serving file: '+err);
				}
			});
		},(err)=> {
			res.json('TODO: better handling: '+err.message);
		}
	);
});

app.use('/web', express.static('web'))

function serve_file(dat,filename,req,res,callback) {
	console.log('serve_file',filename);
	var range=parse_range_header(req.headers.range||'');
	console.log('creating read stream...');
	var stream = dat.archive.createReadStream(filename, {
		start:range.start,
		end:range.end
	});
	if (res.setHeader) {
		res.setHeader("content-type", "application/octet-stream");
	}
	console.log('stream.pipe...');
	stream.pipe(res);
	stream.on('end',function() {
		console.log('on end');
		if (callback) callback(null);
		callback=null;
	});
	stream.on('error',function(err) {
		console.log('on error');
		if (callback) callback('Error: '+err);
		callback=null;
	});
}

async.series([
	initialize,
	start_server
]);

function initialize(callback) {
	console.log ('Initializing librarian...')
	LIBRARIAN.load()
	.then(() => {
		callback(null);
	});
}

function start_server(callback) {
	// Start Server
	app.listen(port, function() {
		console.log (`Listening on port ${port}`);
	});
}

function parse_range_header(str) {
	var ret={
	  start:undefined,
	  end:undefined
	};
	var list=(str||'').split('=');
	if (list.length!=2) return ret;
	if (list[0]=='bytes') {
	  var list2=list[1].split('-');
	  if (list2.length!=2) return ret;
	  return {
	    start:Number(list2[0]),
	    end:Number(list2[1])
	  };
	}
}

function create_directory_if_needed(path) {
	if (!require('fs').existsSync(path)) {
		require('fs').mkdirSync(path);
	}
}