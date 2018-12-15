pico.run({
	env:{
	},
	paths:{
		'*':'./',
		'node':function(name,cb){
			console.log('path',name)
			cb(null, pico.import(name))
		}
	}
},
function(){
	require('modAttach')
	require('modClass')
})
