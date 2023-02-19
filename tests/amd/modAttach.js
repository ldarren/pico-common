var
	modClass=require('modClass'),
	p

exports.a=function(){
	if (!p) return 'not in node.js'
	return 'modAttach:'+p.argv[0]
}
exports.b=function(){
	return (new modClass).a()
}
this.load=function(){
	if ('undefined' !== typeof process) p=process
	console.log('modAttach loaded!')
}
