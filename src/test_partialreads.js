var Dat = require('dat-node');

var tmpDir = require('temporary-directory');

var port=process.env.PORT||3288;


setTimeout(function() {
	var N=1e7;
	var tests=[];
	for (var jj=0; jj<8; jj++) {
		tests.push({start:N*jj,end:N*(jj+1)-1});
	}
	console.log(tests);
	var test_index=0;
	next_test();
	function next_test() {
		if (test_index<tests.length) {
			run_test(tests[test_index++],function() {
				next_test();
			});
		}
		else {
			console.log('done.');
		}
	}
},1000);

function run_test(test0,callback) {
	var test_dat_key = '43681050547fef1cb4b204e853a9cdd44d3d626d314e1bb9da411aee645415ad'
    var test_filename = 'output_eaa36e5107621c75f563e2490221186427b96c45_timeseries_out'
    var test_req = {
      headers : {
        "range" : `bytes=${test0.start}-${test0.end}`
      }
    }
    get_dat(test_dat_key,function(dat) {
	    var test_fname='./test.data';
	    var test_res = require('fs').createWriteStream (test_fname)
		serve_file(test_dat_key,test_filename,test_req,test_res,function(err) {
			if (err) {
				console.error('Error serving dat file: '+err);
			}
			console.log ('file has been served')
			var stat=require('fs').statSync(test_fname);
			console.log(`File size: ${stat.size}..... Expected: ${test0.end-test0.start+1}`);
			callback();
		});
	});
}

function get_dat(dat_key,callback) {
	Dat(__dirname+'/does_not_exist_but_doesnt_need_to', {
		key:dat_key,
		sparse:true,
		temp:true
	}, function (err, dat) {
		if (err) {
			throw `Error initializing dat: `+err.message;
		}
		console.log (`Joining dat network (${dat_key})...`);
		dat.joinNetwork(function(err) {
			if (err) {
				throw 'Error joining network: '+err.message;
			}
			console.log ('joined dat network.');
			callback(dat);
		});
	});
}

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