import {Client} from 'pg'
import {queries} from './queries.mjs'
export class databaseHandler
{
	#client;
	#sqlQueries;
	#tableName = 'users_info';
	#dbName = 'users_db';
	#admin = {};
	#buildClient(clientInfo)
	{
		return new Client({
			user : clientInfo.user,
			password : clientInfo.password,
			host : clientInfo.host, 
			port : 5432,
			database : clientInfo.database
		});
	}

	async #init()
	{
		try
		{
			return await this.#client.connect();
		}
		catch (error)
		{
			console.error('ERROR: async #init() failed to connect to a default database - postgres : ', error);
		}
	}
	
	async #runQuery(query)
	{
		let value;
		try
		{
			value = this.#sqlQueries.get_value(query.q);
			if (value === null || value === undefined)
			{
				console.error("ERROR: In function async #runQuery() query " + query.q + " query doesnt exsist ");
				return;
			}
			return await this.#client.query(value + query.attribute);
		}
		catch(error)
		{
			console.error("ERROR: in async #runQuery failed to run a query " + error);
		}
	}

	async #runQueryWithParams(query, value)
	{
		let promise;
		try
		{
			return await this.#client.query(query, value);
		}
		catch (error)
		{
			console.error("ERROR: in async #runQueryWithParams failed to run a query " + error)
		}
	}

	async #close()
	{
		try
		{
			return await this.#client.end();
		}
		catch (error)
		{
			console.error('ERROR: async #close() failed to close a database connection : ', error, client.database);
		}
	}

	async #checkIfDatabaseExsist()
	{
		let result, i;
		result = await this.#client.query(`SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'users_db');
`);
		return result.rows[0];
	}

	async #checkIfTableExsist()
	{
		let result, i;
		result = await this.#client.query("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users_info')");
		return result.rows[0];
	}

	constructor()
	{
		this.#admin.last_name = '__admin__';
		this.#admin.first_name = '__admin__';
		this.#admin.paternal_name = '__admin__';
		this.#admin.email = '__admin@__';
		this.#admin.passwd = '__admin__';
		this.#admin.role = 'admin';
		this.#admin.status = 'active';
	}

	async runParameterisedQuery(query)
        {
                let result;
		result = await this.#runQueryWithParams(query.q, query.attribute);
		return result;
        }

	async runSimpleQuery(query)
	{
		let result;
		result = await this.#runQuery(query);
		return result;
	}

	async setup(clientInfo1, clientInfo2, info)
	{
		let result, query = {};
		query.q = info.q;
		this.#sqlQueries = new queries();
		query.attribute = this.#sqlQueries.constrcutAQuery(info.attribute);
		this.#client = this.#buildClient(clientInfo1);
		await this.#init();
		result = await this.#checkIfDatabaseExsist();
		if (!result.exists)
			await this.#runQuery({ q : "create db", attribute : 'users_db'});
		
		await this.#close();
		this.#client = this.#buildClient(clientInfo2);
		await this.#init();
		result = await this.#checkIfTableExsist();
		if (!result.exists)
		{
                	await this.#runQuery(query);
			await this.runParameterisedQuery({ q : "INSERT INTO " + this.#tableName + "(last_name, first_name, paternal_name,"
                                + "email,passwd, role, status)" + " VALUES ($1, $2, $3, $4, $5, $6, $7)", attribute :
                                [this.#admin.last_name, this.#admin.first_name, this.#admin.paternal_name,
                                this.#admin.email, this.#admin.passwd, this.#admin.role, this.#admin.status]});
		}
		return new Promise(resolve => {
			resolve(1)
		})
	}

	async closeConnection()
	{
		await this.#close();
	}
}
