import {createServer} from "http"
import {readFile} from "fs"
import {parse} from "querystring"
import {argv} from "process"
import {dirname, join} from "path"
import {databaseHandler} from './database.mjs'
class server
{
	#defaultHttpPort = 8080;
	#defaultRegHtmlPath = "/user_reg/reg.html";
	#defaultAuthHtmlPath = "/user_auth/auth.html";
	#defaultGetUserByIdPath = "/get_user_by_id/id.html";
	#port;
	#regHtmlPath;
	#authHtmlPath;
	#getUserByIdPath;
	#httpServer;
	#object = {};
	#authObject = {};
	#httpReqResObject = {};
	#db;
	#dbPassword = 'db1996';
	#tableName = 'users_info';

	#postgresDefault = {
        	user : 'postgres',
        	password : this.#dbPassword,
        	host : 'localhost',
        	database : 'postgres'
	};

	#newDatabase = {
        	user : 'postgres',
        	password : this.#dbPassword,
        	host : 'localhost',
        	database : 'users_db'
	};

	#createObject(data)
	{
		this.#object.last_name = data.last_name;
       		this.#object.first_name = data.first_name;
       		this.#object.paternal_name = data.paternal_name;
        	this.#object.email = data.email;
        	this.#object.passwd = data.passwd;
        	this.#object.role = data.role;
        	this.#object.status = data.status;
		this.#object.flag = true;
	}

	constructor()
	{
		this.#object.flag = false;
		this.#authObject.flag = false;
		this.#httpReqResObject.res = '';
		this.#httpReqResObject.req = '';
		this.#port = this.#defaultHttpPort;
		this.#regHtmlPath = this.#defaultRegHtmlPath;
		this.#authHtmlPath = this.#defaultAuthHtmlPath;
		this.#getUserByIdPath = this.#defaultGetUserByIdPath;
		this.#db = new databaseHandler();
	}
	async preparation()
	{
		let promise;
		promise = this.#db.setup(this.#postgresDefault, this.#newDatabase, { q : "create tb", attribute : [ 
                                                "users_info ( ", "user_id SERIAL PRIMARY KEY, ",
                                                "last_name varchar(255) NOT NULL, ", "first_name varchar(255) NOT NULL, ",
                                                "paternal_name varchar(255) NOT NULL, ", "email varchar(255) NOT NULL, ",
                                                "passwd varchar(255) NOT NULL, ", "role varchar(255) NOT NULL, ",
                                                "status varchar(255) NOT NULL );"
                                       ]});
		return promise;
	}

	#serverReadFile(res, path)
	{
		let file;
		file = readFile(path, 'utf-8', (err, data) => {
                                        res.end(data, 'UTF-8', () => {
                                        console.log("finished\n");
                                      });
                                });
		return file;
	}

	async #handleGetMethod(req, res)
	{
		console.log("#handleHTTPMethods\n");
		let path, file;

		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});

		switch (req.url)
		{
			case '/reg.html' :

				path = join(dirname(argv[1]), this.#regHtmlPath);
				//test
				file = this.#serverReadFile(res, path);
				break;

			case '/auth.html' :

				path = join(dirname(argv[1]), this.#authHtmlPath);
				//test
				file = this.#serverReadFile(res, path);
				break;

			case '/id.html' :
                                path = join(dirname(argv[1]), this.#getUserByIdPath);
                                //test
                                file = this.#serverReadFile(res, path);
                                break;
		}
	}

	#initObject(object, data)
	{
		object.email = data.email;
		object.passwd = data.passwd;
		object.flag = true;
	}

	async #handlePostMethod(req, res)
	{
		let body, file, path;
		body = '';

		switch (req.url)
		{
			case '/reg/submit' :

                        	req.on('data', chunk => {
                                	body += chunk.toString();
                        	});

				//test again
				res.writeHead(200, {
					'Content-Type' : 'text/html'
				});
				res.end('<h1>Success<h1>', 'UTF-8', () => {});
                        	console.log("end");
                       		return new Promise(resolve => {
                                	req.on('end', () => {
                                        	const formData = parse(body);
                                        	console.log('Received data:', formData);
                                        	resolve(this.#createObject(formData));
                                	})
                        	})

			case '/auth/submit' :
				req.on('data', chunk => {
					body += chunk.toString();
				})
				//new
				this.#httpReqResObject.req = req;
				this.#httpReqResObject.res = res;
				return new Promise(resolve => {
					req.on('end', () => {
						const formData = parse(body);
						console.log('Recieved data : ', formData);
						resolve(this.#initObject(this.#authObject, formData));
					})
				});
//take this peace of code and put it inside a function				
/*				res.writeHead(200, {
					'Content-Type' : 'text/html'
				});
                                path = join(dirname(argv[1]), this.#getUserByIdPath);
                                file = this.#serverReadFile(res, path);				
				break;
*/
			case '/user_id/submit' :
				req.on('data', chunk => {
					body += chunk.toString();
				})

				req.on('end', () => {
					const formData = parse(body);
					console.log('Recieved data : ', formData);
				})

				res.writeHead(200, {
					'Content-Type' : 'text/html'
				});

				res.end('<h1>Haha</h1>', 'UTF-8', () => {});
				break;
                }
	}

	async #serverRun(req, res)
	{
		console.log("start");

		if (req.method === 'GET')
			this.#handleGetMethod(req, res);			//handle only GET request for now

		if (req.method === 'POST')
			return this.#handlePostMethod(req, res);
	}

	async #writeToATable()
	{
		console.log("async #writeToATable()\n");
		if (this.#object.flag)
		{
			console.log("insertIntoTable");
			this.#db.insertIntoTable({ q : "INSERT INTO " + this.#tableName + "(last_name, first_name, paternal_name," 
				+ "email,passwd, role, status)" + " VALUES ($1, $2, $3, $4, $5, $6, $7)", attribute : 
				[this.#object.last_name, this.#object.first_name, this.#object.paternal_name, 
				this.#object.email, this.#object.passwd, this.#object.role, this.#object.status]});

			return new Promise(resolve => {
				resolve(1);
			})

		}
	}

	async #checkAuthorisation()
	{
		let path, file;
		console.log("async #checkAuthorisation()\n");
		if (this.#authObject.flag)
		{
                                
                        this.#httpReqResObject.res.writeHead(200, {
				'Content-Type' : 'text/html'
                        });
                        this.#httpReqResObject.res.end('<h1>Successful Authorisation<h1>', 'UTF-8', () => {});			
			console.log(this.#authObject);
		}
		return new Promise(resolve => {
			resolve(1);
		})
	}

	async #serverWorking(req, res)
	{
		console.log("serverWorking");
		await this.#serverRun(req, res);
		await this.#writeToATable();		//make changes also here
		await this.#checkAuthorisation();	//new
	}

	createHttpServer()
	{
		this.#httpServer = createServer((req, res) => {
			this.#serverWorking(req, res);
		});
	}

	listenForIncomingConnection()
	{
		this.#httpServer.listen(this.#port, 'localhost', () => {
			console.log(`Server is listening on a port ${this.#port}`);
		})
	}
}

const simpleServer = new server();
let promise = simpleServer.preparation();
promise.then(result => {
	simpleServer.createHttpServer();
	simpleServer.listenForIncomingConnection();
});
