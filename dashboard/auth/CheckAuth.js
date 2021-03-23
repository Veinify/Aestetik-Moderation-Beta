const nonsecurePath = require('../nonsecurePath')
module.exports = async (req, res, next) => {
	if(nonsecurePath.includes(req.path)) {
	    return next();
	} else if(req.session.user){
		return next();
	} else {
		const redirectURL = ((req.originalUrl.includes("login") || req.originalUrl === "/") ? "/selector" : req.originalUrl);
		const state = Math.random().toString(36).substring(5);
		req.client.states[state] = redirectURL;
		return res.redirect(`/api/login?state=${state}`);
	}
};
