import _ from './dotenv';
import bodyParser from 'body-parser';
import exphbs from 'express-handlebars';
import express from 'express';
import Handlebars from 'handlebars';
import favicon from 'serve-favicon';
import flash from 'connect-flash';
import http from 'http';
import logger from 'morgan';
import path from 'path';
import sassMiddleware from 'node-sass-middleware';
import session from 'express-session';

import * as handlebarsHelpers from './server/lib/handlebars-helpers';
import router from './server/routes';

const app = express();

Handlebars.registerHelper(handlebarsHelpers);

const hbs = exphbs.create({ defaultLayout: 'main', extname: '.html' });

app.engine('html', hbs.engine);

app.set('view engine', 'html');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(favicon(path.join(__dirname, 'client', 'favicons', 'favicon.ico')));

app.use(logger('dev'));

app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

app.use(flash());

app.use(
	sassMiddleware({
		src: path.join(__dirname, 'client', 'stylesheets'),
		dest: path.join(__dirname, 'client', 'public'),
		prefix: '/stylesheets',
		debug: true
	})
);

app.use(express.static(path.join(__dirname, 'client', 'public')));

app.use('/', router);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {

	const err = new Error('Not Found');

	err.status = 404;

	next(err);

});

// Error handlers
// Development error handler - will print stacktrace
if (app.get('env') === 'development') {

	app.use(function (err, req, res, next) {

		console.log(err);

		const errStatus = err.status || 500;

		const errMsg = `${errStatus} Error: ${err.message}`;

		res.status(errStatus);

		res.render('error', {
			page: { title: errMsg },
			message: errMsg,
			error: err
		});

	});

}

// Production error handler - no stacktraces leaked to user
app.use(function (err, req, res, next) {

	const errStatus = err.status || 500;

	const errMsg = `${errStatus} Error: ${err.message}`;

	res.status(errStatus);

	res.render('error', {
		page: { title: errMsg },
		message: errMsg,
		error: {}
	});

});

const normalizePort = val => {

	const port = parseInt(val, 10);

	if (isNaN(port)) return val;

	if (port >= 0) return port;

	return false;

};

const onError = error => {

	if (error.syscall !== 'listen') throw error;

	const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}

};

const onListening = () => {

	const addr = server.address();

	const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;

	console.log('Listening on ' + bind);

};

const port = normalizePort(process.env.PORT || '3000');

app.set('port', port);

const server = http.createServer(app);

server.listen(port);

server.on('error', onError);

server.on('listening', onListening);
