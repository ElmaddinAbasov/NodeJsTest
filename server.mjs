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
	#defaultApiHtml = "/auth_api/api.html";
	#port;
	#regHtmlPath;
	#authHtmlPath;
	#apiHTML;
	#getUserByIdPath;
	#httpServer;
	#object = {};
	#authObject = {};
	#authApiOption = {};
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
		this.#authApiOption.flag = false;
		this.#port = this.#defaultHttpPort;
		this.#regHtmlPath = this.#defaultRegHtmlPath;
		this.#authHtmlPath = this.#defaultAuthHtmlPath;
		this.#apiHTML = this.#defaultApiHtml;
		this.#getUserByIdPath = this.#defaultGetUserByIdPath;
		this.#db = new databaseHandler();
	}
	async preparation()
	{
		let promise;
		promise = this.#db.setup(this.#postgresDefault, this.#newDatabase, { q : "create tb", attribute : [ 
                                                "users_info ( ", "user_id SERIAL PRIMARY KEY, ",
                                                "last_name varchar(255) NOT NULL, ", "first_name varchar(255) NOT NULL, ",
                                                "paternal_name varchar(255) NOT NULL, ", "email varchar(255) NOT NULL UNIQUE, ",
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
		let path, file;

		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});

		switch (req.url)
		{
			case '/reg.html' :

				path = join(dirname(argv[1]), this.#regHtmlPath);
				file = this.#serverReadFile(res, path);
				break;

			case '/auth.html' :

				path = join(dirname(argv[1]), this.#authHtmlPath);
				file = this.#serverReadFile(res, path);
				break;

			case '/id.html' :
                                path = join(dirname(argv[1]), this.#getUserByIdPath);
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

				res.writeHead(200, {
					'Content-Type' : 'text/html'
				});
				res.end('<h1>Success<h1>', 'UTF-8', () => {});
                       		return new Promise(resolve => {
                                	req.on('end', () => {
                                        	const formData = parse(body);
                                        	resolve(this.#createObject(formData));
                                	})
                        	})

			case '/auth/submit' :
				req.on('data', chunk => {
					body += chunk.toString();
				})
				this.#httpReqResObject.req = req;
				this.#httpReqResObject.res = res;
				return new Promise(resolve => {
					req.on('end', () => {
						const formData = parse(body);
						resolve(this.#initObject(this.#authObject, formData));
					})
				});
			case '/auth_api/submit'	:
				req.on('data', chunk => {
					body += chunk.toString();
				})
				this.#httpReqResObject.req = req;
				this.#httpReqResObject.res = res;
				return new Promise(resolve => {
					req.on('end', () => {
						const formData = parse(body);
						this.#authApiOption.option = formData.auth_api_option;
						this.#authApiOption.value = formData.value;
						this.#authApiOption.flag = true;
						resolve(this.#authApiOption);
					})
				})
                }
	}

	async #serverRun(req, res)
	{
		if (req.method === 'GET')
			this.#handleGetMethod(req, res);			//handle only GET request for now

		if (req.method === 'POST')
			return this.#handlePostMethod(req, res);
	}

	async #writeToATable()
	{
		if (this.#object.flag)
		{
			console.log("insertIntoTable");
			this.#db.runParameterisedQuery({ q : "INSERT INTO " + this.#tableName + "(last_name, first_name, paternal_name," 
				+ "email,passwd, role, status)" + " VALUES ($1, $2, $3, $4, $5, $6, $7)", attribute : 
				[this.#object.last_name, this.#object.first_name, this.#object.paternal_name, 
				this.#object.email, this.#object.passwd, this.#object.role, this.#object.status]});
			this.#object.flag = false;
			return new Promise(resolve => {
				resolve(1);
			})

		}
	}

	#initAuthObject(data)
	{
		this.#authObject.last_name = data.rows[0].last_name;
               	this.#authObject.first_name = data.rows[0].first_name;
                this.#authObject.paternal_name = data.rows[0].paternal_name;
                this.#authObject.role = data.rows[0].role;
                this.#authObject.status = data.rows[0].status;
		this.#authObject.flag = false;
	}

	async #checkAuthorisation()
	{
		let path, file, promise;
		if (this.#authObject.flag)
		{
			promise = this.#db.runParameterisedQuery({q : "SELECT last_name, first_name, paternal_name, email, passwd, role, status FROM " + this.#tableName + " WHERE email = $1 AND passwd = $2", attribute : [this.#authObject.email, this.#authObject.passwd]});
			promise.then(queryResult => {
				if (!queryResult.rows.length)
				{
					this.#httpReqResObject.res.writeHead(400, {
						'Content-Type' : 'text/html'
					});

					this.#httpReqResObject.res.end('<h1>ERROR: Failed to authorise. No such user</h1>');
					throw new Error('ERROR: Failed to authorise. No such user');
				}
				if (queryResult.rows[0].email === this.#authObject.email && queryResult.rows[0].passwd === this.#authObject.passwd)
				{
					path = join(dirname(argv[1]), this.#apiHTML);
					this.#httpReqResObject.res.writeHead(200, {
						'Content-Type' : 'text/html'
					});
					this.#serverReadFile(this.#httpReqResObject.res, path);
				}
				this.#initAuthObject(queryResult)
			})
			.catch(error => {
				console.error("ERROR : ", error);
			})
		}
		return new Promise(resolve => {
			resolve(1);
		})
	}

	async #returnListOfUsers()
	{
		let result;
		result = await this.#db.runSimpleQuery({q : "select_all", attribute : ["users_info;"]});
		return result;
	}

	#buildString(data, i)
	{
		return "<tr><td>" + data.rows[i].last_name + "</td>"+ "<td>"+ data.rows[i].first_name+ "</td>"+ "<td>"+ data.rows[i].paternal_name+ "</td>"+ "<td>"+ data.rows[i].email+ "</td>"+ "<td>"+ data.rows[i].passwd+ "</td>"+ "<td>"+ data.rows[i].role+ "</td>"+ "<td>"+ data.rows[i].status+ "</tr>";
	}

	#returnTableOfUsers(data)
	{
		let i, string = '<style>table{border-collapse:collapse;width: 100;border:1px solid black;}th,td{text-align:left;padding:8px;border:1px solid black;border-collapse:collapse;}tr:nth-child(even){background-color:#D6EEEE}</style><table><tr><th>last_name</th><th>first_name</th><th>paternal_name</th><th>email</th><th>passwd</th><th>role</th><th>status</th>';
		for (i = 0; i < data.rows.length; i++)
			string += this.#buildString(data, i);
		string += "</table>";
		return string;
	}

	async #serverApiOption()
	{
		let data, result;
		if (this.#authApiOption.flag)
		{
			switch (this.#authApiOption.option)
			{
				case 'get_user_by_id' :
					this.#httpReqResObject.res.writeHead(200, {
						'Content-Type' : 'text/html'
					});
					if (this.#authObject.role === 'admin')
					{
						result = await this.#db.runParameterisedQuery({q : 'SELECT * FROM users_info WHERE user_id=$1', attribute : [this.#authApiOption.value]});
							this.#httpReqResObject.res.end(`User Info : 
								<p>last_name : ${result.rows[0].last_name}</p>
								<p>first_name : ${result.rows[0].first_name}</p>
								<p>paternal_name : ${result.rows[0].paternal_name}</p>
								<p>email : ${result.rows[0].email}</p>
								<p>role : ${result.rows[0].role}</p>
								<p>status : ${result.rows[0].status}</p>`);
					}
					if (this.#authObject.role === 'user')
					{
						this.#httpReqResObject.res.end(`
							<h1>Information about the user :</h1><br>
							<p>last_name : ${this.#authObject.last_name}</p>
							<p>first_name : ${this.#authObject.first_name}</p>
							<p>paternal_name : ${this.#authObject.paternal_name}</p>
							<p>email : ${this.#authObject.email}</p>
							<p>role : ${this.#authObject.role}</p>
							<p>status : ${this.#authObject.status}</p>`);
					}
					break;
				case 'get_list_of_users' :
					if (this.#authObject.role === 'admin')
					{
						this.#httpReqResObject.res.writeHead(200, {
                                                	'Content-Type' : 'text/html'
                                        	});
						data = await this.#returnListOfUsers();
						this.#httpReqResObject.res.end("<h1>List Of Users:</h1><br>"+this.#returnTableOfUsers(data), 'UTF-8', () => {});
					}
					break;
				case 'block_user' ://just any user or user itself inactive
					this.#httpReqResObject.res.writeHead(200, {
						'Content-Type' : 'text/html'
					})
					if (this.#authObject.role === 'admin')
					{
						result = await this.#db.runParameterisedQuery({q : `UPDATE ` + this.#tableName + ` SET status='inactive' WHERE email=$1`, attribute : [this.#authApiOption.value]});	
						this.#httpReqResObject.res.end(`<h1>User ${this.#authApiOption.value} was blocked</h1>`);
					}
					if (this.#authObject.role === 'user')
					{
						result = await this.#db.runParameterisedQuery({q : `UPDATE ` + this.#tableName + ` SET status='inactive' WHERE email=$1`, attribute : [this.#authObject.email]}); 
						this.#httpReqResObject.res.end(`<h1>User ${this.#authObject.email} was blocked</h1>`);
					}
					break;
			}
		}
	}

	async #serverWorking(req, res)
	{
		let result;
		console.log("serverWorking");
		await this.#serverRun(req, res);
		await this.#writeToATable();		
		result = await this.#checkAuthorisation();	
		if (result)
			await this.#serverApiOption();
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
